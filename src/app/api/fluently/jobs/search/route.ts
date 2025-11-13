import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { location, keywords, resultsPerPage = 20 } = await req.json();

    if (!location || !keywords) {
      return NextResponse.json(
        { error: 'Location and keywords are required' },
        { status: 400 }
      );
    }

    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { error: 'Adzuna API credentials not configured' },
        { status: 500 }
      );
    }

    // Build Adzuna API URL
    const params = new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: resultsPerPage.toString(),
      what: keywords,
      where: location,
    });

    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Adzuna API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch jobs from Adzuna' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform Adzuna response to our format
    const jobs = data.results.map((job: any) => ({
      title: job.title,
      company: job.company?.display_name || 'N/A',
      location: job.location?.display_name || location,
      description: job.description,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      url: job.redirect_url,
      created: job.created,
    }));

    return NextResponse.json({
      jobs,
      count: data.count,
      mean: data.mean,
    });
  } catch (error: any) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
