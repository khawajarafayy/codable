import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Edit2, Check, X, Loader } from "lucide-react";
import io from "socket.io-client";
import { request } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

const SOCKET_IO_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export default function ChatSection({ classId, className }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user?.token || !classId) return;

    // Create Socket.IO connection
    socketRef.current = io(SOCKET_IO_URL, {
      auth: { token: user.token },
      query: { token: user.token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event
    socketRef.current.on("connect", () => {
      console.log("✅ Connected to chat server");
      // Join the class room
      socketRef.current.emit("joinClass", { classId });
    });

    // Receive message event
    socketRef.current.on("messageReceived", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Message edited event
    socketRef.current.on("messageEdited", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.id ? { ...msg, message: data.message, isEdited: data.isEdited } : msg
        )
      );
    });

    // Message deleted event
    socketRef.current.on("messageDeleted", (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });



    // User joined
    socketRef.current.on("userJoined", (data) => {
      console.log(`${data.userName} joined the chat`);
    });

    // User left
    socketRef.current.on("userLeft", (data) => {
      console.log(`${data.userName} left the chat`);
    });

    // Error handling
    socketRef.current.on("error", (error) => {
      console.error("Socket.IO error:", error);
      setError(error.message || "Connection error");
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Disconnected from chat server");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.token, classId]);

  // Fetch initial chat history
  useEffect(() => {
    if (!user?.token || !classId) return;

    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await request(`/api/chat/${classId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.success && Array.isArray(response.data)) {
          setMessages(response.data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching chat history:", err);
        setError("Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [classId, user?.token]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;
    if (!socketRef.current) {
      setError("Not connected to chat server");
      return;
    }

    try {
      setSending(true);

      // Emit via Socket.IO for real-time updates
      socketRef.current.emit("sendMessage", {
        classId,
        message: input,
      });

      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId, originalMessage) => {
    if (editingMessageId === messageId) {
      // Save edit
      if (!editingText.trim()) {
        setError("Message cannot be empty");
        return;
      }

      try {
        const response = await request(`/api/chat/${classId}/messages/${messageId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${user.token}` },
          body: { message: editingText },
        });

        if (response.success) {
          // Emit edit event via Socket.IO
          socketRef.current.emit("editMessage", {
            classId,
            messageId,
            message: editingText,
          });
          setEditingMessageId(null);
          setEditingText("");
        } else {
          setError(response.message || "Failed to edit message");
        }
      } catch (err) {
        console.error("Error editing message:", err);
        setError("Failed to edit message");
      }
    } else {
      // Start editing
      setEditingMessageId(messageId);
      setEditingText(originalMessage);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      const response = await request(`/api/chat/${classId}/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.success) {
        // Emit delete event via Socket.IO
        socketRef.current.emit("deleteMessage", {
          classId,
          messageId,
        });
      } else {
        setError(response.message || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("Failed to delete message");
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#0A1428]/50 border border-blue-500/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-500/20 bg-blue-500/5">
        <div>
          <h3 className="text-lg font-semibold text-[#fdfdff]">Class Chat</h3>
          <p className="text-xs text-[#fdfdff]/50">{className}</p>
        </div>

      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#fdfdff]/50">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-[#fdfdff]/60 text-sm">No messages yet</p>
              <p className="text-[#fdfdff]/40 text-xs mt-1">Start a conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.senderId === user._id;
            const showDate =
              index === 0 ||
              formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

            return (
              <div key={message.id || index}>
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-[#fdfdff]/40">{formatDate(message.createdAt)}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                )}

                <div className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      message.senderRole === "instructor"
                        ? "bg-purple-500"
                        : "bg-blue-500"
                    } shrink-0`}
                  >
                    {message.senderName.charAt(0).toUpperCase()}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-xs ${isCurrentUser ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#fdfdff]">
                        {message.senderName}
                      </span>
                      {message.senderRole === "instructor" && (
                        <span className="text-[0.65rem] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Instructor
                        </span>
                      )}
                      <span className="text-xs text-[#fdfdff]/40">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>

                    {editingMessageId === message.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-[#fdfdff] focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                          onClick={() => handleEditMessage(message.id, message.message)}
                          className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingText("");
                          }}
                          className="p-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? "bg-blue-500/30 text-[#fdfdff] rounded-br-none"
                            : "bg-white/5 text-[#fdfdff]/90 rounded-bl-none border border-white/10"
                        }`}
                      >
                        <p className="text-sm break-words">{message.message}</p>
                        {message.isEdited && (
                          <p className="text-xs text-[#fdfdff]/50 mt-1">(edited)</p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isCurrentUser && !editingMessageId && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleEditMessage(message.id, message.message)}
                          className="p-1 rounded text-blue-400 hover:bg-blue-500/20 transition-colors"
                          title="Edit message"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}



        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 border-t border-blue-500/20 bg-blue-500/5">
        <div className="flex items-end gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Type a message..."
            disabled={sending || !socketRef.current}
            className="flex-1 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-[#fdfdff] placeholder-[#fdfdff]/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !socketRef.current}
            className="p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Send message"
          >
            {sending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
