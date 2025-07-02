import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { isAdminEmail } from '@/lib/admin';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

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

    // Build filter conditions
    const whereClause: any = {};
    if (formId) {
      whereClause.formId = formId;
    } else if (category && category !== 'all') {
      whereClause.form = { category };
    }
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (reviewer && reviewer !== 'all') {
      whereClause.reviewedBy = reviewer;
    }

    // Fetch applications with all related data
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        form: {
          select: { title: true, slug: true, category: true }
        },
        responses: {
          include: {
            question: {
              select: { title: true, type: true, order: true }
            }
          },
          orderBy: { question: { order: 'asc' } }
        },
        reviewer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    if (exportType === 'detailed') {
      // Detailed export: One sheet per form, detailed Q&A format
      const formGroups = applications.reduce((groups, app) => {
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
            
            if (response.textValue) value = response.textValue;
            else if (response.numberValue !== null) value = response.numberValue.toString();
            else if (response.dateValue) value = new Date(response.dateValue).toLocaleDateString();
            else if (response.booleanValue !== null) value = response.booleanValue ? 'Yes' : 'No';
            else if (response.selectedOptions) {
              try {
                value = JSON.parse(response.selectedOptions).join(', ');
              } catch {
                value = response.selectedOptions;
              }
            }
            else if (response.fileUrl) value = response.fileUrl;

            detailedData.push({
              'Field': response.question.title,
              'Response': value,
              'Details': response.question.type
            });
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
      const summaryData = applications.map(app => {
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
          
          if (response.textValue) value = response.textValue;
          else if (response.numberValue !== null) value = response.numberValue.toString();
          else if (response.dateValue) value = new Date(response.dateValue).toLocaleDateString();
          else if (response.booleanValue !== null) value = response.booleanValue ? 'Yes' : 'No';
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