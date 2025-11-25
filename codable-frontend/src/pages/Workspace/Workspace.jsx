import { useState } from "react";
import Explorer from "./components/Explorer";
import CodeEditor from "./components/CodeEditor";
import AiSuggestions from "./components/AiSuggestions";
import OutputConsole from "./components/OutputConsole";
import IDENavbar from "./components/IDENavbar";
import { api } from "../../services/apiClient.js";

const Workspace = () => {
  const [code, setCode] = useState(`// Write your Java code here...

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}`);
  const [output, setOutput] = useState("");
  const [selectedFile, setSelectedFile] = useState("Main.java");

  // Stores user's typed inputs (accumulated stdin)
  const [stdinLines, setStdinLines] = useState([]);

  const appendInput = (line) => {
    setStdinLines((prev) => [...prev, line]);
  };

  const resetTerminal = () => {
    setOutput("");
    setStdinLines([]);
  };

  const handleRun = async () => {
    setOutput("Running code...\n");

    try {
      // Join all stdin lines with newline
      const stdin = stdinLines.join("\n");

      const response = await api.runCode(code, stdin);
      
      setOutput(
        response.run?.stdout ||
        response.run?.stderr ||
        response.compile?.stderr ||
        response.compile?.output ||
        "No output"
      );
    } catch (error) {
      setOutput("Error: " + (error.message || error.payload?.message || "Unknown error"));
    }
  };

  const handleSave = () => {
    console.log("File saved:", selectedFile);
  };

  return (
    <div className="h-screen bg-[#0d0f17] flex flex-col overflow-hidden">
      <IDENavbar />

      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex gap-4">
          {/* Explorer */}
          <div className="w-64 flex-shrink-0">
            <Explorer selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
          </div>

          {/* Editor + Console */}
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
              <OutputConsole
                output={output}
                setOutput={setOutput}
                appendInput={appendInput}
                resetTerminal={resetTerminal}
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
