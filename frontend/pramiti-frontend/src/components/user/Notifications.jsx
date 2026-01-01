import { useState, useEffect } from "react";
import { HiBell } from "react-icons/hi";
import api from "../../api";

export default function Notifications({ setUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const[loading,setloading]=useState(false)
  useEffect(() => {
    fetchNotifications();
  });

  const fetchNotifications = async () => {
    try {
        setloading(true)
      const { data } = await api.get("/notifications/user/");
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count); // update parent unread count
      setloading(false)
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (notifId, index) => {
    try {
      await api.post(`/notifications/read/${notifId}/`);
      const updated = [...notifications];
      updated[index].read = true;
      setNotifications(updated);

      // immediately decrease unread count
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error(err);
    }
  };  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
        <HiBell className="text-indigo-600" /> Notifications
      </h2>

      {/* Notifications List */}
      <div className="space-y-4 mt-4">
        {notifications.map((n, idx) => (
          <div
            key={n.id}
            className={`p-4 border rounded-xl shadow-sm flex justify-between items-start cursor-pointer transition hover:shadow-md ${
              n.read ? "bg-gray-50" : "bg-white"
            }`}
            onClick={() => !n.read && markAsRead(n.id, idx)}
          >
            <div>
              <h3 className={`font-semibold ${n.read ? "text-gray-500" : "text-gray-800"}`}>
                {n.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{n.time}</p>
            </div>
            {!n.read && (
              <span className="bg-indigo-600 w-3 h-3 rounded-full mt-1"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
