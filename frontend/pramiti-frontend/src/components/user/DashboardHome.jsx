import { HiBell, HiBookOpen, HiUserGroup, HiChartBar, HiClipboardList } from "react-icons/hi";
import { HiSparkles } from "react-icons/hi2";
import { useState,useEffect } from "react";
import api from "../../api";
import DocumentView from "./DocumentView";
import GroupDetails from "./GroupDetails";
export default function DashboardHome() {
  const [selectedGroup, setSelectedGroup] = useState(null);
const [selectedDoc, setSelectedDoc] = useState(null);




 
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/user/dashboard/");
        
        setDashboard(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  });


if (selectedDoc) return <DocumentView doc={selectedDoc} group={selectedGroup} goBack={() => setSelectedDoc(null)} />;
if (selectedGroup) return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;
if (!dashboard) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-indigo-600 font-medium">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}

const myGroups = dashboard.group_names; // or full group objects if you send them
const continueReading = dashboard.not_completed_docs;


const stats = [
{ label: "Groups Joined", value: dashboard.groups_joined_count, icon: HiUserGroup },
{ label: "Documents Read", value: dashboard.documents_completed_count, icon: HiBookOpen },
{ label: "In Progress", value: dashboard.started_not_completed_count, icon: HiChartBar },
{ label: "Pending Reads", value: dashboard.not_started_documents_count, icon: HiClipboardList },

];

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-indigo-600">{dashboard.name}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Stay updated with your groups, documents & AI insights.
          </p>
        </div>

        
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 shadow hover:shadow-xl transition transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
                  <Icon size={28} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                  <div className="text-2xl font-bold">{s.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* My Groups */}
        <div className="bg-white rounded-2xl p-6 shadow space-y-5">
  <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
    <HiUserGroup className="text-indigo-600" /> My Groups
  </h2>

  <div className="space-y-3">
    {myGroups.map((g, idx) => (
      <div
        key={idx}
        className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer"
      >
        {/* Left: Group name */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">
            {g}
          </h3>
          <p className="text-xs text-gray-500">
            Active group
          </p>
        </div>

        {/* Right: subtle action indicator */}
        <span className="text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
          Open →
        </span>
      </div>
    ))}
  </div>
</div>


        {/* Continue Reading */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow space-y-4">
  <h2 className="text-xl font-semibold flex items-center gap-2">
    <HiBookOpen /> Continue Reading
  </h2>

  {continueReading.length === 0 && (
   <div className="flex items-center justify-center h-[180px]">
   <p className="text-sm text-gray-500">
     No documents in progress 🎉
   </p>
 </div>
  )}

  {continueReading.map((doc, idx) => (
    <div
      key={idx}
      onClick={() => {
        setSelectedGroup({ id: doc.group_id, name: doc.group });
        setSelectedDoc({
          id: doc.document_id,
          title: doc.document,
          file_url:doc.file_url
        });
      }}
      className="p-4 border rounded-xl shadow-sm hover:shadow transition cursor-pointer"
    >
      <h3 className="font-semibold text-indigo-700">{doc.document}</h3>
      <p className="text-xs text-gray-500 mt-1">{doc.group}</p>
    </div>
  ))}
</div>

      </div>

     

    </div>
  );
}
