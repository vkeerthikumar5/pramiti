// src/pages/groups/DocumentDetails.jsx
import React, { useEffect, useState } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import {
  FiArrowLeft,
  FiFileText,
  FiBarChart2,
  FiMessageCircle,
  FiLayers,
  FiActivity,
  FiEye
} from "react-icons/fi";
import api from "../../api";

export default function DocumentDetails({ document, onBack }) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [engagements, setEngagements] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const [qaData, setQaData] = useState([]);
  const [topicsData, setTopicsData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const docId = document?.id?.toString()?.trim();

  const tabs = [
    { id: "info", label: "Document Info", icon: <FiFileText /> },
    { id: "engagement", label: "Engagements", icon: <FiBarChart2 /> },
    { id: "qa", label: "Q&A", icon: <FiMessageCircle /> },
    { id: "clusters", label: "Topic Clusters", icon: <FiLayers /> },
    { id: "activity", label: "Activity Log", icon: <FiActivity /> },
  ];

  useEffect(() => {
    if (!docId) return;
    // Fetch Engagements
    api.get(`/documents/${docId}/engagement/`).then((res) => setEngagements(res.data.engagements || []));
    // Fetch Q&A
    api.get(`/documents/${docId}/qa/`).then((res) => setQaData(res.data.questions || []));
  }, [docId]);

  useEffect(() => {
    if (activeTab === "clusters" && docId) {
      api.get(`/documents/${docId}/topics/`).then((res) => setTopicsData(res.data.topics || []));
    }
  }, [activeTab, docId]);

  useEffect(() => {
    if (activeTab === "activity" && docId) {
      api.get(`/documents/${docId}/activity/`).then((res) => setActivityLogs(res.data || []));
    }
  }, [activeTab, docId]);

  const formatDateTime = (isoString) => {
    if (!isoString) return "NA";
    const date = new Date(isoString + (isoString.includes("Z") ? "" : "Z"));
    return isNaN(date) ? "NA" : date.toLocaleString("en-IN", { hour12: true });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
            <FiArrowLeft /> Back
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">{document.title}</h2>
            <p className="text-sm text-gray-500 truncate">{document.summary}</p>
            <div className="text-xs text-gray-400 mt-1 truncate">
              Uploaded by {document.uploadedBy} • {document.uploadedOn}
            </div>
          </div>
        </div>
        
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition ${
              activeTab === tab.id ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="space-y-6 mt-4">
        {/* Document Info */}
        {activeTab === "info" && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:flex-1 bg-white p-4 md:p-6 rounded-2xl shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-3">Document Preview</h3>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                {document?.file_url ? (
                  <div className="h-[400px] md:h-[600px] overflow-auto">
                    <Viewer fileUrl={document.file_url} plugins={[defaultLayoutPluginInstance]} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Loading document preview…</div>
                )}
              </Worker>
            </div>

            <aside className="bg-white p-4 md:p-6 rounded-2xl shadow space-y-4 w-full md:w-64 flex-shrink-0">
              <div>
                <div className="text-xs text-gray-500">Total Views</div>
                <div className="text-2xl font-bold">{document.views||0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Unique Readers</div>
                <div className="text-2xl font-bold">{document.readers||0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Completion</div>
                <div className="text-2xl font-bold">{document.completionPercent||0}%</div>
              </div>
            </aside>
          </div>
        )}

        {/* Engagement */}
        {activeTab === "engagement" && (
  <div className="overflow-x-auto w-76 md:w-full bg-white rounded-2xl shadow p-4 md:p-6">
    {engagements.length > 0 ? (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              "S.No",
              "Name",
              "Email Address",
              "Read Duration",
              "Reading Status",
              "Last Accessed On",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {engagements.map((e, idx) => {
            let statusColor =
              e.isCompleted === "Completed"
                ? "text-green-600"
                : e.isCompleted === "In Progress"
                ? "text-red-600"
                : "text-gray-500";

            return (
              <tr
                key={e.id || idx}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{e.participantName}</td>
                <td className="px-4 py-2">{e.email}</td>
                <td className="px-4 py-2">{e.readDuration || "NA"}</td>
                <td className={`px-4 py-2 font-medium ${statusColor}`}>
                  {e.isCompleted}
                </td>
                <td className="px-4 py-2">
                  {formatDateTime(e.lastAccessed)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-center">
        <FiEye className="text-6xl mb-4 opacity-50" />
        <p className="text-lg font-medium">No engagement data available</p>
        <p className="text-sm mt-1 max-w-md">
          User reading activity will appear here once participants start
          accessing the document.
        </p>
      </div>
    )}
  </div>
)}


        {/* Q&A */}
        {activeTab === "qa" && (
  <div className="grid gap-4 md:grid-cols-2">
    {qaData.length === 0 ? (
      <div className="col-span-full text-center text-gray-500 p-4 bg-white rounded-2xl shadow">
        No questions asked by users yet
      </div>
    ) : (
      qaData.map((q) => (
        <div key={q.id} className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <div className="font-medium text-gray-800">{q.user_name}</div>
              <div className="text-gray-700 mt-1">Q: {q.q}</div>
              <div className={`mt-2 ${q.a ? "text-green-700" : "text-yellow-800 font-medium"}`}>
                {q.a || "No answer yet"}
              </div>
            </div>
            <div className="text-xs text-gray-400">{formatDateTime(q.ts)}</div>
          </div>
        </div>
      ))
    )}
  </div>
)}


        {/* Topic Clusters */}
        {activeTab === "clusters" && (
  <div className="grid gap-4 md:grid-cols-2">
    {topicsData.length === 0 ? (
      <div className="col-span-full text-center text-gray-500 p-4 bg-white rounded-2xl shadow">
        No clusters generated yet
      </div>
    ) : (
      topicsData.map((c) => (
        <div
          key={c.id}
          className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition"
        >
          <div className="font-semibold text-gray-800">{c.topic}</div>
          <div className="text-sm text-gray-500 mt-1">
            Questions: {c.question_count}
          </div>
        </div>
      ))
    )}
  </div>
)}


        {/* Activity Log */}
        {activeTab === "activity" && (
  <div className="space-y-2">
    {activityLogs.length === 0 ? (
      <div className="text-center text-gray-500 p-4 bg-white rounded-2xl shadow">
        No activity recorded yet
      </div>
    ) : (
      activityLogs.map((a) => (
        <div
          key={a.id}
          className="flex flex-col sm:flex-row justify-between p-3 bg-white border border-gray-200 rounded-2xl shadow hover:shadow-lg transition"
        >
          <div className="text-gray-700 text-sm">{a.action}</div>
          <div className="text-gray-400 text-xs mt-1 sm:mt-0">
            {formatDateTime(a.timestamp)}
          </div>
        </div>
      ))
    )}
  </div>
)}

      </div>
    </div>
  );
}
