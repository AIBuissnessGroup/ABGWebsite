import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { MongoClient } from 'mongodb';
import { google } from 'googleapis';

const client = new MongoClient(process.env.DATABASE_URL!, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
});

/*
 * Google Forms API Integration
 * Reference: https://developers.google.com/workspace/forms/api/reference/rest/v1/forms/get
 * 
 * This endpoint uses the Google Forms API v1 with OAuth2 authentication.
 * 
 * Setup Requirements:
 * 1. Enable Google Forms API in Google Cloud Console
 * 2. Configure OAuth2 with the scope: https://www.googleapis.com/auth/forms.body.readonly
 * 3. Users must have access to the form they're trying to import
 */

interface FormInfo {
  title?: string;
  description?: string;
  documentTitle?: string;
}

interface QuestionItem {
  question?: {
    questionId?: string;
    required?: boolean;
    textQuestion?: {
      paragraph?: boolean;
    };
    choiceQuestion?: {
      type?: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
      options?: Array<{
        value?: string;
      }>;
    };
    scaleQuestion?: {
      low?: number;
      high?: number;
    };
    dateQuestion?: any;
    timeQuestion?: any;
    fileUploadQuestion?: any;
  };
}

interface PageBreakItem {
  pageBreakItem?: any;
}

interface FormItem {
  itemId?: string;
  title?: string;
  description?: string;
  questionItem?: QuestionItem['question'];
  pageBreakItem?: PageBreakItem['pageBreakItem'];
}

interface GoogleFormsResponse {
  formId?: string;
  info?: FormInfo;
  items?: FormItem[];
}

interface ParsedForm {
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  questions: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    required: boolean;
    options?: string[];
    sectionId?: string;
  }>;
}

/**
 * Parse Google Form using the official Google Forms API v1
 * Reference: https://developers.google.com/workspace/forms/api/reference/rest/v1/forms/get
 */
async function parseGoogleForm(formUrl: string, accessToken?: string): Promise<ParsedForm> {
  console.log(`Parsing Google Form URL: ${formUrl}`);
  
  // Extract form ID from URL - handle both public and edit URLs
  const urlPattern = /^https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?([a-zA-Z0-9-_]+)(?:\/.*)?$/;
  const match = formUrl.match(urlPattern);
  
  if (!match) {
    throw new Error(`Invalid Google Form URL: ${formUrl}`);
  }

  const formId = match[1];
  console.log(`Extracted form ID: ${formId}`);

  if (!accessToken) {
    throw new Error('OAuth access token required. Please sign out and sign back in.');
  }

  try {
    // Initialize Google APIs client with OAuth2
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const forms = google.forms({ version: 'v1', auth });

    console.log(`Fetching form ${formId} from Google Forms API...`);
    
    // Call the Google Forms API: GET https://forms.googleapis.com/v1/forms/{formId}
    const response = await forms.forms.get({
      formId: formId
    });

    const formData = response.data as GoogleFormsResponse;
    
    if (!formData) {
      throw new Error('No form data received from Google Forms API');
    }

    console.log(`Successfully retrieved form: ${formData.info?.title || 'Untitled'}`);
    
    return parseFormData(formData);

  } catch (error: any) {
    console.error('Google Forms API error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      formId
    });

    // Handle specific API errors according to Google Forms API documentation
    if (error.code === 403) {
      throw new Error('Permission denied. You need access to this form or it must be set to "Anyone can respond".');
    } else if (error.code === 401) {
      throw new Error('Authentication failed. Please sign out and sign back in to refresh your Google permissions.');
    } else if (error.code === 404) {
      throw new Error('Form not found. Please check the URL and ensure the form exists.');
    } else if (error.code === 400) {
      throw new Error('Invalid request. Please check the form URL format.');
    } else {
      throw new Error(`Google Forms API error: ${error.message} (Code: ${error.code || 'Unknown'})`);
    }
  }
}

/**
 * Parse the Google Forms API response data
 * Reference: https://developers.google.com/workspace/forms/api/reference/rest/v1/forms#Form
 */
function parseFormData(formData: GoogleFormsResponse): ParsedForm {
  const sections: ParsedForm['sections'] = [];
  const questions: ParsedForm['questions'] = [];

  // Extract form metadata
  const title = formData.info?.title || formData.info?.documentTitle || 'Imported Google Form';
  const description = formData.info?.description || '';

  console.log(`Parsing form: ${title} with ${formData.items?.length || 0} items`);

  // Process form items (questions and page breaks)
  if (formData.items) {
    let currentSectionId: string | undefined = undefined;

    formData.items.forEach((item, index) => {
      // Handle page breaks (sections)
      if (item.pageBreakItem) {
        const sectionId = `section_${sections.length}`;
        sections.push({
          id: sectionId,
          title: item.title || `Section ${sections.length + 1}`,
          description: item.description || ''
        });
        currentSectionId = sectionId;
        return;
      }

      // Handle questions
      if (item.questionItem) {
        const question = item.questionItem;
        const questionId = item.itemId || `q_${index}`;
        
        // Map Google Forms question types to our internal types
        let type = 'TEXT';
        let options: string[] | undefined = undefined;

        if (question.textQuestion) {
          type = question.textQuestion.paragraph ? 'TEXTAREA' : 'TEXT';
        } else if (question.choiceQuestion) {
          switch (question.choiceQuestion.type) {
            case 'RADIO':
              type = 'RADIO';
              break;
            case 'CHECKBOX':
              type = 'CHECKBOX';
              break;
            case 'DROP_DOWN':
              type = 'SELECT';
              break;
            default:
              type = 'RADIO';
          }
          options = question.choiceQuestion.options?.map(opt => opt.value || '').filter(Boolean);
        } else if (question.scaleQuestion) {
          type = 'NUMBER';
        } else if (question.dateQuestion) {
          type = 'DATE';
        } else if (question.timeQuestion) {
          type = 'TIME';
        } else if (question.fileUploadQuestion) {
          type = 'FILE';
        }

        questions.push({
          id: questionId,
          title: item.title || 'Untitled Question',
          description: item.description || '',
          type,
          required: question.required || false,
          options,
          sectionId: currentSectionId
        });
      }
    });
  }

  console.log(`Parsed ${questions.length} questions and ${sections.length} sections`);

  return {
    title,
    description,
    sections,
    questions
  };
}



/**
 * Diagnostic endpoint to check Google Forms API status
 * GET /api/admin/forms/import-google
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        status: {
          authenticated: false,
          oauthToken: false,
          oauthWorking: false,
          recommendations: ['Please sign in to check OAuth status']
        }
      }, { status: 401 });
    }

    const accessToken = (session as any)?.accessToken;
    const hasToken = !!accessToken;
    
    let oauthWorking = false;
    if (hasToken) {
      try {
        // Test OAuth token by initializing the Google APIs client
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const forms = google.forms({ version: 'v1', auth });
        
        // If we can create the client without errors, consider it working
        // The actual API test will happen during form import
        oauthWorking = true;
      } catch (e) {
        console.log('OAuth initialization failed:', e);
        oauthWorking = false;
      }
    }

    const recommendations = [];
    if (!hasToken) {
      recommendations.push('Re-authenticate to get Google Forms API access');
    }
    if (!oauthWorking) {
      recommendations.push('Check if Google Forms API is enabled in Google Cloud Console');
    }
    if (hasToken && oauthWorking) {
      recommendations.push('OAuth setup looks good! Try importing a form.');
    }

    return NextResponse.json({
      status: {
        authenticated: true,
        user: session.user.email,
        oauthToken: hasToken,
        oauthWorking: oauthWorking,
        apiKey: false, // We don't use API keys anymore
        apiKeyWorking: false,
        recommendations
      }
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ error: 'Diagnostic failed' }, { status: 500 });
  }
}

/**
 * Import Google Form endpoint
 * POST /api/admin/forms/import-google
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication checks
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const { formUrl } = await request.json();

    if (!formUrl) {
      return NextResponse.json({ error: 'Form URL is required' }, { status: 400 });
    }

    // Validate URL format
    const urlPattern = /^https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?([a-zA-Z0-9-_]+)(?:\/.*)?$/;
    if (!urlPattern.test(formUrl)) {
      return NextResponse.json({ 
        error: 'Invalid Google Form URL. Please provide a valid Google Forms link.' 
      }, { status: 400 });
    }

    // Get user's OAuth access token
    const accessToken = (session as any)?.accessToken;
    
    console.log('Import request:', {
      user: session.user.email,
      formUrl,
      hasAccessToken: !!accessToken
    });

    // Parse the Google Form using the official API
    const googleFormData = await parseGoogleForm(formUrl, accessToken);

    // Connect to database
    await client.connect();
    const db = client.db();

    // Get user info
    const user = await db.collection('User').findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate slug from title
    const baseSlug = googleFormData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await db.collection('Form').findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the form
    const formData = {
      id: `cmf${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      title: googleFormData.title,
      description: googleFormData.description || '',
      slug,
      category: 'general',
      isActive: 1,
      isPublic: 1,
      allowMultiple: 0,
      deadline: null,
      maxSubmissions: null,
      isAttendanceForm: 0,
      attendanceLatitude: null,
      attendanceLongitude: null,
      attendanceRadiusMeters: null,
      notifyOnSubmission: 1,
      notificationEmail: session.user.email,
      requireAuth: 1,
      backgroundColor: '#00274c',
      textColor: '#ffffff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user.id || user._id?.toString(),
      sections: googleFormData.sections
    };

    const formResult = await db.collection('Form').insertOne(formData);
    const createdFormId = formData.id;

    // Create form questions
    const questions = googleFormData.questions.map((q: any, index: number) => ({
      id: `cmq${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      formId: createdFormId,
      title: q.title,
      description: q.description || '',
      type: q.type,
      required: q.required ? 1 : 0,
      order: index,
      options: q.options ? JSON.stringify(q.options) : null,
      minLength: null,
      maxLength: null,
      pattern: null,
      sectionId: q.sectionId || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    if (questions.length > 0) {
      await db.collection('FormQuestion').insertMany(questions);
    }

    // Create form sections if any
    if (googleFormData.sections.length > 0) {
      const sections = googleFormData.sections.map((section: any, index: number) => ({
        id: `cms${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        formId: createdFormId,
        title: section.title,
        description: section.description || '',
        order: index,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      await db.collection('FormSection').insertMany(sections);
    }

    return NextResponse.json({
      success: true,
      form: formData,
      questions: questions.length,
      sections: googleFormData.sections.length,
      message: `Successfully imported Google Form: ${googleFormData.title}`
    });

  } catch (error) {
    console.error('Error importing Google Form:', error);
    
    let errorMessage = 'Failed to import Google Form';
    const suggestions: string[] = [];
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide specific suggestions based on error type
      if (error.message.includes('Permission denied')) {
        suggestions.push('Make sure you have access to this form or it\'s set to "Anyone can respond"');
        suggestions.push('Try using a form that you own or have been granted access to');
      } else if (error.message.includes('Authentication failed')) {
        suggestions.push('Sign out and sign back in to refresh your Google permissions');
        suggestions.push('Make sure Google Forms API is enabled in your Google Cloud Console');
      } else if (error.message.includes('Form not found')) {
        suggestions.push('Check that the form URL is correct and complete');
        suggestions.push('Verify the form still exists and hasn\'t been deleted');
      } else if (error.message.includes('OAuth access token required')) {
        suggestions.push('Sign out and sign back in to get proper Google Forms API access');
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      suggestions,
      helpText: 'This endpoint uses the official Google Forms API. You need access to the form to import it.'
    }, { status: 500 });
  } finally {
    await client.close();
  }
}