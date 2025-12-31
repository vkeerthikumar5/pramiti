import { useState, useEffect } from "react";
import { FaUserMd, FaClipboardList, FaChartLine, FaCog, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function Sidebar({ activeTab, setActiveTab,unreadCount }) {
  const [isOpen, setIsOpen] = useState(false);
  

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications/user/");
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // optional: refresh every 30s
    return () => clearInterval(interval);
  });

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <FaChartLine /> },
    { key: "groups", label: "Groups", icon: <FaClipboardList /> },
    { key: "notifications", label: "Notifications", icon: <FaClipboardList />, badge: unreadCount },
    { key: "profile", label: "Profile", icon: <FaUserMd /> },
  ];

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none fixed top-4 left-4 z-50"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 bg-gray-900 text-white shadow-lg ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          {/* Logo */}
          <div className="h-32 flex items-center justify-center">
            <h1 className="text-2xl text-violet-800 font-bold px-3 py-2 rounded">Pramiti</h1>
          </div>

          {/* Nav Items */}
          <ul className="space-y-2 font-medium flex-1">
            {menuItems.map((item) => (
              <li key={item.key} className="relative">
                <button
                  onClick={() => {
                    setActiveTab(item.key);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-violet-700/80 w-full ${activeTab === item.key ? "bg-violet-700/80" : ""}`}
                >
                  {item.icon} <span>{item.label}</span>
                </button>
                {item.badge > 0 && (
                  <span className="absolute top-2 right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </li>
            ))}
            <li>
              <button className="flex items-center gap-2 p-2 rounded hover:bg-red-600 w-full" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black opacity-40 sm:hidden z-30" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
}
