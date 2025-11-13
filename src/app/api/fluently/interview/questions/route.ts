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
    const prompt = `You are an interview coach. Generate 3 behavioral interview questions for a ${jobTitle} position${companyContext}.

For each question, provide:
1. The interview question
2. What the interviewer is looking for
3. A framework for answering (e.g., STAR method)
4. A brief example of a good answer approach

After the 3 questions, provide a short summary paragraph with general advice for behavioral interviews.

Format your response clearly with headers for each question.`;

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
            content: 'You are an expert interview coach specializing in behavioral interviews.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate interview questions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    let questions = data.choices[0]?.message?.content || '';

    // If translation needed
    if (language.toLowerCase() !== 'english') {
      const translateResponse = await fetch(`${req.nextUrl.origin}/api/fluently/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questions,
          targetLanguage: language,
        }),
      });

      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        questions = translateData.translatedText;
      }
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Interview questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
