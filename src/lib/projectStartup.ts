export async function generateStartupPlan(idea: string, options: any = {}) {
  const { stage = 'early', format = 'text' } = options;
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = `You are a startup advisor. Create a concise startup plan for the idea below.\nIdea: ${idea}\nStage: ${stage}\nRespond in ${format === 'markdown' ? 'markdown' : 'plain text'}. Include: 1) One-line summary, 2) Key milestones for the next 90 days, 3) Minimum viable product features, 4) Go-to-market channels, 5) High-level resource estimate.`;
  if (!apiKey) {
    return {
      provider: 'mock',
      plan: `MOCK: Summary: ${idea} — A simple plan for stage ${stage}.\n\nMilestones:\n- Validate idea\n- Build MVP\n- Run pilots\n\nMVP Features:\n- Feature A\n- Feature B\n\nGTM: Organic, community outreach\nResources: 1-2 devs, part-time designer\n`,
    };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful startup planner.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error: ${res.status} ${text}`);
  }
  const payload = await res.json();
  const output = (payload.choices && payload.choices[0] && payload.choices[0].message?.content) || '';
  return { provider: 'openai', plan: output, raw: payload };
}

export async function getInterviewHelp(role: string, options: any = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const level = options.level || 'junior';
  const prompt = `You are an interview coach. Provide 8 interview questions (and a short model answer each) for a ${level} ${role} candidate. Keep answers concise.`;
  if (!apiKey) {
    const questions = Array.from({ length: 5 }).map((_, i) => ({ q: `Mock question ${i + 1} for ${role}`, a: `Mock short answer ${i + 1}` }));
    return { provider: 'mock', questions };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a concise interview question generator.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.6,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error: ${res.status} ${text}`);
  }
  const payload = await res.json();
  const output = (payload.choices && payload.choices[0] && payload.choices[0].message?.content) || '';
  return { provider: 'openai', output, raw: payload };
}

export async function ingestText(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim().slice(0, 20000);
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = `Summarize the following text into a short executive summary (3-6 sentences):\n\n${normalized}`;
  if (!apiKey) {
    return { provider: 'mock', summary: `MOCK SUMMARY: ${normalized.slice(0, 200)}${normalized.length > 200 ? '...' : ''}` };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You produce short executive summaries.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.5,
    }),
  });
  if (!res.ok) {
    const textResp = await res.text();
    throw new Error(`AI provider error: ${res.status} ${textResp}`);
  }
  const payload = await res.json();
  const summary = (payload.choices && payload.choices[0] && payload.choices[0].message?.content) || '';
  return { provider: 'openai', summary, raw: payload };
}

// Types for Project Startup functionality
export interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  created?: string;
}

export interface AnalyzedJob {
  job_index: number;
  title: string;
  match_score: number;
  match_reasons: string[];
  required_skills: string[];
  missing_skills: string[];
}

export interface JobAnalysisResult {
  analyzed_jobs: AnalyzedJob[];
  ranked_jobs: number[];
}

// Client-side helper functions for Project Startup chat
export async function searchJobs(location: string, keywords: string, resultsPerPage = 20): Promise<{ jobs: Job[]; count: number; mean?: number }> {
  const response = await fetch('/api/fluently/jobs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, keywords, resultsPerPage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search jobs');
  }

  return response.json();
}

export async function analyzeJobs(jobs: Job[], userSkills: string, language = 'English'): Promise<JobAnalysisResult> {
  const response = await fetch('/api/fluently/jobs/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs, userSkills, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze jobs');
  }

  return response.json();
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const response = await fetch('/api/fluently/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to translate');
  }

  const data = await response.json();
  return data.translatedText;
}

export async function getInterviewTips(jobTitle: string, company?: string, language = 'English'): Promise<string> {
  const response = await fetch('/api/fluently/interview/tips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobTitle, company, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get interview tips');
  }

  const data = await response.json();
  return data.tips;
}

export async function getBehavioralQuestions(jobTitle: string, company?: string, language = 'English'): Promise<string> {
  const response = await fetch('/api/fluently/interview/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobTitle, company, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get interview questions');
  }

  const data = await response.json();
  return data.questions;
}