// src/pages/groups/GroupDetails.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiFileText,
  FiActivity,
  FiSettings,
  FiArrowLeft,
  FiPlus,
  FiDownload,
  FiEye,
  FiTrash2,
  FiCheck,
  FiX,
  FiSlash,
  
} from "react-icons/fi";
import api from "../../api";
import { useRef } from "react";




export default function GroupDetails({ group, onBack, onSelectDocument }) {
  const navigate = useNavigate();
  const hasDeletedDocRef = useRef(false);
  const [activeTab, setActiveTab] = useState("documents");
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ name: "", description: "" });

  const filteredDocs = useMemo(() => documents, [documents]);

  useEffect(() => {
    if (!group?.id) return;
    const fetchGroupDetails = async () => {
      try {
        const res = await api.get(`/groups/${group.id}/`);
        setGroupData(res.data);
      } catch (error) {
        console.error("Failed to fetch group details", error);
      }
    };
    fetchGroupDetails();
  }, [group]);

  useEffect(() => {
    if (!group?.id) return;
    api.get(`/groups/${group.id}/members/`).then((res) => {
      setMembers(
        res.data.map((m) => ({
          id: m.user.id,
          name: m.user.full_name,
          email: m.user.email,
          role: m.role === "admin" ? "Admin" : "Member",
          status:
            m.status === "active"
              ? "Active"
              : m.status === "pending"
              ? "Pending"
              : "Suspended",
          lastActive: m.last_active
            ? new Date(m.last_active).toLocaleString()
            : "—",
          avatar: `https://i.pravatar.cc/48?u=${m.user.email}`,
        }))
      );
    });
  }, [group]);

  useEffect(() => {
    if (!group?.id) return;
    const fetchDocuments = async () => {
      try {
        const res = await api.get(`/groups/${group.id}/documents/`);
        setDocuments(
          res.data.map((doc) => ({
            id: doc.id,
            title: doc.title,
            summary: doc.summary,
            file_url: doc.file_url,
            uploadedBy: doc.uploaded_by_name || "Unknown",
            uploadedOn: new Date(doc.uploaded_on).toLocaleDateString(),
            fileSize: doc.file_size || "",
            views: doc.views || 0,
            readers: doc.readers || 0,
            unansweredQuestions: doc.not_completed_count||0,
            completionPercent: doc.completion_percent || 0,
            completed_count: doc.completed_count ?? 0,
           
          }))
        );
      } catch (error) {
        console.error("Failed to fetch documents", error);
      }
    };
    fetchDocuments();
  }, [group]);

  if (!groupData) return <div className="p-6 text-gray-500">Loading group details...</div>;

  const statusBadge = (status) => {
    const styles = {
      Active: "bg-green-50 text-green-700",
      Pending: "bg-yellow-50 text-yellow-700",
      Suspended: "bg-red-50 text-red-700",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };
  // Add this function inside your GroupDetails component

const updateStatus = async (userId, newStatus) => {
  if (!groupData?.id) return;

  const statusMap = {
    Active: "active",
    Pending: "pending",
    Suspended: "suspended",
  };

  try {
    await api.patch(
      `/groups/${groupData.id}/members/${userId}/status/`,
      { status: statusMap[newStatus] }
    );

    // ✅ REFRESH FROM DB
    fetchGroupMembers();
  } catch (err) {
    console.error(err);
    alert("Failed to update member status");
  }
};


  const editGroup = async (data) => {
    try {
      const res = await api.patch(`/groups/${group.id}/`, data);
      setGroupData(res.data);
      alert("Group updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update group");
    }
  };
  
  const toggleArchiveGroup = async () => {
    setManageOpen(false);
    const isArchived = groupData.status === "inactive";
    const confirmMsg = isArchived
      ? "Activate this group?"
      : "Archive this group?";
    if (!confirm(confirmMsg)) return;
  
    try {
      await api.patch(`/groups/${group.id}/archive/`);
      setGroupData(prev => ({
        ...prev,
        status: isArchived ? "active" : "inactive"
      }));
      alert(isArchived ? "Group activated!" : "Group archived!");
    } catch (err) {
      console.error(err);
      alert("Failed to update group status");
    }
  };
  
  
  const deleteGroup = async () => {
   
    if (!confirm("Delete this group permanently?")) return;
    try {
      await api.delete(`/groups/${group.id}/`);
      alert("Group deleted!");
      onBack();
    } catch (err) {
      console.error(err);
      alert("Failed to delete group");
    }
  };

  const uploadDocument = async (formData) => {
    try {
      const res = await api.post(`/groups/${group.id}/documents/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocuments((prev) => [res.data, ...prev]); // Add new document to list
      setUploadOpen(false);
      setUploadTitle("");
      setUploadSummary("");
      setUploadFile(null);
      alert("Document uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload document");
    }
  };
  const deleteDocument = async (docId) => {
    if (hasDeletedDocRef.current) return; // 🛑 prevent duplicate delete
    if (!confirm("Delete this document permanently?")) return;
  
    try {
      hasDeletedDocRef.current = true; // ✅ lock
  
      await api.delete(
        `/groups/${group.id}/documents/${docId}/delete/`
      );
  
      setDocuments((prev) =>
        prev.filter((d) => d.id !== docId)
      );
  
      alert("Document deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete document");
    } finally {
      // 🔓 unlock after short delay
      setTimeout(() => {
        hasDeletedDocRef.current = false;
      }, 500);
    }
  };
  
  
  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
            <FiArrowLeft /> Back
          </button>
          <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-2xl border-2 border-indigo-500 shadow-sm">
            {(groupData.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{groupData.name}</h1>
            <p className="text-sm text-gray-500 truncate">{groupData.description}</p>
            <div className="mt-2 flex gap-2 items-center text-xs text-gray-600 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${groupData.status === "inactive" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
                {groupData.status === "inactive" ? "Archived" : "Active"}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700">Members: {groupData.members_count}</span>
              <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700">Docs: {groupData.documents_count}</span>
              <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700">Qs: {groupData.questions_count}</span>
            </div>
          </div>
        </div>

        {/* Right-end buttons */}
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <div className="relative">
            <button onClick={() => setManageOpen(!manageOpen)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md text-gray-700 whitespace-nowrap">
              <FiSettings /> Manage
            </button>
            {manageOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-indigo-50"
                  onClick={() => { setEditData({ name: groupData.name, description: groupData.description }); setEditOpen(true); setManageOpen(false); }}
                >Edit Group</button>
                <button
  className={`block w-full text-left px-4 py-2 ${
    groupData.status === "inactive" ? "hover:bg-green-50" : "hover:bg-red-50"
  }`}
  onClick={toggleArchiveGroup}
>
  {groupData.status === "inactive" ? "Activate Group" : "Archive Group"}
</button>

                <button className="block w-full text-left px-4 py-2 hover:bg-red-50" onClick={() => deleteGroup() }>Delete Group</button>
              </div>
            )}
          </div>
          <button onClick={() => { setUploadOpen(true); setActiveTab("documents"); }} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 whitespace-nowrap">
            <FiPlus /> Upload Document
          </button>
        </div>
      </div>
      {editOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/40" onClick={() => setEditOpen(false)} />
    <div className="relative bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl z-50">
      <h3 className="text-xl font-semibold mb-4">Edit Group</h3>
      <input
        className="w-full p-3 border rounded mb-3"
        value={editData.name}
        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
        placeholder="Group Name"
      />
      <textarea
        className="w-full p-3 border rounded mb-3"
        value={editData.description}
        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
        placeholder="Group Description"
      />
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => setEditOpen(false)}>Cancel</button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={async () => {
            await editGroup(editData);
            setEditOpen(false);
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
{uploadOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    {/* Background overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setUploadOpen(false)}
    />
    {/* Modal content */}
    <div className="relative bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl z-50">
      <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
      <input
        type="text"
        className="w-full p-3 border rounded mb-3"
        placeholder="Document Name"
        value={uploadTitle}
        onChange={(e) => setUploadTitle(e.target.value)}
      />
      <textarea
        className="w-full p-3 border rounded mb-3"
        placeholder="Description"
        value={uploadSummary}
        onChange={(e) => setUploadSummary(e.target.value)}
      />
      <input
        type="file"
        className="w-full mb-3"
        onChange={(e) => setUploadFile(e.target.files[0])}
      />
      <div className="flex justify-end gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-gray-100 rounded"
          onClick={() => setUploadOpen(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-900"
          onClick={() => {
            if (!uploadTitle || !uploadFile) {
              alert("Please provide document name and file");
              return;
            }
            const formData = new FormData();
            formData.append("title", uploadTitle);
            formData.append("summary", uploadSummary);
            formData.append("file", uploadFile);
            uploadDocument(formData); // Call the separated function
          }}
        >
          Upload
        </button>
      </div>
    </div>
  </div>
)}
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "documents", label: "Documents", icon: <FiFileText /> },
          { key: "members", label: "Members", icon: <FiUsers /> },
          
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${
              activeTab === t.key ? "bg-indigo-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="space-y-6">
        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-500">Uploaded documents for this group. Click View Insights to see document analytics.</p>
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap">Showing {filteredDocs.length} documents</div>
              </div>

              <div className="space-y-4">
  {filteredDocs.length > 0 ? (
    filteredDocs.map((doc) => (
      <div key={doc.id} className="bg-white w-full p-4 rounded-2xl shadow hover:shadow-lg transition">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-4 items-center flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {doc.title.split(" ").slice(0, 2).map(s => s[0]).join("")}
            </div>
            <div className="min-w-0">
              <div className="text-md font-semibold text-gray-900 truncate">{doc.title}</div>
              <div className="text-sm text-gray-500 truncate">{doc.summary}</div>
              <div className="text-xs text-gray-400 mt-2 truncate">
                Uploaded by {doc.uploadedBy} <br /> on {doc.uploadedOn}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 mt-2 md:mt-0 flex-shrink-0">
            <div className="text-sm text-gray-600">{doc.fileSize}</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSelectDocument(doc)}
                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                <FiEye /> View Insights
              </button>

              <button
                onClick={() => deleteDocument(doc.id)}
                className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">{doc.completionPercent}% read</span>
          <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">{doc.readers} In Progress</span>
          <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">{doc.completed_count} Completed</span>
          <span className="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">{doc.unansweredQuestions} Uncompleted</span>
        </div>
      </div>
    ))
  ) : (
    <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
      <FiFileText className="text-6xl mb-4 opacity-50" />
      <p className="text-lg font-medium">No documents uploaded yet</p>
      <p className="text-sm mt-1 max-w-md">
        Upload a document to start tracking reading progress and AI insights.
      </p>
    </div>
  )}
</div>

            </div>

            <aside className="bg-white p-4 md:p-6 rounded-2xl shadow flex-shrink-0 w-full md:w-64">
              <h4 className="font-semibold mb-3 text-gray-700">Quick Insights</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xs text-gray-500">Total Documents</div>
                  <div className="text-xl font-bold text-indigo-900">{groupData.documents_count}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-gray-500">Avg Completion</div>
                  <div className="text-xl font-bold text-green-900">{Math.round(documents.reduce((s,d)=>s+d.completionPercent,0)/documents.length || 0)}%</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xs text-gray-500">Uncompleted Documents</div>
                  <div className="text-xl font-bold text-yellow-900">{documents.reduce((s,d)=>s+d.unansweredQuestions,0)}</div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
  <div className="bg-white w-76 md:w-full rounded-2xl shadow overflow-x-auto">
    <div className="p-5 border-b border-gray-200">
      <h3 className="text-lg font-semibold">Members ({members.length})</h3>
      <p className="text-sm text-gray-500">
        Approve, suspend or remove group members
      </p>
    </div>

    {members.length > 0 ? (
      <table className="w-full text-sm min-w-[200px] md:min-w-full">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-center">Member</th>
            <th className="px-4 py-3 text-center">Email</th>
            <th className="px-4 py-3 text-center">Role</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {members.map((m) => (
            <tr
              key={m.id}
              className="border-b border-gray-200 hover:bg-gray-50 transition"
            >
              <td className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold border-2 border-indigo-500 shadow-sm">
                  {(m.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {m.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{m.id}</div>
                </div>
              </td>

              <td className="px-4 py-3 truncate">{m.email}</td>
              <td className="px-4 py-3">{m.role}</td>
              <td className="px-4 py-3">{statusBadge(m.status)}</td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  {m.status === "Pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(m.id, "Active")}
                        className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1"
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}

                  {m.status === "Active" && (
                    <>
                      <button
                        onClick={() => updateStatus(m.id, "Suspended")}
                        className="px-3 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600 inline-flex items-center gap-1"
                      >
                        <FiSlash /> Suspend
                      </button>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </>
                  )}

                  {m.status === "Suspended" && (
                    <>
                      <button
                        onClick={() => updateStatus(m.id, "Active")}
                        className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1"
                      >
                        <FiCheck /> Re-activate
                      </button>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-center">
        <FiUsers className="text-6xl mb-4 opacity-50" />
        <p className="text-lg font-medium">No members in this group yet</p>
        <p className="text-sm mt-1 max-w-md">
          Members will appear here once they join or are invited.
        </p>
      </div>
    )}
  </div>
)}


        
      </div>
    </div>
  );
}
