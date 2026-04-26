import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, FileCode, Folder, FolderOpen, Plus, FilePlus, FolderPlus } from "lucide-react";
import JSZip from "jszip";

const Explorer = ({ files, setFiles, folders, setFolders, selectedFileId, setSelectedFileId }) => {
  const [expandedFolders, setExpandedFolders] = useState(["src"]);
  const [isCreating, setIsCreating] = useState(null); // { type: 'file' | 'folder', parentId: 'src' }
  const [newName, setNewName] = useState("");
  const [contextMenu, setContextMenu] = useState(null); // { x, y, folderId }

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    document.addEventListener("click", closeContextMenu);
    return () => document.removeEventListener("click", closeContextMenu);
  }, []);

  const handleContextMenu = (e, folderId) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, folderId });
  };

  const handleDeleteFolder = (folderId) => {
    setFolders(folders.filter(f => f.id !== folderId && !f.id.startsWith(`${folderId}/`)));
    setFiles(files.filter(f => f.folderId !== folderId && !(f.folderId && f.folderId.startsWith(`${folderId}/`))));
    if (selectedFileId && (selectedFileId === folderId || selectedFileId.startsWith(`${folderId}/`))) {
      setSelectedFileId(null);
    }
  };

  const handleDownloadZip = async (folderId) => {
    const zip = new JSZip();
    const folderFiles = files.filter(f => f.folderId === folderId || (f.folderId && f.folderId.startsWith(`${folderId}/`)));
    
    folderFiles.forEach(file => {
      // Create relative path for zip entry
      const relativePath = file.id.substring(folderId.length + 1); 
      zip.file(relativePath, file.content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    const folderName = folderId.split("/").pop() || "folder";
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((f) => f !== folderId)
        : [...prev, folderId]
    );
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setIsCreating(null);
      setNewName("");
      return;
    }

    const { type, parentId } = isCreating;
    
    if (type === "folder") {
      const newFolderId = parentId ? `${parentId}/${newName}` : newName;
      if (!folders.some((f) => f.id === newFolderId)) {
        setFolders([...folders, { id: newFolderId, parentId, name: newName }]);
        if (!expandedFolders.includes(parentId)) {
          setExpandedFolders([...expandedFolders, parentId]);
        }
      }
    } else {
      const newFileId = parentId ? `${parentId}/${newName}` : newName;
      // ensure it ends with .java
      const finalName = newName.endsWith(".java") ? newName : `${newName}.java`;
      const finalId = parentId ? `${parentId}/${finalName}` : finalName;
      
      if (!files.some((f) => f.id === finalId)) {
        setFiles([...files, { id: finalId, folderId: parentId, name: finalName, content: "// new file" }]);
        setSelectedFileId(finalId);
        if (!expandedFolders.includes(parentId)) {
          setExpandedFolders([...expandedFolders, parentId]);
        }
      }
    }
    
    setIsCreating(null);
    setNewName("");
  };

  return (
    <div className="h-full bg-[#141622] rounded-lg border border-gray-800 backdrop-blur-sm bg-opacity-80 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Explorer
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsCreating({ type: 'file', parentId: 'src' })}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
            title="New File in src"
          >
            <FilePlus size={14} />
          </button>
          <button 
            onClick={() => setIsCreating({ type: 'folder', parentId: null })}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Render Root Folders */}
        {folders.filter(f => !f.parentId).map((folder) => (
          <div key={folder.id}>
            <div 
              className="group flex items-center justify-between pr-2 hover:bg-gray-800/50 rounded transition-colors text-gray-300"
              onContextMenu={(e) => handleContextMenu(e, folder.id)}
            >
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex-1 flex items-center gap-2 px-2 py-1.5"
              >
                {expandedFolders.includes(folder.id) ? (
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
                <span className="text-sm truncate">{folder.name}</span>
              </button>
              
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <button 
                  onClick={() => setIsCreating({ type: 'file', parentId: folder.id })}
                  className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
                >
                  <FilePlus size={12} />
                </button>
              </div>
            </div>

            {expandedFolders.includes(folder.id) && (
              <div className="ml-6 mt-1">
                {/* Render child folders if we add nesting later... */}
                
                {/* Render files in this folder */}
                {files.filter(file => file.folderId === folder.id).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all text-sm ${
                      selectedFileId === file.id
                        ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-400"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                    }`}
                  >
                    <FileCode size={16} className="flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
                
                {/* Create input within this folder */}
                {isCreating?.parentId === folder.id && (
                  <form onSubmit={handleCreate} className="flex items-center gap-2 px-2 py-1.5 ml-1">
                    {isCreating.type === 'file' ? <FileCode size={14} className="text-gray-500" /> : <Folder size={14} className="text-gray-500" />}
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => { if(!newName) setIsCreating(null); }}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-sm text-gray-200 outline-none focus:border-blue-500"
                      placeholder={`New ${isCreating.type}...`}
                    />
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* Render root files (if any) */}
        {files.filter(file => !file.folderId).map((file) => (
          <button
            key={file.id}
            onClick={() => setSelectedFileId(file.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all text-sm ${
              selectedFileId === file.id
                ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-400"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            <FileCode size={16} className="flex-shrink-0" />
            <span className="truncate">{file.name}</span>
          </button>
        ))}

        {/* Create root folder input */}
        {isCreating?.parentId === null && isCreating?.type === 'folder' && (
          <form onSubmit={handleCreate} className="flex items-center gap-2 px-2 py-1.5 ml-1 mt-1">
            <Folder size={14} className="text-gray-500" />
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { if(!newName) setIsCreating(null); }}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-sm text-gray-200 outline-none focus:border-blue-500"
              placeholder="New folder..."
            />
          </form>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-gray-800 border border-gray-700 shadow-xl rounded py-1 w-40 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadZip(contextMenu.folderId);
              closeContextMenu();
            }}
          >
            Download ZIP
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-red-600/20 text-red-400 text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFolder(contextMenu.folderId);
              closeContextMenu();
            }}
          >
            Delete Folder
          </button>
        </div>
      )}
    </div>
  );
};

export default Explorer;
