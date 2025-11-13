import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // If target language is English, return original text
    if (targetLanguage.toLowerCase() === 'english') {
      return NextResponse.json({ translatedText: text });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLanguage}. Provide ONLY the translation, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI translation error:', errorText);
      return NextResponse.json(
        { error: 'Translation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || text;

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
