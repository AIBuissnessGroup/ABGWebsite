import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { jobs, userSkills, language = 'English' } = await req.json();

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Jobs array is required' },
        { status: 400 }
      );
    }

    if (!userSkills) {
      return NextResponse.json(
        { error: 'User skills are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Prepare job data for AI analysis
    const jobDescriptions = jobs.map((job: any, index: number) => 
      `Job ${index + 1}:\nTitle: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description.slice(0, 500)}`
    ).join('\n\n');

    const prompt = `You are a job matching AI. Analyze the following jobs and rank them based on how well they match the user's skills.

User Skills: ${userSkills}

Jobs:
${jobDescriptions}

Respond ONLY with valid JSON in this exact format:
{
  "analyzed_jobs": [
    {
      "job_index": 0,
      "title": "Job Title",
      "match_score": 85,
      "match_reasons": ["reason 1", "reason 2"],
      "required_skills": ["skill 1", "skill 2"],
      "missing_skills": ["skill 3"]
    }
  ],
  "ranked_jobs": [0, 2, 1]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a job matching AI that responds ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze jobs with AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
