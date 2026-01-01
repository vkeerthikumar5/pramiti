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
  const hasFetchedRef = useRef(false);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const res = await api.get(`/documents/${doc.id}/read-status/`);
        setIsCompleted(res.data.is_completed);
        setReadTime(res.data.read_time_seconds || 0);
        readTimeRef.current = res.data.read_time_seconds || 0;
        lastSentTimeRef.current = res.data.read_time_seconds || 0;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [doc.id]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setReadTime((p) => p + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    readTimeRef.current = readTime;
  }, [readTime]);

  useEffect(() => {
    const send = setInterval(() => {
      const delta = readTimeRef.current - lastSentTimeRef.current;
      if (delta <= 0 && isCompleted) return;
      lastSentTimeRef.current = readTimeRef.current;

      api.post(`/documents/${doc.id}/read-status/`, {
        read_time_seconds: delta > 0 ? delta : 0,
        is_completed: isCompleted,
      });
    }, 10000);
    return () => clearInterval(send);
  }, [doc.id, isCompleted]);

  const handleMarkAsComplete = async () => {
    await api.post(`/documents/${doc.id}/read-status/`, {
      read_time_seconds: readTimeRef.current,
      is_completed: true,
    });
    setIsCompleted(true);
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
    setChatHistory((p) => [...p, { role: "user", text: message }]);
    setMessage("");
    setAiTyping(true);

    try {
      const res = await api.post(`/documents/${doc.id}/ask-ai/`, {
        question: message,
        group_id: group.id,
      });
      setChatHistory((p) => [...p, { role: "ai", text: res.data.answer }]);
    } catch {
      setChatHistory((p) => [...p, { role: "ai", text: "❌ Failed" }]);
    } finally {
      setAiTyping(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (activeTab === "history") {
      api.get(`/documents/${doc.id}/history/`).then((r) => setHistoryData(r.data));
    }
  }, [activeTab, doc.id]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="px-4 sm:px-6 py-4 flex flex-wrap gap-3 items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="flex items-center gap-2 text-indigo-600">
            <FiArrowLeft /> Back
          </button>
          <div>
            <h2 className="text-lg font-semibold">{doc.title}</h2>
            <p className="text-xs text-gray-500">Viewing document</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
          AI Enabled
        </span>
      </div>

      {/* TABS */}
      <div className="px-4 sm:px-6 mt-4">
        <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 overflow-hidden">
        {activeTab === "read" && (
          <div className="h-full bg-white rounded-2xl border flex flex-col overflow-hidden">
            <div className="m-2">
              <button
                onClick={handleMarkAsComplete}
                disabled={loading || isCompleted}
                className={`px-6 py-3 rounded-xl text-sm ${
                  isCompleted
                    ? "bg-green-100 text-green-700"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {isCompleted ? "✔ Completed" : "Mark as Complete"}
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={doc.file_url} plugins={[defaultLayoutPluginInstance]} />
              </Worker>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-full flex flex-col bg-white rounded-2xl border">
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
              {chatHistory.map((chat, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${
                    chat.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {chat.role === "ai" && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FiCpu />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[60%] px-4 sm:px-6 py-3 sm:py-4 rounded-3xl text-sm ${
                      chat.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {chat.text}
                  </div>
                  {chat.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t px-4 sm:px-6 py-3">
              <div className="flex gap-2 bg-gray-100 rounded-2xl px-3 py-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-3 rounded-xl">
                  <FiSend />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 overflow-y-auto h-full">
            {historyData.map((h, i) => (
              <div key={i} className="bg-white border rounded-2xl p-6">
                <h4 className="font-medium">{h.question}</h4>
                <p className="text-sm text-gray-600">{h.answer}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white border rounded-2xl p-6 h-full flex flex-col gap-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 border rounded-xl p-4"
            />
            <button
              onClick={() => api.post(`/documents/${doc.id}/note/`, { content: notes })}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl w-fit"
            >
              <FiSave /> Save Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
