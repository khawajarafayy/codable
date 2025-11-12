import { useState } from "react";
import Explorer from "./components/Explorer";
import CodeEditor from "./components/CodeEditor";
import AiSuggestions from "./components/AiSuggestions";
import OutputConsole from "./components/OutputConsole";
import IDENavbar from "./components/IDENavbar";

const Workspace = () => {
  const [code, setCode] = useState("// Write your Java code here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}");
  const [output, setOutput] = useState("");
  const [selectedFile, setSelectedFile] = useState("Main.java");

  const handleRun = async () => {
    setOutput("Compiling and running...\n");
    
    try {
      // Example using Judge0 API (you'll need an API key)
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': 'YOUR_API_KEY',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: 62, // Java
          stdin: '',
        })
      });
      
      const result = await response.json();
      setOutput(result.stdout || result.stderr || "No output");
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const handleSave = () => {
    console.log("File saved:", selectedFile);
  };

  return (
    <div className="h-screen bg-[#0d0f17] flex flex-col overflow-hidden">
      {/* IDE Navbar */}
      <IDENavbar />

      {/* Main Workspace */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex gap-4">
          {/* Left Sidebar - Explorer */}
          <div className="w-64 flex-shrink-0">
            <Explorer selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
          </div>

          {/* Center - Editor + Console */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 min-h-0">
              <CodeEditor 
                code={code} 
                setCode={setCode} 
                handleRun={handleRun}
                handleSave={handleSave}
                selectedFile={selectedFile}
              />
            </div>
            <div className="h-48 flex-shrink-0">
              <OutputConsole output={output} setOutput={setOutput} />
            </div>
          </div>

          {/* Right Sidebar - AI Suggestions */}
          <div className="w-80 flex-shrink-0">
            <AiSuggestions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
