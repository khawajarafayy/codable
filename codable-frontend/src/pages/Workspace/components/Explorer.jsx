import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileCode, Folder, FolderOpen } from "lucide-react";

const Explorer = ({ selectedFile, setSelectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(["src"]);

  const toggleFolder = (folder) => {
    setExpandedFolders((prev) =>
      prev.includes(folder)
        ? prev.filter((f) => f !== folder)
        : [...prev, folder]
    );
  };

  const fileStructure = [
    {
      type: "folder",
      name: "src",
      children: [
        { type: "file", name: "Main.java", icon: "☕" },
        { type: "file", name: "Utils.java", icon: "☕" },
        { type: "file", name: "TestCases.java", icon: "☕" },
      ],
    },
    {
      type: "folder",
      name: "lib",
      children: [],
    },
  ];

  return (
    <div className="h-full bg-[#141622] rounded-lg border border-gray-800 backdrop-blur-sm bg-opacity-80 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Explorer
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {fileStructure.map((item) => (
          <div key={item.name}>
            {item.type === "folder" && (
              <>
                <button
                  onClick={() => toggleFolder(item.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800/50 rounded transition-colors text-gray-300"
                >
                  {expandedFolders.includes(item.name) ? (
                    <>
                      <ChevronDown size={16} />
                      <FolderOpen size={16} className="text-blue-400" />
                    </>
                  ) : (
                    <>
                      <ChevronRight size={16} />
                      <Folder size={16} className="text-blue-400" />
                    </>
                  )}
                  <span className="text-sm">{item.name}</span>
                </button>

                {expandedFolders.includes(item.name) && (
                  <div className="ml-6 mt-1">
                    {item.children.map((file) => (
                      <button
                        key={file.name}
                        onClick={() => setSelectedFile(file.name)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all text-sm ${
                          selectedFile === file.name
                            ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-400"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                        }`}
                      >
                        <FileCode size={16} />
                        <span>{file.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explorer;
