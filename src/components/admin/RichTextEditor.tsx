'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
  HashtagIcon,
  MinusIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { marked } from 'marked';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Handle input without causing cursor position issues
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && content && editorRef.current.innerHTML !== content) {
      // Only set if the content is actually different and we're not currently editing
      const isEditing = editorRef.current === document.activeElement;
      if (!isEditing) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  // Format text functions
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  };

  // Markdown helper functions - insert proper HTML elements
  const insertHeading2 = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    const h2 = document.createElement('h2');
    h2.className = 'text-2xl font-bold mb-4 text-white';
    h2.textContent = 'Heading 2';
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(h2);
      
      // Select the text inside the heading for editing
      const newRange = document.createRange();
      newRange.selectNodeContents(h2);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  const insertHeading3 = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    const h3 = document.createElement('h3');
    h3.className = 'text-xl font-semibold mb-3 text-white';
    h3.textContent = 'Heading 3';
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(h3);
      
      // Select the text inside the heading for editing
      const newRange = document.createRange();
      newRange.selectNodeContents(h3);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  const insertDivider = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    const hr = document.createElement('hr');
    hr.className = 'my-8 border-gray-600';
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(hr);
      
      // Move cursor after the divider
      range.setStartAfter(hr);
      range.setEndAfter(hr);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  const insertBulletPoint = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    // Create a paragraph with a bullet point
    const p = document.createElement('p');
    p.innerHTML = '• ';
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(p);
      
      // Place cursor after the bullet
      range.setStart(p, 1);
      range.setEnd(p, 1);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('insertUnorderedList')) formats.add('bulletList');
    if (document.queryCommandState('insertOrderedList')) formats.add('numberedList');
    
    setActiveFormats(formats);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      const linkHtml = `<a href="${linkUrl}" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkText('');
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const imgHtml = `<img src="${url}" alt="Inserted image" class="max-w-full h-auto rounded-lg my-4" />`;
      document.execCommand('insertHTML', false, imgHtml);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const insertHeading = (level: number) => {
    const headingClass = level === 2 ? 'text-2xl font-bold mb-4 text-white' : 
                        level === 3 ? 'text-xl font-semibold mb-3 text-white' : 
                        'text-lg font-medium mb-2 text-white';
    
    document.execCommand('formatBlock', false, `h${level}`);
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const element = selection.anchorNode.nodeType === Node.TEXT_NODE 
          ? selection.anchorNode.parentElement 
          : selection.anchorNode as Element;
        
        if (element && element.tagName && element.tagName.toLowerCase() === `h${level}`) {
          element.className = headingClass;
        }
      }
    }
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const buttonClass = (isActive: boolean) => 
    `p-2 rounded-md transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }`;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-3 flex flex-wrap items-center gap-1 bg-gray-50">
        {/* Text Format */}
        <div className="flex items-center gap-1 mr-4">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className={buttonClass(activeFormats.has('bold'))}
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className={buttonClass(activeFormats.has('italic'))}
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className={buttonClass(activeFormats.has('underline'))}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 mr-4">
          <select
            onChange={(e) => {
              if (e.target.value === 'p') {
                execCommand('formatBlock', 'div');
              } else {
                insertHeading(parseInt(e.target.value));
              }
              e.target.value = 'p';
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            defaultValue="p"
          >
            <option value="p">Normal</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 mr-4">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className={buttonClass(activeFormats.has('bulletList'))}
            title="Bullet List"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className={buttonClass(activeFormats.has('numberedList'))}
            title="Numbered List"
          >
            <NumberedListIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Insert */}
        <div className="flex items-center gap-1 mr-4">
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className={buttonClass(false)}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertImage}
            className={buttonClass(false)}
            title="Insert Image"
          >
            <PhotoIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Code */}
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'pre')}
          className={buttonClass(false)}
          title="Code Block"
        >
          <CodeBracketIcon className="w-4 h-4" />
        </button>

        {/* Markdown Formatting */}
        <div className="flex items-center gap-1 mr-4 ml-2 border-l border-gray-300 pl-2">
          <button
            type="button"
            onClick={insertHeading2}
            className={buttonClass(false)}
            title="Heading 2 (##)"
          >
            <HashtagIcon className="w-4 h-4" />
            <span className="text-xs ml-1">2</span>
          </button>
          <button
            type="button"
            onClick={insertHeading3}
            className={buttonClass(false)}
            title="Heading 3 (###)"
          >
            <HashtagIcon className="w-4 h-4" />
            <span className="text-xs ml-1">3</span>
          </button>
          <button
            type="button"
            onClick={insertDivider}
            className={buttonClass(false)}
            title="Divider (---)"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertBulletPoint}
            className={buttonClass(false)}
            title="Markdown Bullet (-)"
          >
            <span className="text-sm font-mono">-</span>
          </button>
        </div>

        {/* Help */}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className={buttonClass(showHelp)}
          title="Show Formatting Help"
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="border-b border-gray-300 p-4 bg-blue-50 text-sm">
          <h3 className="font-semibold mb-3 text-gray-800">Markdown Formatting Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <h4 className="font-medium mb-2">Headings</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><strong>## Heading 2</strong> - Main sections</div>
                <div><strong>### Heading 3</strong> - Subsections</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Lists</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><strong>- Item</strong> - Bullet points</div>
                <div><strong>1. Item</strong> - Numbered lists</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Text Formatting</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><strong>**bold text**</strong> - Bold</div>
                <div><strong>*italic text*</strong> - Italic</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Other</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><strong>---</strong> - Horizontal divider</div>
                <div><strong>[link text](url)</strong> - Links</div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-600">
            💡 <strong>Tip:</strong> Use the toolbar buttons above to insert Markdown formatting, or type it manually.
          </p>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        suppressContentEditableWarning={true}
        className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6'
        }}
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter link text..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}