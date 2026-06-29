import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { api } from '../context/AuthContext';
import { Award, Plus, Edit3, Trash2, Search, Loader2, X, CheckCircle2, AlertCircle, Globe, Archive, UserCheck, ShieldAlert, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  Draft: 'bg-slate-700 text-slate-400',
  Published: 'bg-green-500/20 text-green-400',
  Completed: 'bg-blue-500/20 text-blue-400',
  Archived: 'bg-orange-500/20 text-orange-400',
};

const EMPTY_FORM = {
  title: '', description: '', start_date: '', end_date: '',
  location: '', max_team_size: 4, registration_deadline: '', status: 'Draft',
};

const AdminHackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Assignments Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignHackathon, setAssignHackathon] = useState(null);
  const [assignTab, setAssignTab] = useState('manager'); // 'manager' | 'judge'
  const [assignedManagers, setAssignedManagers] = useState([]);
  const [assignedJudges, setAssignedJudges] = useState([]);
  const [allManagersList, setAllManagersList] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [loadingAssigns, setLoadingAssigns] = useState(false);

  // Assignment Form inputs
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [spec, setSpec] = useState('');
  const [org, setOrg] = useState('');
  const [exp, setExp] = useState('2');
  const [savingAssign, setSavingAssign] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hackathons');
      setHackathons(res.data.data || []);
    } catch (err) {
      showToast('error', 'Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  useEffect(() => {
    let result = hackathons;
    if (statusFilter !== 'All') result = result.filter((h) => h.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((h) => h.title.toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [hackathons, search, statusFilter]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (h) => {
    setEditTarget(h);
    setForm({
      title: h.title,
      description: h.description || '',
      start_date: h.start_date?.split('T')[0] || '',
      end_date: h.end_date?.split('T')[0] || '',
      location: h.location || '',
      max_team_size: h.max_team_size || 4,
      registration_deadline: h.registration_deadline?.split('T')[0] || '',
      status: h.status,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/hackathons/${editTarget.hackathon_id}`, form);
        showToast('success', 'Hackathon updated successfully');
      } else {
        await api.post('/hackathons', form);
        showToast('success', 'Hackathon created successfully');
      }
      setShowModal(false);
      fetchHackathons();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save hackathon');
    } finally {
      setSubmitting(false);
    }
  };

  const quickStatusChange = async (hackathon, newStatus) => {
    try {
      await api.put(`/hackathons/${hackathon.hackathon_id}`, { ...hackathon, status: newStatus });
      setHackathons((prev) => prev.map((h) => h.hackathon_id === hackathon.hackathon_id ? { ...h, status: newStatus } : h));
      showToast('success', `Hackathon ${newStatus.toLowerCase()}`);
    } catch (err) {
      showToast('error', 'Failed to update status');
    }
  };

  const deleteHackathon = async (id) => {
    if (!window.confirm('Delete this hackathon? All associated teams and registrations will also be removed.')) return;
    try {
      await api.delete(`/hackathons/${id}`);
      setHackathons((prev) => prev.filter((h) => h.hackathon_id !== id));
      showToast('success', 'Hackathon deleted');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete hackathon');
    }
  };

  // Assignments Modal actions
  const fetchAssignments = async (hackathonId) => {
    setLoadingAssigns(true);
    try {
      const res = await api.get(`/admin/assignments/${hackathonId}`);
      setAssignedManagers(res.data.managers || []);
      setAssignedJudges(res.data.judges || []);

      const managersRes = await api.get('/admin/managers');
      setAllManagersList(managersRes.data.data || []);

      const usersRes = await api.get('/admin/users');
      setAllUsersList(usersRes.data.data || []);
    } catch (err) {
      showToast('error', 'Failed to fetch assignments');
    } finally {
      setLoadingAssigns(false);
    }
  };

  const openAssignModal = (h) => {
    setAssignHackathon(h);
    setAssignTab('manager');
    setSelectedManagerId('');
    setSelectedJudgeId('');
    setSpec('');
    setOrg('');
    setExp('2');
    setShowAssignModal(true);
    fetchAssignments(h.hackathon_id);
  };

  const handleManagerAssign = async (e) => {
    e.preventDefault();
    if (!selectedManagerId) return;
    setSavingAssign(true);
    try {
      await api.post('/admin/assignments/manager', {
        user_id: parseInt(selectedManagerId),
        hackathon_id: assignHackathon.hackathon_id
      });
      showToast('success', 'Manager assigned successfully');
      setSelectedManagerId('');
      fetchAssignments(assignHackathon.hackathon_id);
    } catch (err) {
      showToast('error', 'Failed to assign manager');
    } finally {
      setSavingAssign(false);
    }
  };

  const handleJudgeAssign = async (e) => {
    e.preventDefault();
    if (!selectedJudgeId) return;
    setSavingAssign(true);
    try {
      await api.post('/admin/assignments/judge', {
        user_id: parseInt(selectedJudgeId),
        hackathon_id: assignHackathon.hackathon_id,
        specialization: spec,
        organization: org,
        experience: parseInt(exp)
      });
      showToast('success', 'Judge assigned successfully');
      setSelectedJudgeId('');
      setSpec('');
      setOrg('');
      fetchAssignments(assignHackathon.hackathon_id);
    } catch (err) {
      showToast('error', 'Failed to assign judge');
    } finally {
      setSavingAssign(false);
    }
  };

  const handleRemoveManager = async (id) => {
    if (!window.confirm('Remove manager assignment?')) return;
    try {
      await api.delete(`/admin/assignments/manager/${id}`);
      showToast('success', 'Manager assignment removed');
      fetchAssignments(assignHackathon.hackathon_id);
    } catch (err) {
      showToast('error', 'Failed to remove assignment');
    }
  };

  const handleRemoveJudge = async (id) => {
    if (!window.confirm('Remove judge assignment?')) return;
    try {
      await api.delete(`/admin/assignments/judge/${id}`);
      showToast('success', 'Judge assignment removed');
      fetchAssignments(assignHackathon.hackathon_id);
    } catch (err) {
      showToast('error', 'Failed to remove assignment');
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
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Award size={24} className="text-accent" /> Hackathon Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">{filtered.length} hackathons</p>
            </div>
            <button onClick={openCreate} id="create-hackathon"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-white text-sm font-bold transition shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Plus size={16} /> New Hackathon
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="search-hackathons" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hackathons..." className="w-full glass-input pl-9 pr-4 py-2.5 rounded-xl text-sm" />
            </div>
            <div className="flex gap-2">
              {['All', 'Draft', 'Published', 'Completed', 'Archived'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition ${statusFilter === s ? 'bg-accent text-white' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse space-y-3">
                  <div className="h-5 bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Award size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hackathons found</p>
              <button onClick={openCreate} className="mt-4 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold">
                Create First Hackathon
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filtered.map((h) => (
                  <motion.div
                    key={h.hackathon_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-panel rounded-2xl p-6 space-y-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{h.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{h.description}</p>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[h.status] || 'bg-slate-700 text-slate-400'}`}>
                        {h.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div><span className="text-slate-600">Start:</span> {new Date(h.start_date).toLocaleDateString()}</div>
                      <div><span className="text-slate-600">End:</span> {new Date(h.end_date).toLocaleDateString()}</div>
                      <div><span className="text-slate-600">Deadline:</span> {new Date(h.registration_deadline).toLocaleDateString()}</div>
                      <div><span className="text-slate-600">Location:</span> {h.location}</div>
                      <div><span className="text-slate-600">Max Team:</span> {h.max_team_size}</div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                      <button onClick={() => openEdit(h)} id={`edit-hackathon-${h.hackathon_id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 text-xs hover:bg-slate-700 transition">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => openAssignModal(h)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-xs hover:bg-accent/30 transition">
                        <UserCheck size={12} /> Assignments
                      </button>
                      {h.status !== 'Published' && (
                        <button onClick={() => quickStatusChange(h, 'Published')} id={`publish-hackathon-${h.hackathon_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs hover:bg-green-500/20 transition">
                          <Globe size={12} /> Publish
                        </button>
                      )}
                      {h.status === 'Published' && (
                        <button onClick={() => quickStatusChange(h, 'Archived')} id={`archive-hackathon-${h.hackathon_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs hover:bg-orange-500/20 transition">
                          <Archive size={12} /> Archive
                        </button>
                      )}
                      <button onClick={() => deleteHackathon(h.hackathon_id)} id={`delete-hackathon-${h.hackathon_id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-left"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">{editTarget ? 'Edit Hackathon' : 'Create New Hackathon'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="Hackathon 2025" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm resize-none" placeholder="Describe this hackathon..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Start Date *</label>
                    <input name="start_date" type="date" value={form.start_date} onChange={handleChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">End Date *</label>
                    <input name="end_date" type="date" value={form.end_date} onChange={handleChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Reg. Deadline *</label>
                    <input name="registration_deadline" type="date" value={form.registration_deadline} onChange={handleChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Max Team Size</label>
                    <input name="max_team_size" type="number" min={1} max={15} value={form.max_team_size} onChange={handleChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Location *</label>
                  <input name="location" value={form.location} onChange={handleChange}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="e.g. Online, Campus Center" required />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.25)] flex items-center justify-center">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : editTarget ? 'Save Changes' : 'Create Hackathon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignments Modal */}
      <AnimatePresence>
        {showAssignModal && assignHackathon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowAssignModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-8 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto text-left relative border border-slate-700/50"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowAssignModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>

              <div className="space-y-1 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-accent" />
                  <span>Manage Hackathon Assignments</span>
                </h2>
                <p className="text-xs text-slate-400">Event: {assignHackathon.title}</p>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-800/40 p-1 rounded-xl border border-slate-700/50 text-xs w-fit mb-6">
                <button onClick={() => setAssignTab('manager')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${assignTab === 'manager' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
                  Managers ({assignedManagers.length})
                </button>
                <button onClick={() => setAssignTab('judge')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${assignTab === 'judge' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
                  Judges ({assignedJudges.length})
                </button>
              </div>

              {loadingAssigns ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-accent" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Assignment Form (Left Column) */}
                  <div className="md:col-span-1 space-y-4">
                    {assignTab === 'manager' ? (
                      <form onSubmit={handleManagerAssign} className="space-y-4 bg-slate-800/20 p-4 border border-slate-800 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Assign Manager</h4>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Select Manager Account</label>
                          <select value={selectedManagerId} onChange={(e) => setSelectedManagerId(e.target.value)}
                            className="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
                            <option value="">Choose Manager</option>
                            {allManagersList.map(m => (
                              <option key={m.user_id} value={m.user_id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                        <button type="submit" disabled={savingAssign}
                          className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                          {savingAssign ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleJudgeAssign} className="space-y-3 bg-slate-800/20 p-4 border border-slate-800 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Assign Judge</h4>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Select User Account</label>
                          <select value={selectedJudgeId} onChange={(e) => setSelectedJudgeId(e.target.value)}
                            className="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required>
                            <option value="">Choose User</option>
                            {allUsersList.map(u => (
                              <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Specialization</label>
                          <input type="text" value={spec} onChange={(e) => setSpec(e.target.value)}
                            className="w-full glass-input px-3.5 py-2 rounded-xl text-xs" placeholder="e.g. AI/ML" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Organization</label>
                          <input type="text" value={org} onChange={(e) => setOrg(e.target.value)}
                            className="w-full glass-input px-3.5 py-2 rounded-xl text-xs" placeholder="e.g. Microsoft" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Experience (Years)</label>
                          <input type="number" min="0" value={exp} onChange={(e) => setExp(e.target.value)}
                            className="w-full glass-input px-3.5 py-2 rounded-xl text-xs" required />
                        </div>
                        <button type="submit" disabled={savingAssign}
                          className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                          {savingAssign ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Assignments List (Right Column) */}
                  <div className="md:col-span-2 space-y-4 bg-slate-800/10 p-5 border border-slate-800 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Current Assignments</h4>
                    {assignTab === 'manager' ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {assignedManagers.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No managers assigned to this event.</p>
                        ) : (
                          assignedManagers.map(m => (
                            <div key={m.manager_id} className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-white">{m.name}</p>
                                <p className="text-[9px] text-slate-500">{m.email}</p>
                              </div>
                              <button onClick={() => handleRemoveManager(m.manager_id)} className="text-slate-500 hover:text-rose-500 transition">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {assignedJudges.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No judges assigned to this event.</p>
                        ) : (
                          assignedJudges.map(j => (
                            <div key={j.assignment_id} className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-white">{j.name}</p>
                                <p className="text-[9px] text-slate-500">{j.email} | {j.specialization}</p>
                              </div>
                              <button onClick={() => handleRemoveJudge(j.assignment_id)} className="text-slate-500 hover:text-rose-500 transition">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminHackathons;
