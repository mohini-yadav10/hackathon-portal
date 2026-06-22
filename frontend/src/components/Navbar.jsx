import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { Bell, User, LogOut, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ title }) => {
  const { user, logoutUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      fetchNotifications();
      // Poll every 30 seconds for live notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="glass-panel h-16 flex justify-between items-center px-6 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <span className="text-accent text-glow">HACK</span> PORTAL
        </h1>
        {title && (
          <>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-medium text-sm md:text-base">{title}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown (Students only) */}
        {user && user.role === 'Student' && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 glass-panel bg-slate-900 rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto border border-slate-700 z-50">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-accent hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notification_id}
                        className={`p-2.5 rounded-lg text-xs leading-relaxed transition ${
                          n.is_read ? 'bg-slate-800/40 text-slate-400' : 'bg-slate-800 text-white font-medium border-l-2 border-accent'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p>{n.message}</p>
                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkRead(n.notification_id, e)}
                              className="text-[10px] text-accent hover:underline flex-shrink-0"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-800/60 pl-3 pr-4 py-1.5 rounded-full border border-slate-700/50">
            <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center text-accent border border-accent/30 font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{user.role}</p>
            </div>
            <button
              onClick={logoutUser}
              className="text-slate-400 hover:text-red-400 transition ml-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
