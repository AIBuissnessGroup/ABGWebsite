import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, company, language = 'English' } = await req.json();

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title is required' },
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

    const companyContext = company ? ` at ${company}` : '';
    const prompt = `Generate 10 practical interview tips for a candidate interviewing for a ${jobTitle} position${companyContext}. 

Make the tips specific, actionable, and focused on:
- Role-specific technical preparation
- Common interview questions for this role
- What interviewers look for
- How to demonstrate relevant skills
- Professional presentation tips

Format each tip as a clear, concise bullet point.`;

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
            content: 'You are an expert interview coach providing actionable, specific advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate interview tips' },
        { status: response.status }
      );
    }

    const data = await response.json();
    let tips = data.choices[0]?.message?.content || '';

    // If translation needed
    if (language.toLowerCase() !== 'english') {
      const translateResponse = await fetch(`${req.nextUrl.origin}/api/fluently/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: tips,
          targetLanguage: language,
        }),
      });

      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        tips = translateData.translatedText;
      }
    }

    return NextResponse.json({ tips });
  } catch (error: any) {
    console.error('Interview tips error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
