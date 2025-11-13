'use client';

import React, { useState } from 'react';

export default function ProjectStartupPage() {
  const [idea, setIdea] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/project-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', payload: { idea, stage: 'early' } }),
      });
      const json = await res.json();
      if (json.ok) {
        setResponse(JSON.stringify(json.data, null, 2));
      } else {
        setResponse(`Error: ${json.error}`);
      }
    } catch (err) {
      setResponse('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Project Startup Demo</h1>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        <strong>Note:</strong> Set the <code>OPENAI_API_KEY</code> environment variable for real AI responses. 
        Without it, mock data will be returned.
      </p>
      <form onSubmit={handleGenerate} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="idea" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Startup Idea:
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Enter your startup idea here..."
            rows={4}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate Startup Plan'}
        </button>
      </form>
      {response && (
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Response:</h2>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}
          >
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
