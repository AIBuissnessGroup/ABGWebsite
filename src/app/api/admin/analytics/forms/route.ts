import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { isAdmin } from '@/lib/admin';

const client = createMongoClient();

interface QuestionAnalytics {
  questionId: string;
  questionTitle: string;
  questionType: string;
  responseCount: number;
  uniqueResponses: number;
  responseDistribution: { [value: string]: number };
  averageLength?: number;
  mostCommonResponse?: string;
  skipRate: number;
}

interface FormAnalytics {
  formId: string;
  formTitle: string;
  formSlug: string;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  responsesByDate: { [date: string]: number };
  responsesByStatus: { [status: string]: number };
  questionAnalytics: QuestionAnalytics[];
  demographics: { [field: string]: { [value: string]: number } };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await client.connect();
    const db = client.db();

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      dateFilter.$lte = end;
    }

    // Build application filter
    const applicationFilter: any = {};
    if (formId) {
      applicationFilter.formId = formId;
    }
    if (Object.keys(dateFilter).length > 0) {
      applicationFilter.submittedAt = dateFilter;
    }

    // Get forms
    const formsFilter: any = {};
    if (formId) {
      formsFilter.id = formId;
    }
    const forms = await db.collection('Form').find(formsFilter).toArray();

    // Get applications
    const applications = await db.collection('Application').find(applicationFilter).toArray();
    console.log(`Analytics API: Found ${applications.length} applications for filter:`, applicationFilter);

    // Process analytics for each form
    const analytics: FormAnalytics[] = forms.map(form => {
      const formApplications = applications.filter(app => app.formId === form.id);
      const formQuestions = form.questions || [];
      
      console.log(`Form "${form.title}" (id: ${form.id}): ${formApplications.length} applications, ${formQuestions.length} questions`);
      formQuestions.forEach((q: any, index: number) => {
        console.log(`  Question ${index}: id="${q.id}", title="${q.title}", type="${q.type}"`);
      });

      // Basic stats
      const totalResponses = formApplications.length;
      const completionRate = totalResponses > 0 ? 100 : 0; // Assuming all submitted applications are complete

      // Responses by date
      const responsesByDate: { [date: string]: number } = {};
      formApplications.forEach(app => {
        const date = new Date(app.submittedAt).toISOString().split('T')[0];
        responsesByDate[date] = (responsesByDate[date] || 0) + 1;
      });

      // Responses by status
      const responsesByStatus: { [status: string]: number } = {};
      formApplications.forEach(app => {
        const status = app.status || 'PENDING'; // Default to PENDING if status is null/undefined
        responsesByStatus[status] = (responsesByStatus[status] || 0) + 1;
      });

      // Question analytics
      const questionAnalytics: QuestionAnalytics[] = formQuestions.map((question: any) => {
        const questionResponses = formApplications
          .map(app => (app.responses || []).find((r: any) => r.questionId === question.id))
          .filter(r => r);

        const responseCount = questionResponses.length;
        const skipRate = totalResponses > 0 ? ((totalResponses - responseCount) / totalResponses) * 100 : 0;
        
        console.log(`Question "${question.title}": ${responseCount} responses out of ${totalResponses} total, ${skipRate.toFixed(1)}% skip rate`);
        console.log(`Question responses:`, questionResponses);

        // Analyze responses based on question type
        const responseDistribution: { [value: string]: number } = {};
        let averageLength: number | undefined;
        let mostCommonResponse: string | undefined;
        let uniqueResponses = 0;

        if (question.type === 'TEXT' || question.type === 'TEXTAREA') {
          const textResponses = questionResponses
            .map(r => r.textValue)
            .filter(v => v && v.trim());

          uniqueResponses = new Set(textResponses).size;
          
          if (textResponses.length > 0) {
            averageLength = textResponses.reduce((sum, text) => sum + text.length, 0) / textResponses.length;
            
            // Find most common response
            const frequency: { [text: string]: number } = {};
            textResponses.forEach(text => {
              frequency[text] = (frequency[text] || 0) + 1;
            });
            
            const mostFrequent = Object.entries(frequency)
              .sort(([,a], [,b]) => b - a)[0];
            
            if (mostFrequent) {
              mostCommonResponse = mostFrequent[0];
              // Only show distribution for shorter responses or if there are few unique responses
              if (uniqueResponses <= 10 || mostFrequent[0].length <= 50) {
                Object.entries(frequency).forEach(([text, count]) => {
                  responseDistribution[text.length > 50 ? text.substring(0, 50) + '...' : text] = count;
                });
              }
            }
          }
        } else if (question.type === 'RADIO') {
          const radioResponses = questionResponses
            .map(r => {
              if (r.selectedOptions) {
                try {
                  const parsed = JSON.parse(r.selectedOptions);
                  return Array.isArray(parsed) ? parsed[0] : parsed;
                } catch {
                  return r.selectedOptions;
                }
              }
              return r.textValue;
            })
            .filter(v => v && v !== null && v !== undefined);

          uniqueResponses = new Set(radioResponses).size;
          
          radioResponses.forEach(value => {
            const displayValue = value.toString().trim() || 'No response';
            responseDistribution[displayValue] = (responseDistribution[displayValue] || 0) + 1;
          });
        } else if (question.type === 'CHECKBOX') {
          const checkboxResponses = questionResponses
            .map(r => {
              try {
                return r.selectedOptions ? JSON.parse(r.selectedOptions) : [];
              } catch {
                return r.selectedOptions ? [r.selectedOptions] : [];
              }
            })
            .filter(v => Array.isArray(v) && v.length > 0);

          const allValues = checkboxResponses.flat().filter(v => v && v !== null && v !== undefined);
          uniqueResponses = new Set(allValues).size;
          
          allValues.forEach(value => {
            const displayValue = value.toString().trim() || 'No response';
            responseDistribution[displayValue] = (responseDistribution[displayValue] || 0) + 1;
          });
        } else if (question.type === 'NUMBER') {
          const numberResponses = questionResponses
            .map(r => r.numberValue)
            .filter(v => v !== null && v !== undefined && !isNaN(v));

          uniqueResponses = new Set(numberResponses).size;
          
          numberResponses.forEach(value => {
            const displayValue = value.toString();
            responseDistribution[displayValue] = (responseDistribution[displayValue] || 0) + 1;
          });
        } else if (question.type === 'FILE') {
          const fileResponses = questionResponses
            .map(r => r.fileUrl || r.fileName)
            .filter(v => v && v.trim());

          uniqueResponses = fileResponses.length;
          if (fileResponses.length > 0) {
            responseDistribution['Files uploaded'] = fileResponses.length;
          }
          if (responseCount > fileResponses.length) {
            responseDistribution['No file uploaded'] = responseCount - fileResponses.length;
          }
          if (responseCount === 0) {
            responseDistribution['No responses'] = 0;
          }
        } else if (question.type === 'BOOLEAN') {
          const booleanResponses = questionResponses
            .map(r => r.booleanValue)
            .filter(v => v !== null && v !== undefined);

          uniqueResponses = new Set(booleanResponses).size;
          
          booleanResponses.forEach(value => {
            const displayValue = value ? 'Yes' : 'No';
            responseDistribution[displayValue] = (responseDistribution[displayValue] || 0) + 1;
          });

          if (responseCount > booleanResponses.length) {
            responseDistribution['No response'] = responseCount - booleanResponses.length;
          }
        } else if (question.type === 'SELECT') {
          const selectResponses = questionResponses
            .map(r => {
              if (r.selectedOptions) {
                try {
                  const parsed = JSON.parse(r.selectedOptions);
                  return Array.isArray(parsed) ? parsed[0] : parsed;
                } catch {
                  return r.selectedOptions;
                }
              }
              return r.textValue;
            })
            .filter(v => v && v !== null && v !== undefined);

          uniqueResponses = new Set(selectResponses).size;
          
          selectResponses.forEach(value => {
            const displayValue = value.toString().trim() || 'No response';
            responseDistribution[displayValue] = (responseDistribution[displayValue] || 0) + 1;
          });
        }

        // If no responses, provide a default distribution
        if (Object.keys(responseDistribution).length === 0 && responseCount === 0) {
          responseDistribution['No responses yet'] = 0;
        }

        console.log(`Question "${question.title}" final distribution:`, responseDistribution);

        return {
          questionId: question.id,
          questionTitle: question.title || 'Unknown Question',
          questionType: question.type || 'TEXT',
          responseCount,
          uniqueResponses,
          responseDistribution,
          averageLength,
          mostCommonResponse,
          skipRate
        };
      });

      // Demographics (basic info from applications)
      const demographics: { [field: string]: { [value: string]: number } } = {};
      
      // Analyze applicant info patterns
      const emails = formApplications.map(app => app.applicantEmail).filter(email => email);
      const emailDomains: { [domain: string]: number } = {};
      emails.forEach(email => {
        const domain = email.split('@')[1];
        if (domain) {
          emailDomains[domain] = (emailDomains[domain] || 0) + 1;
        }
      });
      demographics['Email Domains'] = emailDomains;

      return {
        formId: form.id,
        formTitle: form.title,
        formSlug: form.slug,
        totalResponses,
        completionRate,
        averageCompletionTime: 0, // Would need to track timing data to calculate this
        responsesByDate,
        responsesByStatus,
        questionAnalytics,
        demographics
      };
    });

    await client.close();
    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching form analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}