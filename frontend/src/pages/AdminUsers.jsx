import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { api } from '../context/AuthContext';
import { Users, Search, Trash2, ShieldCheck, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = ['Student', 'Leader', 'Judge', 'Manager', 'Admin'];

const ROLE_COLORS = {
  Student: 'bg-blue-500/20 text-blue-400',
  Leader: 'bg-green-500/20 text-green-400',
  Judge: 'bg-yellow-500/20 text-yellow-400',
  Manager: 'bg-purple-500/20 text-purple-400',
  Admin: 'bg-red-500/20 text-red-400',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      showToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'All') result = result.filter((u) => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.college || '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [users, search, roleFilter]);

  const updateRole = async (userId, newRole) => {
    setActionLoading(`role-${userId}`);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)));
      showToast('success', `Role updated to ${newRole}`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(`del-${userId}`);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      showToast('success', 'User deleted');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <main className="pt-16 p-8">
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                  : 'bg-red-500/20 border border-red-500/40 text-red-300'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {toast.message}
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Users size={24} className="text-accent" /> User Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {filtered.length} users {roleFilter !== 'All' ? `with role "${roleFilter}"` : 'total'}
              </p>
            </div>
            <button onClick={fetchUsers} id="refresh-users"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="search-users"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, college..."
                className="w-full glass-input pl-9 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', ...ROLES].map((r) => (
                <button
                  key={r}
                  id={`filter-role-${r.toLowerCase()}`}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                    roleFilter === r
                      ? 'bg-accent text-white'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-panel rounded-xl p-4 animate-pulse flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Users size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80">
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">User</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">College</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((user) => (
                      <motion.tr
                        key={user.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-slate-800/40 hover:bg-slate-800/20 transition"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">
                          {user.college || '—'}
                          {user.branch && <span className="ml-1 text-slate-600">· {user.branch}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            id={`role-select-${user.user_id}`}
                            value={user.role}
                            onChange={(e) => updateRole(user.user_id, e.target.value)}
                            disabled={actionLoading === `role-${user.user_id}`}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer outline-none ${ROLE_COLORS[user.role] || 'bg-slate-700 text-slate-300'}`}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            id={`delete-user-${user.user_id}`}
                            onClick={() => deleteUser(user.user_id)}
                            disabled={actionLoading === `del-${user.user_id}`}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                            title="Delete user"
                          >
                            {actionLoading === `del-${user.user_id}` ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminUsers;
