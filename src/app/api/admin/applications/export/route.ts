import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { isAdminEmail } from '@/lib/admin';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { category, status, reviewer, formId, exportType = 'summary' } = await request.json();

    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    const db = client.db();

    // Build filter conditions for application aggregation
    const matchStage: any = {};
    if (formId) {
      matchStage.formId = formId;
    }
    if (status && status !== 'all') {
      matchStage.status = status;
    }
    if (reviewer && reviewer !== 'all') {
      matchStage.reviewedBy = reviewer;
    }

    // Aggregation pipeline to get applications with all related data
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'Form',
          localField: 'formId',
          foreignField: 'id',
          as: 'form'
        }
      },
      { $unwind: { path: '$form', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'FormResponse',
          localField: 'id',
          foreignField: 'applicationId',
          as: 'responses'
        }
      },
      {
        $lookup: {
          from: 'User',
          localField: 'reviewedBy',
          foreignField: 'email',
          as: 'reviewer'
        }
      },
      { $unwind: { path: '$reviewer', preserveNullAndEmptyArrays: true } },
      { $sort: { submittedAt: -1 } }
    ];

    // Add category filter if specified
    if (category && category !== 'all') {
      pipeline.splice(2, 0, { $match: { 'form.category': category } });
    }

    const applications = await db.collection('Application').aggregate(pipeline).toArray();

    // Get all form questions for response processing
    const formIds = [...new Set(applications.map(app => app.formId))];
    const formQuestions = await db.collection('FormQuestion').find({
      formId: { $in: formIds }
    }).sort({ order: 1 }).toArray();

    // Process applications to include question data with responses
    const processedApplications = applications.map(app => {
      const appQuestions = formQuestions.filter(q => q.formId === app.formId);
      
      const processedResponses = app.responses.map((response: any) => {
        const question = appQuestions.find(q => q.id === response.questionId);
        return {
          ...response,
          question: question ? {
            title: question.title,
            type: question.type,
            order: question.order
          } : { title: 'Unknown Question', type: 'text', order: 999 }
        };
      }).sort((a: any, b: any) => a.question.order - b.question.order);

      return {
        ...app,
        responses: processedResponses
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    if (exportType === 'detailed') {
      // Detailed export: One sheet per form, detailed Q&A format
      const formGroups = processedApplications.reduce((groups: any, app: any) => {
        const formTitle = app.form.title;
        if (!groups[formTitle]) {
          groups[formTitle] = [];
        }
        groups[formTitle].push(app);
        return groups;
      }, {} as any);

      Object.entries(formGroups).forEach(([formTitle, formApps]: [string, any]) => {
        const detailedData: any[] = [];
        
        formApps.forEach((app: any) => {
          // Add application header
          detailedData.push({
            'Field': '=== APPLICATION ===',
            'Response': `${app.applicantName || app.applicantEmail} - ${app.status}`,
            'Details': `Submitted: ${new Date(app.submittedAt).toLocaleDateString()} | Reviewed by: ${app.reviewer?.email || 'Not reviewed'}`
          });

          detailedData.push({
            'Field': 'Application ID',
            'Response': app.id,
            'Details': ''
          });

          detailedData.push({
            'Field': 'Applicant Name',
            'Response': app.applicantName || 'N/A',
            'Details': ''
          });

          detailedData.push({
            'Field': 'Applicant Email',
            'Response': app.applicantEmail,
            'Details': ''
          });

          detailedData.push({
            'Field': 'Status',
            'Response': app.status,
            'Details': app.adminNotes || ''
          });

          // Add responses
          app.responses.forEach((response: any) => {
            let value = 'No answer provided';
            
            if (response.fileName) {
              value = `FILE: ${response.fileName} (${Math.round(response.fileSize / 1024)}KB)`;
            } else if (response.textValue) {
              value = response.textValue;
            } else if (response.numberValue !== null) {
              value = response.numberValue.toString();
            } else if (response.dateValue) {
              value = new Date(response.dateValue).toLocaleDateString();
            } else if (response.question?.type === 'BOOLEAN' && response.booleanValue !== null) {
              value = response.booleanValue ? 'Yes' : 'No';
            } else if (response.selectedOptions) {
              try {
                const options = JSON.parse(response.selectedOptions);
                value = Array.isArray(options) ? options.join(', ') : options;
              } catch {
                value = response.selectedOptions;
              }
            } else if (response.fileUrl) {
              value = response.fileUrl;
            }

            detailedData.push({
              'Field': response.question.title,
              'Response': value,
              'Details': response.question.type
            });
          });

          // Add scoring section for this application
          detailedData.push({
            'Field': '--- SCORING & EVALUATION ---',
            'Response': '',
            'Details': ''
          });
          
          detailedData.push({
            'Field': '🏆 OVERALL SCORE (1-10)',
            'Response': '',
            'Details': 'Rate overall candidate quality'
          });

          detailedData.push({
            'Field': '💼 Technical Skills Score (1-10)',
            'Response': '',
            'Details': 'Rate technical competency'
          });

          detailedData.push({
            'Field': '🤝 Communication Score (1-10)',
            'Response': '',
            'Details': 'Rate communication abilities'
          });

          detailedData.push({
            'Field': '🎯 Cultural Fit Score (1-10)',
            'Response': '',
            'Details': 'Rate cultural alignment'
          });

          detailedData.push({
            'Field': '📝 Interview Notes',
            'Response': '',
            'Details': 'Additional interview observations'
          });

          detailedData.push({
            'Field': '✅ Recommendation',
            'Response': '',
            'Details': 'Hire/No Hire/Maybe'
          });

          detailedData.push({
            'Field': '📊 Reviewer Comments',
            'Response': '',
            'Details': 'Final evaluation notes'
          });

          // Add separator
          detailedData.push({
            'Field': '',
            'Response': '',
            'Details': ''
          });
        });

        const worksheet = XLSX.utils.json_to_sheet(detailedData);
        
        // Auto-size columns for detailed view
        worksheet['!cols'] = [
          { wch: 30 }, // Field column
          { wch: 50 }, // Response column  
          { wch: 20 }  // Details column
        ];

        const sheetName = formTitle.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

    } else {
      // Summary export: All applications in one sheet with response columns
      const summaryData = processedApplications.map((app: any) => {
        const baseData = {
          'Application ID': app.id,
          'Form Title': app.form.title,
          'Form Category': app.form.category,
          'Applicant Name': app.applicantName || 'N/A',
          'Applicant Email': app.applicantEmail,
          'Status': app.status,
          'Submitted Date': new Date(app.submittedAt).toLocaleDateString(),
          'Submitted Time': new Date(app.submittedAt).toLocaleTimeString(),
          'Reviewed By': app.reviewer?.email || 'Not reviewed',
          'Review Date': app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'N/A',
          'Admin Notes': app.adminNotes || 'N/A'
        };

        // Add response data as columns
        const responseData: any = {};
        app.responses.forEach((response: any) => {
          const questionTitle = response.question.title;
          let value = 'No answer';
          
          if (response.fileName) {
            value = `FILE: ${response.fileName} (${Math.round(response.fileSize / 1024)}KB)`;
          } else if (response.textValue) {
            value = response.textValue;
          } else if (response.numberValue !== null) {
            value = response.numberValue.toString();
          } else if (response.dateValue) {
            value = new Date(response.dateValue).toLocaleDateString();
          } else if (response.question?.type === 'BOOLEAN' && response.booleanValue !== null) {
            value = response.booleanValue ? 'Yes' : 'No';
          } else if (response.selectedOptions) {
            try {
              const options = JSON.parse(response.selectedOptions);
              value = Array.isArray(options) ? options.join(', ') : options;
            } catch {
              value = response.selectedOptions;
            }
          } else if (response.fileUrl) {
            value = response.fileUrl;
          }

          responseData[questionTitle] = value;
        });

        // Add scoring columns
        const scoringData = {
          '🏆 OVERALL SCORE (1-10)': '',
          '💼 Technical Skills Score (1-10)': '',
          '🤝 Communication Score (1-10)': '',
          '🎯 Cultural Fit Score (1-10)': '',
          '📝 Interview Notes': '',
          '✅ Recommendation (Hire/No Hire/Maybe)': '',
          '📊 Reviewer Comments': ''
        };

        return { ...baseData, ...responseData, ...scoringData };
      });

      const worksheet = XLSX.utils.json_to_sheet(summaryData);

      // Auto-size columns for summary
      const columnWidths = Object.keys(summaryData[0] || {}).map(key => ({
        wch: Math.min(Math.max(key.length, 10), 50)
      }));
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications Summary');
    }

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
        'Content-Disposition': `attachment; filename="applications-export-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error exporting applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 