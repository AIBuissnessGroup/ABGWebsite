import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true     // GitHub Flavored Markdown
});

/**
 * Convert Markdown text to HTML
 * Handles mixed content (HTML + Markdown)
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
    
    // Convert markdown to HTML
    return marked.parse(content) as string;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return content; // Fallback to original content
  }
}

/**
 * Clean and prepare content for display
 * Removes extra whitespace and normalizes line endings
 */
export function cleanContent(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim();
}