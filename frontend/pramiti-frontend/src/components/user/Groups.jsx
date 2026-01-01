import { useState, useEffect } from "react";
import api from "../../api";
import GroupDetails from "./GroupDetails";

export default function Groups({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupCode, setGroupCode] = useState("");
  const [loading,setloading]=useState(false)
  useEffect(() => { 
    setloading(true)
    api.get("user/groups/")
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err))
      .finally(() => setloading(false)); 
  }, []);

  const handleJoinGroup = () => {
    if (!groupCode) return;

    api.post("/groups/join/", { code: groupCode.toUpperCase() })
      .then((res) => {
        alert(res.data.message || "Request sent!");
        setJoinOpen(false);
        setGroupCode("");
        // Refresh the groups list after joining
        api.get("user/groups/").then((res) => setGroups(res.data));
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Error joining group");
      });
  };

  if (selectedGroup)
    return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-700">My Groups</h2>
        <button
          onClick={() => setJoinOpen(true)}
          className="px-4 py-2 border border-indigo-500 text-indigo-500 rounded hover:bg-indigo-50 transition"
        >
          Join Group
        </button>
      </div>

      
      
      {/* Groups Grid */}
     {/* Groups Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
  {groups.map((g) => {
    const status = g.membership_status || "NA"; // pending or active
    const isArchived = g.status === "inactive"; // <-- check group status

    return (
      <div
        key={g.id}
        className={`p-5 rounded-2xl shadow text-white bg-gradient-to-r ${
          g.gradient || "from-indigo-500 to-indigo-700"
        } flex flex-col justify-between`}
        style={{ minHeight: "220px" }}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{g.name}</h3>
            {g.unread > 0 && (
              <span className="bg-white text-indigo-800 px-2 py-1 rounded-full text-xs">
                {g.unread} unread
              </span>
            )}
          </div>
          <p className="text-sm mb-2">{g.description}</p>
        </div>

        {/* Button Logic */}
       {/* Button Logic */}
{isArchived ? (
  <button
    className="mt-4 w-full py-2 bg-indigo-900 text-white rounded cursor-not-allowed"
    disabled
  >
    Group Archived
  </button>
) : status === "pending" ? (
  <button
    className="mt-4 w-full py-2 bg-indigo-900 text-white rounded cursor-not-allowed"
    disabled
  >
    Pending activation
  </button>
) : status === "suspended" ? (
  <button
    className="mt-4 w-full py-2 bg-red-600 text-white rounded cursor-not-allowed"
    disabled
  >
    You&apos;re Suspended
  </button>
) : (
  <button
    onClick={() => setSelectedGroup(g)}
    className="mt-4 w-full py-2 border border-white text-white rounded hover:bg-white hover:text-gray-800 transition"
  >
    Open Group
  </button>
)}

      </div>
    );
  })}
</div>



      {/* Join Group Modal */}
      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setJoinOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl z-50">
            <h3 className="text-xl font-semibold mb-4">Join a Group</h3>
            <input
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              placeholder="Enter group code"
              className="w-full p-3 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setJoinOpen(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinGroup}
                className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
