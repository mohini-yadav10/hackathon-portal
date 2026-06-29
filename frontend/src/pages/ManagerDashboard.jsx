import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth, api } from '../context/AuthContext';
import { Award, CheckSquare, Users, Star, Plus, ShieldCheck, Clock, X, Check, Loader2, UserCheck, Trash2, Eye, Globe, FileText, Play, Mail, Phone, BookOpen, Calendar, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocation } from 'react-router-dom';

const ManagerDashboard = () => {
  const auth = useAuth();
  const loggedInUser = auth?.user;
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'judges'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname.includes('/manager/judges')) {
      setActiveTab('judges');
    } else {
      setActiveTab('approvals');
    }
  }, [location.pathname]);

  // Approvals state
  const [registrations, setRegistrations] = useState([]);
  const [approvingId, setApprovingId] = useState(null);

  // Hackathons Managed state
  const [managedEvents, setManagedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Judges assignment state
  const [judges, setJudges] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [assignedJudges, setAssignedJudges] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [organization, setOrganization] = useState('');
  const [experience, setExperience] = useState('2');
  const [assigningJudge, setAssigningJudge] = useState(false);
  const [loadingJudges, setLoadingJudges] = useState(false);

  // Detail Modal State
  const [selectedReg, setSelectedReg] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch registrations managed by this manager (using optimized query)
      const regRes = await api.get('/registrations');
      setRegistrations(regRes.data.data || []);

      // 2. Fetch hackathons
      const hackathonsRes = await api.get('/hackathons');
      setManagedEvents(hackathonsRes.data.data || []);
      if (hackathonsRes.data.data.length > 0) {
        setSelectedEventId(hackathonsRes.data.data[0].hackathon_id);
      }

      // 3. Fetch users who can be made judges
      const usersRes = await api.get('/admin/users');
      setAllUsers(usersRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchEventJudges = async (hackathonId) => {
    if (!hackathonId) return;
    setLoadingJudges(true);
    try {
      const res = await api.get(`/admin/assignments/${hackathonId}`);
      setAssignedJudges(res.data.judges || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJudges(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'judges' && selectedEventId) {
      fetchEventJudges(selectedEventId);
    }
  }, [activeTab, selectedEventId]);

  const handleUpdateStatus = async (regId, status) => {
    if (window.confirm(`Are you sure you want to change registration status to ${status}?`)) {
      setApprovingId(regId);
      try {
        await api.put(`/registrations/${regId}/status`, { status });
        alert(`Registration ${status.toLowerCase()} successfully!`);
        fetchManagerData();
        if (selectedReg && selectedReg.registration_id === regId) {
          setSelectedReg(prev => ({ ...prev, registration_status: status }));
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status');
      } finally {
        setApprovingId(null);
      }
    }
  };

  const handleAssignJudgeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedEventId || !selectedTeamId) {
      return alert('Please select a Judge user, Hackathon event, and Target Team.');
    }

    setAssigningJudge(true);
    try {
      await api.post('/admin/assignments/judge', {
        user_id: parseInt(selectedUserId),
        hackathon_id: parseInt(selectedEventId),
        team_id: parseInt(selectedTeamId),
        specialization: specialization.trim(),
        organization: organization.trim(),
        experience: parseInt(experience)
      });
      alert('Judge assigned successfully!');
      setSelectedUserId('');
      setSelectedTeamId('');
      setSpecialization('');
      setOrganization('');
      fetchEventJudges(selectedEventId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign judge');
    } finally {
      setAssigningJudge(false);
    }
  };

  const handleRemoveJudge = async (assignmentId) => {
    if (window.confirm('Remove this judge from the team assignment?')) {
      try {
        await api.delete(`/admin/assignments/judge/${assignmentId}`);
        alert('Judge assignment removed.');
        fetchEventJudges(selectedEventId);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove judge');
      }
    }
  };

  const openDetails = (reg) => {
    setSelectedReg(reg);
    setShowDetailModal(true);
  };

  const pendingCount = registrations.filter(r => r.registration_status === 'Pending').length;

  // Filter registrations for the selected hackathon in judges tab
  const activeHackathonTeams = registrations.filter(r => r.hackathon_id === parseInt(selectedEventId));

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Manager Control Center" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left border-b border-slate-800/60 pb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                <ShieldCheck size={26} className="text-accent text-glow" />
                <span>Manager Control Center</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Welcome back, {loggedInUser?.name}. Manage your assigned events here.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/50 text-xs">
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'approvals' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrations ({pendingCount} pending)
              </button>
              <button
                onClick={() => setActiveTab('judges')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'judges' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Assign Judges
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-800/40 rounded-3xl" />
                ))}
              </div>
              <div className="h-96 bg-slate-800/40 rounded-3xl animate-pulse" />
            </div>
          ) : (
            <>
              {activeTab === 'approvals' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center gap-4 text-left">
                      <div className="text-accent bg-accent/10 border border-accent/25 rounded-2xl p-3.5">
                        <Award size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{managedEvents.length}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Managed Events</p>
                      </div>
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center gap-4 text-left">
                      <div className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-3.5">
                        <Clock size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{pendingCount}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pending Approvals</p>
                      </div>
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center gap-4 text-left">
                      <div className="text-green-400 bg-green-500/10 border border-green-500/25 rounded-2xl p-3.5">
                        <Users size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{registrations.length}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Teams</p>
                      </div>
                    </div>
                  </div>

                  {/* Registrations List */}
                  <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden text-left">
                    <div className="p-6 border-b border-slate-800">
                      <h3 className="text-base font-bold text-white">Hackathon Team Registrations</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <th className="p-5">Team Info</th>
                            <th className="p-5">Event</th>
                            <th className="p-5">Team Size</th>
                            <th className="p-5">Leader</th>
                            <th className="p-5">Project Domain / Title</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-sm">
                          {registrations.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-10 text-center text-slate-500">
                                No registrations found for your managed events.
                              </td>
                            </tr>
                          ) : (
                            registrations.map((reg) => (
                              <tr key={reg.registration_id} className="hover:bg-slate-800/10 transition duration-150">
                                <td className="p-5 font-bold text-white">
                                  <span>{reg.team_name}</span>
                                </td>
                                <td className="p-5 text-slate-300">{reg.hackathon_title}</td>
                                <td className="p-5 text-slate-400">{reg.team_size} members</td>
                                <td className="p-5">
                                  <div>
                                    <p className="text-slate-300 font-medium">{reg.leader_name}</p>
                                    <p className="text-[10px] text-slate-500">{reg.leader_email}</p>
                                  </div>
                                </td>
                                <td className="p-5 text-slate-300 font-medium">
                                  {reg.project_title || 'N/A'}
                                </td>
                                <td className="p-5">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    reg.registration_status === 'Approved' ? 'bg-green-500/10 text-green-400' :
                                    reg.registration_status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                                    'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    <span>{reg.registration_status || 'Pending'}</span>
                                  </span>
                                </td>
                                <td className="p-5 text-right">
                                  <div className="flex gap-2 justify-end items-center">
                                    <button
                                      onClick={() => openDetails(reg)}
                                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/50 transition"
                                      title="View Complete Team Details"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    {reg.registration_status === 'Pending' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateStatus(reg.registration_id, 'Approved')}
                                          disabled={approvingId === reg.registration_id}
                                          className="p-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-xl border border-green-500/20 transition disabled:opacity-50"
                                          title="Approve"
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateStatus(reg.registration_id, 'Rejected')}
                                          disabled={approvingId === reg.registration_id}
                                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition disabled:opacity-50"
                                          title="Reject"
                                        >
                                          <X size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'judges' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-fade-in">
                  
                  {/* Select Event & Assign Judge Form */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Event & Team Selector */}
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
                      <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2">1. Selection</h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Select Hackathon</label>
                          <select
                            value={selectedEventId}
                            onChange={(e) => {
                              setSelectedEventId(e.target.value);
                              setSelectedTeamId('');
                            }}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                          >
                            <option value="" disabled className="bg-slate-900 text-white">Choose Event</option>
                            {managedEvents.map(h => (
                              <option key={h.hackathon_id} value={h.hackathon_id} className="bg-slate-900 text-white">{h.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Select Team</label>
                          <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                            required
                          >
                            <option value="" className="bg-slate-900 text-white">Choose Target Team</option>
                            {activeHackathonTeams.map(t => (
                              <option key={t.team_id} value={t.team_id} className="bg-slate-900 text-white">{t.team_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Form */}
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
                      <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-1.5">
                        <UserCheck size={16} className="text-accent" />
                        <span>Assign Judge User</span>
                      </h4>

                      <form onSubmit={handleAssignJudgeSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Select User Account</label>
                          <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                            required
                          >
                            <option value="" className="bg-slate-900 text-white">Select User</option>
                            {allUsers.map(u => (
                              <option key={u.user_id} value={u.user_id} className="bg-slate-900 text-white">{u.name} ({u.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Specialization</label>
                          <input
                            type="text"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                            placeholder="e.g. AI/ML, Blockchain"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Organization</label>
                          <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                            placeholder="e.g. Google, Stanford University"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Years of Experience</label>
                          <input
                            type="number"
                            min="0"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={assigningJudge}
                          className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-1.5"
                        >
                          {assigningJudge ? <Loader2 className="animate-spin" size={12} /> : (
                            <>
                              <Plus size={12} />
                              <span>Assign Judge</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Assigned Judges List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6">
                      <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <Star size={16} className="text-amber-400" />
                        <span>Active Judges Assigned to Teams</span>
                      </h3>

                      {loadingJudges ? (
                        <div className="py-12 flex items-center justify-center">
                          <Loader2 className="animate-spin text-accent" size={24} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {assignedJudges.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center col-span-full">No judges assigned to teams in this event yet.</p>
                          ) : (
                            assignedJudges.map(j => (
                              <div key={j.assignment_id} className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="bg-accent/10 border border-accent/15 text-accent text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                    Team: {j.team_name}
                                  </span>
                                  <h5 className="font-bold text-white text-xs mt-1">{j.name}</h5>
                                  <p className="text-[10px] text-slate-400">{j.email}</p>
                                  <span className="inline-block bg-slate-700/50 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium mt-1">
                                    {j.specialization}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveJudge(j.assignment_id)}
                                  className="text-slate-500 hover:text-rose-500 transition p-1 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg"
                                  title="Remove assignment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Team Full Details Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative text-left my-8"
            >
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1 bg-slate-800/60 rounded-lg border border-slate-700/50"
              >
                <X size={18} />
              </button>

              {/* Title & Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-2xl">{selectedReg.team_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Hackathon: {selectedReg.hackathon_title} | Submitted Date: {new Date(selectedReg.registration_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    selectedReg.registration_status === 'Approved' ? 'bg-green-500/15 text-green-400' :
                    selectedReg.registration_status === 'Rejected' ? 'bg-red-500/15 text-red-400' :
                    'bg-amber-500/15 text-amber-400'
                  }`}>
                    {selectedReg.registration_status || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Teammates & Leader details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Leader details */}
                  <div className="bg-slate-800/30 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest border-b border-slate-800/50 pb-1.5">Team Leader</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Full Name</span>
                        <span className="font-bold text-white text-sm">{selectedReg.leader_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Email Address</span>
                        <span className="font-semibold text-slate-200">{selectedReg.leader_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Teammates List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Teammates Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(Array.isArray(selectedReg.members) ? selectedReg.members : JSON.parse(selectedReg.members || '[]')).map((m, idx) => (
                        <div key={idx} className="p-4 bg-slate-800/40 border border-slate-800/80 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-white text-sm">{m.name}</span>
                            <span className="bg-slate-700/50 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase text-slate-300">{m.role}</span>
                          </div>
                          <p className="text-slate-400">{m.email}</p>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/40 text-[10px] text-slate-300">
                            <div>
                              <span className="text-slate-500 block">College ID</span>
                              <span className="font-semibold">{m.enrollment_number}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Branch & Year</span>
                              <span className="font-semibold">{m.branch} (Yr {m.year})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <Phone size={10} />
                            <span>{m.phone_number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Project Submissions & Links */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Project Info card */}
                  <div className="bg-slate-800/30 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/50 pb-1.5">Project Details</h4>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Project Title</span>
                      <p className="text-sm font-extrabold text-white">{selectedReg.project_title || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Domain / Desc</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-4">{selectedReg.project_desc || 'No description provided'}</p>
                    </div>

                    <div className="space-y-1 text-xs border-t border-slate-800/60 pt-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Uploaded Assets</span>
                      <div className="space-y-2">
                        {selectedReg.github_repo ? (
                          <a href={selectedReg.github_repo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-accent font-semibold transition">
                            <Globe size={13} />
                            <span>GitHub Repository</span>
                          </a>
                        ) : <span className="text-slate-500 block">No GitHub repository link</span>}

                        {selectedReg.ppt_link ? (
                          <a href={selectedReg.ppt_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-accent font-semibold transition">
                            <FileText size={13} />
                            <span>Project Presentation (PPT)</span>
                          </a>
                        ) : <span className="text-slate-500 block">No PPT presentation link</span>}

                        {selectedReg.video_link ? (
                          <a href={selectedReg.video_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-accent font-semibold transition">
                            <Play size={13} />
                            <span>Demo Video</span>
                          </a>
                        ) : <span className="text-slate-500 block">No video presentation link</span>}
                      </div>
                    </div>
                  </div>

                  {/* Quick Decision controls */}
                  {selectedReg.registration_status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(selectedReg.registration_id, 'Approved')}
                        disabled={approvingId === selectedReg.registration_id}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Approve Team</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedReg.registration_id, 'Rejected')}
                        disabled={approvingId === selectedReg.registration_id}
                        className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <X size={14} />
                        <span>Reject Team</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ManagerDashboard;
