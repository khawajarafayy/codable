import { Play, Send, Code2, Terminal } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState } from 'react';

export function PracticeEditor({ code, onChange, onRun, onSubmit, question }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setOutput('Compiling...\n');

    // Simulate compilation and execution
    setTimeout(() => {
      setOutput(prev => prev + 'Compilation successful!\n');
      setTimeout(() => {
        setOutput(prev => prev + 'Running...\n');
        setTimeout(() => {
          // Simulate output
          setOutput(prev => prev + '\n--- Output ---\n');
          setOutput(prev => prev + 'Your Name\n'); // Mock output
          setIsRunning(false);
        }, 500);
      }, 300);
    }, 500);

    onRun();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Question Summary Bar */}
      <div className="bg-[#13132B]/50 border-b border-gray-800/50 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-[#6C63FF]" />
          <div>
            <h3 className="text-white">{question.title}</h3>
            <p className="text-gray-400 text-sm">{question.description}</p>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative">
          {/* Editor Header */}
          <div className="bg-[#13132B] px-4 py-2 flex items-center justify-between border-b border-gray-800/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-gray-400">Solution.java</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                className="bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30 border border-[#22D3EE]/30 h-8"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Run Code
              </Button>
              <Button
                size="sm"
                onClick={onSubmit}
                className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] hover:from-[#5B52EE] hover:to-[#11C2DD] text-white h-8"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit
              </Button>
            </div>
          </div>

          {/* Code Textarea */}
          <div className="absolute inset-0 top-[42px]">
            <textarea
              value={code}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-full bg-[#0B0B1A] text-gray-300 font-mono p-6 resize-none focus:outline-none"
              style={{
                lineHeight: '1.6',
                tabSize: 4,
                fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                fontSize: '14px'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Console */}
        <div className="h-48 border-t border-gray-800/50 bg-[#0B0B1A] flex flex-col shrink-0">
          <div className="bg-[#13132B] px-4 py-2 flex items-center gap-2 border-b border-gray-800/30">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Console Output</span>
          </div>
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-gray-300 font-mono text-sm whitespace-pre-wrap">
              {output || 'Click "Run Code" to see output...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
