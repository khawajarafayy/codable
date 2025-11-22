import { useState } from 'react';

export function CodeEditor() {
  const [code, setCode] = useState(`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`);

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const lines = code.split('\n');

  return (
    <div className="h-full bg-[#0B0B1A] flex">
      {/* Line Numbers */}
      <div className="bg-[#13132B]/30 px-4 py-6 text-right select-none border-r border-gray-800/30">
        {lines.map((_, index) => (
          <div key={index} className="text-gray-600 font-mono leading-6">
            {index + 1}
          </div>
        ))}
      </div>
      
      {/* Code Area */}
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="absolute inset-0 w-full h-full bg-transparent text-gray-300 font-mono p-6 resize-none focus:outline-none leading-6"
          style={{
            tabSize: 4,
            MozTabSize: 4,
          }}
          spellCheck={false}
        />
        
        {/* Syntax Highlighting Overlay (simplified) */}
        <div 
          className="absolute inset-0 p-6 pointer-events-none font-mono leading-6 whitespace-pre-wrap"
          aria-hidden="true"
        >
          {lines.map((line, index) => (
            <div key={index} className="opacity-0">
              {line || '\n'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
