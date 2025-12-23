import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { isAdmin } from '@/lib/admin';
import * as XLSX from 'xlsx';

const client = new MongoClient(process.env.DATABASE_URL!, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

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
      end.setHours(23, 59, 59, 999);
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

    // Get form questions
    const formIds = forms.map(f => f.id);
    const questions = await db.collection('FormQuestion')
      .find({ formId: { $in: formIds } })
      .sort({ order: 1 })
      .toArray();

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet with overall metrics
    const summaryData = forms.map(form => {
      const formApplications = applications.filter(app => app.formId === form.id);
      const formQuestions = questions.filter(q => q.formId === form.id);

      const totalResponses = formApplications.length;
      const statusCounts = formApplications.reduce((acc: any, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      return {
        'Form Title': form.title,
        'Form Slug': form.slug,
        'Total Responses': totalResponses,
        'Total Questions': formQuestions.length,
        'Pending': statusCounts['PENDING'] || 0,
        'Accepted': statusCounts['ACCEPTED'] || 0,
        'Rejected': statusCounts['REJECTED'] || 0,
        'Reviewing': statusCounts['REVIEWING'] || 0,
        'Waitlisted': statusCounts['WAITLISTED'] || 0,
        'Withdrawn': statusCounts['WITHDRAWN'] || 0,
        'Created Date': new Date(form.createdAt).toLocaleDateString(),
        'Active': form.isActive ? 'Yes' : 'No',
        'Public': form.isPublic ? 'Yes' : 'No'
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Form Summary');

    // Question analysis sheet
    const questionAnalysisData: any[] = [];
    
    forms.forEach(form => {
      const formApplications = applications.filter(app => app.formId === form.id);
      const formQuestions = questions.filter(q => q.formId === form.id);

      formQuestions.forEach(question => {
        const questionResponses = formApplications
          .map(app => (app.responses || []).find((r: any) => r.questionId === question.id))
          .filter(r => r);

        const responseCount = questionResponses.length;
        const skipRate = formApplications.length > 0 
          ? ((formApplications.length - responseCount) / formApplications.length) * 100 
          : 0;

        // Analyze response distribution
        const responseDistribution: { [value: string]: number } = {};
        let mostCommonResponse = '';
        let averageLength = 0;

        if (question.type === 'TEXT' || question.type === 'TEXTAREA') {
          const textResponses = questionResponses
            .map(r => r.textValue)
            .filter(v => v && v.trim());

          if (textResponses.length > 0) {
            averageLength = textResponses.reduce((sum, text) => sum + text.length, 0) / textResponses.length;
            
            const frequency: { [text: string]: number } = {};
            textResponses.forEach(text => {
              frequency[text] = (frequency[text] || 0) + 1;
            });
            
            const mostFrequent = Object.entries(frequency)
              .sort(([,a], [,b]) => b - a)[0];
            
            if (mostFrequent) {
              mostCommonResponse = mostFrequent[0];
            }
          }
        } else if (question.type === 'RADIO') {
          const radioResponses = questionResponses
            .map(r => r.textValue || r.selectedOptions)
            .filter(v => v);

          radioResponses.forEach(value => {
            responseDistribution[value] = (responseDistribution[value] || 0) + 1;
          });

          const mostFrequent = Object.entries(responseDistribution)
            .sort(([,a], [,b]) => b - a)[0];
          if (mostFrequent) {
            mostCommonResponse = mostFrequent[0];
          }
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

          const allValues = checkboxResponses.flat();
          allValues.forEach(value => {
            responseDistribution[value] = (responseDistribution[value] || 0) + 1;
          });

          const mostFrequent = Object.entries(responseDistribution)
            .sort(([,a], [,b]) => b - a)[0];
          if (mostFrequent) {
            mostCommonResponse = mostFrequent[0];
          }
        }

        questionAnalysisData.push({
          'Form Title': form.title,
          'Question Title': question.title,
          'Question Type': question.type,
          'Question Order': question.order,
          'Required': question.required ? 'Yes' : 'No',
          'Total Responses': responseCount,
          'Skip Rate (%)': skipRate.toFixed(1),
          'Most Common Response': mostCommonResponse,
          'Average Length': question.type === 'TEXT' || question.type === 'TEXTAREA' ? averageLength.toFixed(1) : 'N/A',
          'Unique Responses': Object.keys(responseDistribution).length,
          'Response Options': question.options || 'N/A'
        });
      });
    });

    const questionSheet = XLSX.utils.json_to_sheet(questionAnalysisData);
    XLSX.utils.book_append_sheet(workbook, questionSheet, 'Question Analysis');

    // Response timeline sheet
    const timelineData: any[] = [];
    const allDates = new Set<string>();
    
    applications.forEach(app => {
      const date = new Date(app.submittedAt).toISOString().split('T')[0];
      allDates.add(date);
    });

    Array.from(allDates).sort().forEach(date => {
      const dateApplications = applications.filter(app => {
        const appDate = new Date(app.submittedAt).toISOString().split('T')[0];
        return appDate === date;
      });

      forms.forEach(form => {
        const formDateApplications = dateApplications.filter(app => app.formId === form.id);
        
        if (formDateApplications.length > 0) {
          timelineData.push({
            'Date': date,
            'Form Title': form.title,
            'Responses': formDateApplications.length,
            'Pending': formDateApplications.filter(app => app.status === 'PENDING').length,
            'Accepted': formDateApplications.filter(app => app.status === 'ACCEPTED').length,
            'Rejected': formDateApplications.filter(app => app.status === 'REJECTED').length
          });
        }
      });
    });

    const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Response Timeline');

    await client.close();

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="form-analytics-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error exporting form analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}