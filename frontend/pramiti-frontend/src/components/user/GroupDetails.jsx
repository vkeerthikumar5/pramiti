import { useState,useEffect } from "react";
import {
  FiFileText,
  FiUsers,
  FiBell,
  FiActivity,
  FiArrowLeft,
} from "react-icons/fi";
import DocumentView from "./DocumentView";
import api from "../../api";
export default function GroupDetails({ group, goBack }) {
  const [tab, setTab] = useState("documents");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [members, setMembers] = useState([]);

  const [documents, setDocuments] = useState([]);
  const [loading,setloading]=useState(false)
  useEffect(() => {
    if (!group?.id) return;
    setloading(true)
    const fetchDocuments = async () => {
      try {
        
        const res = await api.get(`/groups/${group.id}/documents/`);
        const normalizedDocs = res.data.map(doc => ({
          id: doc.id,
          title: doc.title,
          summary: doc.summary,
          file_url: doc.file_url,
        }));
        setDocuments(normalizedDocs);
        setloading(false)
      } catch (error) {
        console.error("Failed to fetch documents", error);
      }
    };
  
    fetchDocuments();
  }, [group]);
  
  useEffect(() => {
    if (!group?.id) return;
  
    api.get(`/groups/${group.id}/members/`)
      .then(res => {
        setMembers(
          res.data.map(m => ({
            id: m.user.id,
            name: m.user.full_name,   // ✅ IMPORTANT
            email: m.user.email,
            role: m.role === "admin" ? "Admin" : "Member",
            
          }))
        );
        
      });
  }, [group]);
  
  
  const announcements = [
    { title: "Security Policy Updated", time: "2 days ago" },
  ];

  if (selectedDoc) {
    return <DocumentView group = {group} doc={selectedDoc} goBack={() => setSelectedDoc(null)} />;
  }

  const tabs = [
    { id: "documents", label: "Documents", icon: <FiFileText /> },
   
    { id: "members", label: "Members", icon: <FiUsers /> },
    
  ];
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-indigo-600 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-indigo-600 font-medium hover:underline"
      >
        <FiArrowLeft /> Back to Groups
      </button>

      {/* Group Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <h2 className="text-3xl font-bold">{group.name}</h2>
        <p className="opacity-90 mt-1">{group.description}</p>

        <div className="flex gap-6 mt-4 text-sm">
          <span>📄 {documents.length} Documents</span>
          <span>👥 {members.length} Members</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.id
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "documents" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedDoc(doc)}
              className="group cursor-pointer rounded-2xl bg-white p-5 shadow hover:shadow-xl transition"
            >
              <FiFileText className="text-indigo-600 text-2xl" />
              <h3 className="mt-3 font-semibold text-lg group-hover:text-indigo-600">
                {doc.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{doc.summary}</p>

              <div className="mt-4 text-indigo-600 text-sm font-medium">
                Open → 
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-4">
          {members.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white p-4 rounded-xl shadow"
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-gray-500">{m.role}</p>
              </div>
              
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
}
