import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { isAdmin } from '@/lib/admin';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { category, status, reviewer, formId, exportType = 'summary' } = await request.json();

    const client = createMongoClient();
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

    // Process applications to include question data with responses
    const processedApplications = applications.map(app => {
      // Get questions from the embedded form data
      const formQuestions = app.form?.questions || [];
      
      // Handle both embedded responses (new format) and separate responses (legacy format)
      const responses = app.responses || [];
      
      const processedResponses = responses.map((response: any) => {
        const question = formQuestions.find((q: any) => q.id === response.questionId);
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
      // Detailed export: One row per application with all responses as columns
      const formGroups = processedApplications.reduce((groups: any, app: any) => {
        const formTitle = app.form.title;
        if (!groups[formTitle]) {
          groups[formTitle] = [];
        }
        groups[formTitle].push(app);
        return groups;
      }, {} as any);

      Object.entries(formGroups).forEach(([formTitle, formApps]: [string, any]) => {
        // Get all unique questions for this form to create columns
        const allQuestions = new Map();
        formApps.forEach((app: any) => {
          app.responses.forEach((response: any) => {
            if (response.question) {
              allQuestions.set(response.questionId, response.question.title || 'Unknown Question');
            }
          });
        });

        // Create header row
        const headers = [
          'Application ID',
          'Applicant Name', 
          'Applicant Email',
          'Status',
          'Submitted Date',
          'Reviewed By',
          'Admin Notes'
        ];
        
        // Add question columns
        Array.from(allQuestions.values()).forEach(questionTitle => {
          headers.push(questionTitle);
        });

        const detailedData: any[] = [];
        
        // Add header
        detailedData.push(headers.reduce((row: any, header: string, index) => {
          row[`col${index}`] = header;
          return row;
        }, {}));
        
        // Add data rows
        formApps.forEach((app: any) => {
          const row: any = {
            col0: app.id,
            col1: app.applicantName || 'N/A',
            col2: app.applicantEmail,
            col3: app.status,
            col4: new Date(app.submittedAt).toLocaleDateString(),
            col5: app.reviewer?.email || 'Not reviewed',
            col6: app.adminNotes || ''
          };

          // Add response values
          const responseMap = new Map();
          app.responses.forEach((response: any) => {
            let value = 'No answer';
            
            if (response.textValue) value = response.textValue;
            else if (response.numberValue !== null && response.numberValue !== undefined) value = response.numberValue.toString();
            else if (response.dateValue) value = new Date(response.dateValue).toLocaleDateString();
            else if (response.booleanValue !== null && response.booleanValue !== undefined) value = response.booleanValue ? 'Yes' : 'No';
            else if (response.selectedOptions) {
              try {
                value = JSON.parse(response.selectedOptions).join(', ');
              } catch {
                value = response.selectedOptions;
              }
            }
            else if (response.fileUrl) value = response.fileUrl;

            responseMap.set(response.questionId, value);
          });

          // Fill in the question responses
          let colIndex = 7; // Start after the fixed columns
          Array.from(allQuestions.keys()).forEach(questionId => {
            row[`col${colIndex}`] = responseMap.get(questionId) || 'No answer';
            colIndex++;
          });

          detailedData.push(row);
        });

        const worksheet = XLSX.utils.json_to_sheet(detailedData);
        
        // Auto-size columns for the new horizontal format
        const numCols = headers.length;
        worksheet['!cols'] = Array(numCols).fill(0).map((_, index) => {
          if (index < 7) {
            return { wch: 20 }; // Fixed columns
          } else {
            return { wch: 30 }; // Question columns
          }
        });

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
          const questionTitle = response.question?.title || 'Unknown Question';
          let value = 'No answer';
          
          if (response.textValue) value = response.textValue;
          else if (response.numberValue !== null && response.numberValue !== undefined) value = response.numberValue.toString();
          else if (response.dateValue) value = new Date(response.dateValue).toLocaleDateString();
          else if (response.booleanValue !== null && response.booleanValue !== undefined) value = response.booleanValue ? 'Yes' : 'No';
          else if (response.selectedOptions) {
            try {
              value = JSON.parse(response.selectedOptions).join(', ');
            } catch {
              value = response.selectedOptions;
            }
          }
          else if (response.fileUrl) value = response.fileUrl;

          responseData[questionTitle] = value;
        });

        return { ...baseData, ...responseData };
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