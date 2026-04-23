import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Play, AlertCircle } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export function CompilerSection({ code, language }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setIsRunning(true);
    setError('');
    setOutput('');

    try {
      // Simulate compilation and execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock output based on language
      if (language === 'java') {
        setOutput('Hello, World!');
      } else if (language === 'python') {
        setOutput('Hello, World!');
      } else {
        setOutput('Compilation successful');
      }
    } catch (err) {
      setError('Compilation failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#0B0B1A] rounded-lg border border-gray-800/50 overflow-hidden">
      {/* Header */}
      <div className="bg-[#13132B]/50 px-4 py-3 flex items-center justify-between border-b border-gray-800/30">
        <span className="text-gray-500 uppercase tracking-wider">Compiler Output</span>
        <Button
          size="sm"
          onClick={handleRun}
          disabled={isRunning}
          className="bg-[#6C63FF] hover:bg-[#5B52E8] text-white h-8 disabled:opacity-50"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </div>

      {/* Output */}
      <div className="p-4">
        {error && (
          <div className="flex items-center gap-2 text-red-400 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {output && (
          <CodeBlock code={output} language="text" />
        )}
        
        {!output && !error && (
          <div className="text-gray-500 text-center py-8">
            Click "Run" to execute your code
          </div>
        )}
      </div>
    </div>
  );
}
