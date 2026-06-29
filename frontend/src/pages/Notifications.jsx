import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { api } from '../context/AuthContext';
import { Bell, CheckCheck, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Notifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    setActionLoading(`del-${id}`);
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <main className="pt-16 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Bell size={24} className="text-accent" />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-accent text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-slate-400 text-sm mt-1">Your latest activity and updates</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                id="mark-all-read"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition"
              >
                <CheckCheck size={16} /> Mark All Read
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Bell size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No notifications yet</p>
              <p className="text-slate-500 text-sm mt-1">Activity and updates will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {notifications.map((n) => (
                  <motion.div
                    key={n.notification_id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`glass-panel rounded-2xl p-5 flex items-start gap-4 transition-all ${
                      !n.is_read ? 'border border-accent/25 bg-accent/5' : 'opacity-75'
                    }`}
                  >
                    <div className={`mt-0.5 rounded-xl p-2 ${n.is_read ? 'bg-slate-800/60' : 'bg-accent/15'}`}>
                      <Info size={16} className={n.is_read ? 'text-slate-500' : 'text-accent'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {new Date(n.created_at).toLocaleString()}
                        {!n.is_read && <span className="ml-2 text-accent font-semibold">• Unread</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.is_read && (
                        <button
                          id={`mark-read-${n.notification_id}`}
                          onClick={() => markRead(n.notification_id)}
                          disabled={actionLoading === n.notification_id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition disabled:opacity-50"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button
                        id={`delete-notif-${n.notification_id}`}
                        onClick={() => deleteNotification(n.notification_id)}
                        disabled={actionLoading === `del-${n.notification_id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;
