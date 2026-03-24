import React from 'react';

/**
 * Props for the MarkdownRenderer component.
 */
interface MarkdownRendererProps {
  /** Markdown content string to render */
  content: string;
}

/**
 * A lightweight Markdown parser for rendering lesson content.
 * 
 * This is a custom implementation to avoid external dependencies.
 * Supports a subset of Markdown features:
 * - Headers (h1, h2, h3)
 * - Bullet lists (ul with li)
 * - Bold text (**text**)
 * - Code blocks (```)
 * - Paragraphs
 * 
 * Note: For production use, consider using 'react-markdown' or similar
 * for more complete Markdown support.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  // Track code block state
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  
  // Track list items to flush as a group
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    // Handle code blocks - start or end
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render accumulated content
        elements.push(
          <div key={`code-${index}`} className="bg-slate-900 text-slate-100 p-4 rounded-md my-4 font-mono text-sm overflow-x-auto">
            <pre>{codeBlockContent.join('\n')}</pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
      }
      return;
    }
    
    // Accumulate content within code block
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle headers
    if (line.startsWith('# ')) {
      // Flush any pending list items before rendering header
      if (listItems.length > 0) {
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
        listItems = [];
      }
      elements.push(<h1 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-4">{line.replace('# ', '')}</h1>);
      return;
    }
    if (line.startsWith('## ')) {
      if (listItems.length > 0) {
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
        listItems = [];
      }
      elements.push(<h2 key={index} className="text-2xl font-semibold text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h2>);
      return;
    }
    if (line.startsWith('### ')) {
      if (listItems.length > 0) {
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
        listItems = [];
      }
      elements.push(<h3 key={index} className="text-xl font-semibold text-slate-800 mt-5 mb-2">{line.replace('### ', '')}</h3>);
      return;
    }

    // Handle list items (bullet points)
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.replace(/^[-*]\s/, '');
      // Parse bold text within list items
      const parts = text.split(/(\*\*.*?\*\*)/g);
      const renderedText = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      listItems.push(<li key={`li-${index}`} className="ml-4 mb-1">{renderedText}</li>);
      return;
    } else {
      // Flush list when hitting a non-list line
      if (listItems.length > 0) {
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
        listItems = [];
      }
    }

    // Skip empty lines
    if (line.trim() === '') {
      return;
    }

    // Handle regular paragraphs with bold text support
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    elements.push(<p key={index} className="mb-3 text-slate-700 leading-relaxed">{renderedLine}</p>);
  });

  // Flush any remaining list items at end of content
  if (listItems.length > 0) {
    elements.push(<ul key="ul-end" className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
  }

  return <div className="markdown-content">{elements}</div>;
};
