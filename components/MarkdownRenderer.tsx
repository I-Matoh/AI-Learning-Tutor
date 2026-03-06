import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // A very basic markdown parser for the demo to avoid external dependencies.
  // In a real app, use 'react-markdown'.
  
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    // Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div key={`code-${index}`} className="bg-slate-900 text-slate-100 p-4 rounded-md my-4 font-mono text-sm overflow-x-auto">
            <pre>{codeBlockContent.join('\n')}</pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-4">{line.replace('# ', '')}</h1>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-2xl font-semibold text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h2>);
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-xl font-semibold text-slate-800 mt-5 mb-2">{line.replace('### ', '')}</h3>);
      return;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
       // Simple bold parsing within list items
      const text = line.replace(/^[-*]\s/, '');
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
        // Flush list if it exists and we hit a non-list line
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
            listItems = [];
        }
    }

    // Empty lines
    if (line.trim() === '') {
      return;
    }

    // Paragraphs with Bold support
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
    });

    elements.push(<p key={index} className="mb-3 text-slate-700 leading-relaxed">{renderedLine}</p>);
  });

  // Flush remaining list items
  if (listItems.length > 0) {
      elements.push(<ul key="ul-end" className="list-disc pl-5 mb-4 text-slate-700">{listItems}</ul>);
  }

  return <div className="markdown-content">{elements}</div>;
};
