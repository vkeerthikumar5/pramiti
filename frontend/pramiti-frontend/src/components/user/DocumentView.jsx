import { useState, useEffect, useRef } from "react";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiFileText,
  FiClock,
  FiEdit3,
  FiSend,
  FiUser,
  FiCpu,
  FiSave,
} from "react-icons/fi";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import api from "../../api";

export default function DocumentView({ doc, goBack, group }) {
  const [readTime, setReadTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("read");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const readTimeRef = useRef(0);
  const lastSentTimeRef = useRef(0);
  const intervalRef = useRef();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const hasFetchedRef = useRef(false);

  // --- FETCH CURRENT STATUS FROM DB ---
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        const res = await api.get(`/documents/${doc.id}/read-status/`);
        const dbCompleted = res.data.is_completed;
        const dbReadTime = res.data.read_time_seconds || 0;

        setIsCompleted(dbCompleted);
        setReadTime(dbReadTime);
        readTimeRef.current = dbReadTime;
        lastSentTimeRef.current = dbReadTime;
      } catch (err) {
        console.error("Failed to fetch read status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [doc.id]);

  // --- INCREMENT READ TIME EVERY SECOND ---
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setReadTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // --- KEEP REF IN SYNC ---
  useEffect(() => {
    readTimeRef.current = readTime;
  }, [readTime]);

  // --- SEND READ STATUS EVERY 10 SECONDS ---
  useEffect(() => {
    const sendReadStatus = setInterval(() => {
      const delta = readTimeRef.current - lastSentTimeRef.current;
      if (delta <= 0 && isCompleted) return;
      lastSentTimeRef.current = readTimeRef.current;

      api.post(`/documents/${doc.id}/read-status/`, {
        read_time_seconds: delta > 0 ? delta : 0,
        is_completed: isCompleted,
      });
    }, 10000);

    return () => clearInterval(sendReadStatus);
  }, [doc.id, isCompleted]);

  const handleMarkAsComplete = async () => {
    try {
      await api.post(`/documents/${doc.id}/read-status/`, {
        read_time_seconds: readTimeRef.current,
        is_completed: true,
      });
      setIsCompleted(true);
    } catch (err) {
      console.error("Failed to mark as complete", err);
    }
  };

  const [chatHistory, setChatHistory] = useState([]);

  const tabs = [
    { id: "read", label: "Document", icon: <FiFileText /> },
    { id: "chat", label: "Ask AI", icon: <FiMessageSquare /> },
    { id: "history", label: "History", icon: <FiClock /> },
    { id: "notes", label: "Notes", icon: <FiEdit3 /> },
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setChatHistory((prev) => [...prev, { role: "user", text: message }]);
    setMessage("");
    setAiTyping(true);
    try {
      const res = await api.post(`/documents/${doc.id}/ask-ai/`, {
        question: message,
        group_id: group.id,
      });
      setChatHistory((prev) => [...prev, { role: "ai", text: res.data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: "ai", text: "❌ Failed to get answer." }]);
    } finally {
      setAiTyping(false);
    }
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get(`/documents/${doc.id}/note/`);
        setNotes(res.data.content || "");
      } catch (err) {
        console.error("Failed to fetch notes", err);
      }
    };
    fetchNotes();
  }, [doc.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/documents/${doc.id}/history/`);
          setHistoryData(res.data);
        } catch (err) {
          console.error("Failed to fetch history", err);
        }
      };
      fetchHistory();
    }
  }, [activeTab, doc.id]);

  return (
    <div className="flex flex-col h-screen  bg-gray-50">
    {/* HEADER */}
    <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 border-b border-gray-200 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto min-w-0">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-indigo-600 hover:underline shrink-0"
        >
          <FiArrowLeft /> Back
        </button>
        <div className="hidden sm:block h-6 w-px bg-gray-300" />
        <div className="truncate min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{doc.title}</h2>
          <p className="text-xs text-gray-500 truncate">Viewing document</p>
        </div>
      </div>
      <span className="mt-2 sm:mt-0 text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 shrink-0">
        AI Enabled
      </span>
    </div>
  
    {/* TABS */}
    <div className="px-2 sm:px-6 mt-4 overflow-x-auto">
      <div className="inline-flex gap-2 sm:gap-3 bg-white p-2 rounded-2xl shadow-sm min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl text-sm transition
              ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
              } whitespace-nowrap`}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  
    {/* CONTENT */}
    <div className="flex-1 px-2 sm:px-6 py-4 overflow-auto min-w-0">
      {/* READ TAB */}
      {activeTab === "read" && (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden min-w-0">
          <div className="m-2 flex justify-end">
            <button
              onClick={handleMarkAsComplete}
              disabled={loading || isCompleted}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm font-medium shadow-lg transition
                ${isCompleted
                  ? "bg-green-100 text-green-700 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
            >
              {isCompleted ? "✔ Completed" : "Mark as Complete"}
            </button>
          </div>
  
          <div className="flex-1 overflow-auto w-full min-w-0">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              {doc?.file_url ? (
                <div className="w-full min-w-0">
                  <Viewer fileUrl={doc.file_url} plugins={[defaultLayoutPluginInstance]} />
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4">Loading document preview…</div>
              )}
            </Worker>
          </div>
        </div>
      )}
  
      {/* CHAT TAB */}
      {activeTab === "chat" && (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 min-w-0">
          <div className="flex-1 overflow-auto p-2 sm:p-6 space-y-2 sm:space-y-4 min-w-0">
            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className={`flex gap-2 sm:gap-4 ${chat.role === "user" ? "justify-end" : "justify-start"} w-full min-w-0`}
              >
                {chat.role === "ai" && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FiCpu />
                  </div>
                )}
  
                <div
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-3xl text-sm leading-relaxed break-words
                    ${chat.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none max-w-full sm:max-w-[60%]"
                      : "bg-gray-100 text-gray-700 rounded-bl-none max-w-full sm:max-w-[60%]"
                    }`}
                >
                  {chat.text}
                </div>
  
                {chat.role === "user" && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <FiUser />
                  </div>
                )}
              </div>
            ))}
  
            {aiTyping && (
              <div className="flex gap-2 sm:gap-4 justify-start w-full min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FiCpu />
                </div>
                <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-3xl rounded-bl-none break-words">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
  
            <div ref={chatEndRef} />
          </div>
  
          <div className="border-t border-gray-200 px-2 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 rounded-2xl px-2 sm:px-4 py-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something about this document..."
                className="flex-1 bg-transparent outline-none text-sm min-w-0"
              />
              <button
                onClick={handleSendMessage}
                className="bg-indigo-600 text-white p-2 sm:p-3 rounded-xl hover:bg-indigo-700 shrink-0"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-2 sm:space-y-4 overflow-auto w-full min-w-0">
          {historyData.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-2 sm:p-6 w-full min-w-0">
              <p className="text-gray-500 text-sm">No history available.</p>
            </div>
          )}
          {historyData.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-2 sm:p-6 w-full break-words min-w-0">
              <h4 className="font-medium mb-1 sm:mb-2">{item.question}</h4>
              <p className="text-gray-600 text-sm">{item.answer}</p>
            </div>
          ))}
        </div>
      )}
  
      {/* NOTES TAB */}
      {activeTab === "notes" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-2 sm:p-6 h-full flex flex-col gap-2 sm:gap-4 w-full min-w-0">
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            className="flex-1 border border-gray-200 rounded-xl p-2 sm:p-4 focus:ring-2 focus:ring-indigo-400 outline-none text-sm resize-none min-w-0"
            placeholder="Write your personal notes..."
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <button
              onClick={async () => {
                try {
                  await api.post(`/documents/${doc.id}/note/`, { content: notes });
                  setSaved(true);
                } catch (err) {
                  console.error("Failed to save notes", err);
                }
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 sm:px-6 py-2 rounded-xl hover:bg-indigo-700 text-sm shrink-0"
            >
              <FiSave /> Save Notes
            </button>
            {saved && <span className="text-green-600 text-sm">✔ Notes saved</span>}
          </div>
        </div>
      )}
    </div>
  </div>
  
  
  );
}
