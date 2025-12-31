import { useState } from "react";
import Sidebar from "../components/user/Sidebar";
import Groups from "../components/user/Groups";
import Profile from "../components/user/Profile";
import Notifications from "../components/user/Notifications";

import DashboardHome from "../components/user/DashboardHome";
export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [unreadCount, setUnreadCount] = useState(0); // shared state

  const renderContent = () => {
    
    switch (activeTab) {
      

      case "groups":
        return (
          <Groups
          />
        );
        case "notifications":
          return <Notifications setUnreadCount={setUnreadCount}/>
      

      case "profile":
        return <Profile />;

      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount}/>

      <div className="flex-1 flex flex-col ml-0 sm:ml-64 transition-all">
        <header className="bg-indigo-700 text-white p-4 shadow-md md:hidden">
          <h1 className="text-md text-center font-bold">
            Pramiti - User Dashboard
          </h1>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
