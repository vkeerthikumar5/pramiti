import { useState } from "react";
import Sidebar from "../components/admin/Sidebar";
import Groups from "../components/admin/Groups";
import GroupDetails from "../components/admin/GroupDetails";
import DocumentDetails from "../components/admin/DocumentDetails";
import Members from "../components/admin/Members";
import Profile from "../components/admin/Profile";
import DashboardHome from "../components/admin/DashboardHome";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const handleTabChange = (tab) => {
    setSelectedDocument(null);
    setSelectedGroup(null);
    setActiveTab(tab);
  };
  const renderContent = () => {
    // Document Details inside dashboard
    if (selectedDocument) {
      return (
        <DocumentDetails
          document={selectedDocument}
          group={selectedGroup}
          onBack={() => setSelectedDocument(null)}
        />
      );
    }

    // Group Details inside dashboard
    if (selectedGroup) {
      return (
        <GroupDetails
          group={selectedGroup}
          onSelectDocument={(doc) => setSelectedDocument(doc)}
          onBack={() => setSelectedGroup(null)}
        />
      );
    }
    
    
    // Tabs (dashboard, groups, members, profile)
    switch (activeTab) {
      case "groups":
        return (
          <Groups
            onSelectGroup={(group) => setSelectedGroup(group)}
          />
        );
      case "members":
        return <Members />;
      case "profile":
        return <Profile />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col ml-0 sm:ml-64 transition-all">
        <header className="bg-indigo-700 text-white p-4 shadow-md md:hidden">
          <h1 className="text-md text-center font-bold">
            Pramiti - Admin Dashboard
          </h1>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
