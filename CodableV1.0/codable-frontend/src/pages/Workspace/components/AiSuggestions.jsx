import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, User, Loader2 } from "lucide-react";
import learningApi from "../../../services/learningApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AiSuggestions = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I am your Java Learning AI Assistant. Ask me anything about your Java code, concepts, or project.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Explain OOP in simple Java terms.",
    "How do for and while loops differ in Java?",
    "Give me one beginner Java practice task.",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (textOverride = null) => {
    const content = (textOverride ?? input).trim();
    if (!content || loading) return;

    const userMsg = {
      role: "user",
      text: content,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await learningApi.askAssistant(content, null, messages);
      const assistantText =
        response?.response ||
        "I am your Java Learning AI Assistant. Please ask Java/course-related questions only.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: assistantText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I am unable to respond right now. Please try again with your Java/course question.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      console.error("Assistant chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#141622] rounded-lg border border-gray-800 backdrop-blur-sm bg-opacity-80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            AI Assistant
          </h2>
        </div>
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gradient-to-b from-gray-900 to-gray-950">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] text-sm px-3 py-2 rounded-xl shadow-lg border ${msg.role === "user"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent rounded-tr-none"
                  : "bg-white/10 backdrop-blur-md text-gray-200 border-white/10 rounded-tl-none"
                }`}
            >
              <div className="markdown-body text-gray-200 text-[13px]">
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      code: ({ node, inline, className, children, ...props }) => {
                        return inline ? (
                          <code className="bg-black/30 px-1.5 py-0.5 rounded text-purple-200 font-mono text-[11px]" {...props}>
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-black/50 p-2 rounded-lg overflow-x-auto mb-2 text-[11px] font-mono text-gray-200">
                            <code {...props}>{children}</code>
                          </pre>
                        );
                      },
                      strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                      em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-sm font-bold mb-2 text-white" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-sm font-bold mb-2 text-white" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xs font-bold mb-2 text-white" {...props} />,
                      a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 text-right">{msg.time}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white/10 text-gray-200 text-sm px-4 py-2 rounded-xl rounded-tl-none border border-white/10 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-[12px]">Thinking...</span>
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="text-xs text-gray-500 font-medium px-1">Suggested questions:</span>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[12px] shadow-sm transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 py-3 border-t border-gray-800 bg-[#0d0f17]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask the AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            className="flex-1 bg-gray-900 text-gray-200 placeholder-gray-500 px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiSuggestions;
