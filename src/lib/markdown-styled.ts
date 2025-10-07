import { marked } from 'marked';

// Configure marked with custom renderer
const renderer = new marked.Renderer();

// Custom heading renderer with better styling
renderer.heading = (text: string, level: number) => {
  const headingId = text.toLowerCase().replace(/[^\w]+/g, '-');
  
  switch (level) {
    case 1:
      return `<h1 id="${headingId}" class="text-3xl font-bold mb-6 text-white border-b-2 border-gradient-to-r from-blue-400 to-purple-400 pb-3">${text}</h1>`;
    case 2:
      return `<div class="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600 rounded-lg p-4 mb-6 mt-8">
                <h2 id="${headingId}" class="text-2xl font-bold text-blue-400 mb-0">${text}</h2>
              </div>`;
    case 3:
      return `<h3 id="${headingId}" class="text-xl font-semibold text-yellow-400 mb-3 mt-6 border-l-4 border-yellow-400 pl-4">${text}</h3>`;
    case 4:
      return `<h4 id="${headingId}" class="text-lg font-medium text-gray-200 mb-2 mt-4">${text}</h4>`;
    default:
      return `<h${level} id="${headingId}" class="font-medium text-gray-200 mb-2 mt-3">${text}</h${level}>`;
  }
};

// Custom paragraph renderer for better spacing
renderer.paragraph = (text: string) => {
  return `<p class="text-gray-300 leading-relaxed mb-4">${text}</p>`;
};

// Custom list renderer with boxes
renderer.list = (body: string, ordered: boolean) => {
  const tag = ordered ? 'ol' : 'ul';
  const listClass = ordered ? 'list-decimal list-inside' : '';
  return `<div class="bg-gray-800/20 border border-gray-700/50 rounded-lg p-4 mb-6">
            <${tag} class="${listClass} space-y-2">${body}</${tag}>
          </div>`;
};

renderer.listitem = (text: string) => {
  return `<li class="text-gray-300 pl-2">${text}</li>`;
};

// Custom blockquote renderer
renderer.blockquote = (quote: string) => {
  return `<div class="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
            <blockquote class="text-gray-300 italic">${quote}</blockquote>
          </div>`;
};

// Custom code block renderer
renderer.code = (code: string, language?: string) => {
  return `<div class="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6 overflow-x-auto">
            <pre><code class="text-yellow-400 text-sm">${code}</code></pre>
          </div>`;
};

// Custom horizontal rule
renderer.hr = () => {
  return `<div class="flex items-center my-8">
            <div class="flex-1 border-t-2 border-gray-600"></div>
            <div class="px-4">
              <div class="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </div>
            <div class="flex-1 border-t-2 border-gray-600"></div>
          </div>`;
};

// Configure marked options
marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

/**
 * Convert Markdown text to beautifully styled HTML
 */
export function markdownToHtml(content: string): string {
  if (!content) return '';
  
  try {
    // If content appears to be mostly HTML (contains HTML tags but no markdown), return as-is
    const hasHtmlTags = /<[^>]+>/g.test(content);
    const hasMarkdownSyntax = /^#{1,6}\s|^[-*+]\s|^---$|^\d+\.\s/m.test(content);
    
    if (hasHtmlTags && !hasMarkdownSyntax) {
      return content;
    }
    
    // Convert markdown to HTML with custom styling
    return marked.parse(content) as string;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return content; // Fallback to original content
  }
}

/**
 * Clean and prepare content for display
 */
export function cleanContent(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim();
}