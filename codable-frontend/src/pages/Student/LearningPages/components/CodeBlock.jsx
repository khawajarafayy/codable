import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';

export function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const lines = code.split('\n');
  
  return (
    <div className="bg-[#0B0B1A] rounded-lg border border-gray-800/50 overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#13132B]/50 px-4 py-2 flex items-center justify-between border-b border-gray-800/30">
        <span className="text-gray-500 uppercase tracking-wider">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-7"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      
      {/* Code Content */}
      <div className="flex">
        
        {/* Line Numbers */}
        <div className="bg-[#13132B]/30 px-4 py-4 text-right select-none border-r border-gray-800/30">
          {lines.map((_, index) => (
            <div key={index} className="text-gray-600 font-mono leading-6">
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code */}
        <pre className="flex-1 p-4 overflow-x-auto">
          <code className="text-gray-300 font-mono leading-6">
            {highlightJavaCode(code)}
          </code>
        </pre>
      </div>
    </div>
  );
}

function highlightJavaCode(code) {
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const keywords = new Set(['public', 'class', 'static', 'void', 'String', 'System']);
  const methods = new Set(['println', 'main']);

  const tokenRegex = /"([^"\\]|\\.)*"|\b\w+\b|\s+|[^\s\w"]/g;
  const tokens = code.match(tokenRegex) || [];

  return tokens.map((tok, i) => {
 
    if (/^\s+$/.test(tok)) {
      return escapeHtml(tok);
    }

    if (/^".*"$/.test(tok)) {
      return (
        <span key={i} className="text-green-400">
          {escapeHtml(tok)}
        </span>
      );
    }

    if (keywords.has(tok)) {
      return (
        <span key={i} className="text-[#6C63FF]">
          {escapeHtml(tok)}
        </span>
      );
    }

    if (methods.has(tok)) {
      return (
        <span key={i} className="text-[#22D3EE]">
          {escapeHtml(tok)}
        </span>
      );
    }

    return <span key={i}>{escapeHtml(tok)}</span>;
  });
}
