import { useState, useRef, useEffect } from "react";
import Explorer from "./components/Explorer";
import CodeEditor from "./components/CodeEditor";
import AiSuggestions from "./components/AiSuggestions";
import OutputConsole from "./components/OutputConsole";
import IDENavbar from "./components/IDENavbar";

const DEFAULT_WS_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/^http/, 'ws')
  .replace(/\/$/, '')}/ws/compiler`;
const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

const Workspace = () => {
  const [files, setFiles] = useState([
    {
      id: "src/Main.java",
      folderId: "src",
      name: "Main.java",
      content: `// Write your Java code here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    },
  ]);
  const [folders, setFolders] = useState([
    { id: "src", parentId: null, name: "src" },
  ]);
  const [selectedFileId, setSelectedFileId] = useState("src/Main.java");

  const selectedFileObj = files.find((f) => f.id === selectedFileId);
  const code = selectedFileObj ? selectedFileObj.content : "";
  const selectedFileName = selectedFileObj ? selectedFileObj.name : "";

  const setCode = (newCode) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === selectedFileId ? { ...f, content: newCode } : f))
    );
  };

  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wsRef = useRef(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleRun = () => {
    setOutput('Connecting to compiler...\n');
    setIsRunning(true);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setOutput('Compiling and running...\n');
      ws.send(JSON.stringify({ type: 'run', code }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'output') {
        setOutput((prev) => prev + msg.data);
      }

      if (msg.type === 'error') {
        setOutput((prev) => prev + `[ERROR] ${msg.data}`);
      }

      if (msg.type === 'exit') {
        setOutput((prev) => prev + `\n[Process exited with code ${msg.code}]`);
        setIsRunning(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setOutput((prev) => prev + '\n[ERROR] WebSocket connection failed. Ensure backend is running.');
      setIsRunning(false);
    };

    ws.onclose = () => {
      setIsRunning(false);
    };
  };

  const handleStop = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
    }
    setOutput((prev) => prev + '\n[Execution stopped by user]');
    setIsRunning(false);
  };

  const handleInput = (input) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: input }));
      setOutput((prev) => prev + input + '\n');
    }
  };

  const resetTerminal = () => {
    setOutput("");
  };

  const handleSave = () => {
    if (!selectedFileObj) return;
    const blob = new Blob([selectedFileObj.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFileObj.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-[#0d0f17] flex flex-col overflow-hidden">
      <IDENavbar />

      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex gap-4">
          {/* Explorer */}
          <div className="w-64 flex-shrink-0">
            <Explorer 
              files={files} 
              setFiles={setFiles} 
              folders={folders} 
              setFolders={setFolders} 
              selectedFileId={selectedFileId} 
              setSelectedFileId={setSelectedFileId} 
            />
          </div>

          {/* Editor + Console */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 min-h-0">
              <CodeEditor
                code={code}
                setCode={setCode}
                handleRun={handleRun}
                handleStop={handleStop}
                handleSave={handleSave}
                selectedFile={selectedFileName}
                isRunning={isRunning}
              />
            </div>
            <div className="h-48 flex-shrink-0">
              <OutputConsole
                output={output}
                setOutput={setOutput}
                onInput={handleInput}
                resetTerminal={resetTerminal}
                isRunning={isRunning}
              />
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="w-80 flex-shrink-0">
            <AiSuggestions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
