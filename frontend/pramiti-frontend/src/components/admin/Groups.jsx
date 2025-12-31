import { useState, useEffect } from "react";
import { FaUsers, FaFileAlt, FaEye, FaQuestionCircle, FaArrowRight } from "react-icons/fa";
import api from '../../api'

export default function Groups({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // Fetch groups from backend
  useEffect(() => {
    api.get("/groups/")
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Separate groups into admin and member
  
  const memberGroups = groups.filter(g => g.role !== "admin");

  const handleCreateGroup = () => {
    if (!newGroupName) {
      alert("Please enter group name");
      return;
    }

    api.post("/groups/", { name: newGroupName, description: newGroupDesc })
      .then((res) => {
        setGroups([res.data, ...groups]);
        setCreateOpen(false);
        setNewGroupName("");
        setNewGroupDesc("");
      })
      .catch((err) => {
        console.error(err);
        alert("Error creating group");
      });
  };

  const renderGroupCard = (group) => (
    <div
      key={group.id}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition-all cursor-pointer overflow-hidden"
      onClick={() => onSelectGroup(group)}
    >
      <div className="h-28 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-indigo-700 flex flex-col justify-center px-5">
        <h2 className="text-2xl font-semibold text-white truncate">
          {group.name}
        </h2>
        {group.code && (
          <p className="text-indigo-200 text-sm mt-1 truncate">
            Code: {group.code}
          </p>
        )}
      </div>
  
      <div className="p-5 space-y-4">
  
        {/* 📊 Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-500">Members</p>
            <p className="text-lg font-semibold text-gray-800">
              {group.members_count ?? 0}
            </p>
          </div>
  
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-500">Documents</p>
            <p className="text-lg font-semibold text-gray-800">
              {group.documents_count ?? 0}
            </p>
          </div>
  
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-500">Questions</p>
            <p className="text-lg font-semibold text-gray-800">
              {group.questions_count ?? 0}
            </p>
          </div>
        </div>
  
        <button
          onClick={() => onSelectGroup(group)}
          className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition"
        >
          View Details <FaArrowRight />
        </button>
      </div>
    </div>
  );
  

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Groups</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition flex items-center gap-2"
        >
          + Create Group
        </button>
      </div>

     
      {/* Member Groups */}
     {/* Member Groups */}
{memberGroups.length > 0 ? (
  <div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {memberGroups.map(renderGroupCard)}
    </div>
  </div>
) : (
  <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
    <FaUsers className="text-5xl mb-4 opacity-60" />
    <p className="text-lg font-medium">No groups created yet</p>
    <p className="text-sm mt-1">
      Create a group to start collaborating and uploading documents.
    </p>
  </div>
)}


      {/* Create Group Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Group</h3>
              <button onClick={() => setCreateOpen(false)} className="text-2xl text-gray-400">✕</button>
            </div>
            <div className="space-y-3">
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group Name" className="w-full p-3 border rounded" />
              <textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Short Description" className="w-full p-3 border rounded" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
              <button onClick={handleCreateGroup} className="px-4 py-2 rounded bg-green-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
