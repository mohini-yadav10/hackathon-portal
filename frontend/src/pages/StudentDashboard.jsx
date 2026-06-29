import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { Megaphone, Users, Award, Mail, Calendar, ArrowRight, Compass, Bookmark, Star, AlertCircle, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [bookmarkedHackathons, setBookmarkedHackathons] = useState([]);
  const [upcomingHackathons, setUpcomingHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [annRes, teamRes, inviteRes, bookRes, activeRes] = await Promise.all([
        api.get('/admin/announcements'),
        api.get('/teams/my-teams'),
        api.get('/invitations/pending'),
        api.get('/hackathons/bookmarks/list'),
        api.get('/hackathons/active')
      ]);

      setAnnouncements(annRes.data.data.slice(0, 5)); // show latest 5
      setMyTeams(teamRes.data.data);
      setPendingInvites(inviteRes.data.data);
      setBookmarkedHackathons(bookRes.data.data);
      setUpcomingHackathons(activeRes.data.data.slice(0, 4)); // show top 4 active
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptInvite = async (id) => {
    if (window.confirm('Are you sure you want to accept this invitation and join the team?')) {
      try {
        await api.put(`/invitations/${id}/accept`);
        showToast('success', 'Successfully joined the team!');
        fetchData();
      } catch (err) {
        showToast('error', err.response?.data?.message || 'Failed to accept invitation');
      }
    }
  };

  const handleRejectInvite = async (id) => {
    if (window.confirm('Are you sure you want to decline this invitation?')) {
      try {
        await api.put(`/invitations/${id}/reject`);
        showToast('success', 'Invitation declined');
        fetchData();
      } catch (err) {
        showToast('error', 'Failed to decline invitation');
      }
    }
  };

  const handleToggleBookmark = async (hackathonId, title) => {
    try {
      const res = await api.post(`/hackathons/${hackathonId}/bookmark`);
      const isBookmarked = res.data.bookmarked;
      showToast('success', isBookmarked ? `Bookmarked "${title}"` : `Removed bookmark for "${title}"`);
      // Update local state without full reload
      const [bookRes, activeRes] = await Promise.all([
        api.get('/hackathons/bookmarks/list'),
        api.get('/hackathons/active')
      ]);
      setBookmarkedHackathons(bookRes.data.data);
      setUpcomingHackathons(activeRes.data.data.slice(0, 4));
    } catch (err) {
      showToast('error', 'Failed to update bookmark');
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Student Dashboard" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
          </AnimatePresence>

          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                Welcome back, {user?.name}! <Sparkles className="text-accent animate-pulse" size={24} />
              </h2>
              <p className="text-slate-400 text-sm mt-1">Manage registrations, collaborate with teams, and discover events.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/hackathons"
                className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
              >
                <Compass size={18} />
                <span>Explore Hackathons</span>
              </Link>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-800/40 rounded-3xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                <div className="lg:col-span-2 h-96 bg-slate-800/40 rounded-3xl" />
                <div className="h-96 bg-slate-800/40 rounded-3xl" />
              </div>
            </div>
          ) : (
            <>
              {/* StatCards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="My Active Teams"
                  value={myTeams.length}
                  icon={Users}
                  description="Teams you are currently in"
                  color="blue"
                />
                <StatCard
                  title="Pending Invitations"
                  value={pendingInvites.length}
                  icon={Mail}
                  description="Invitations waiting for you"
                  color="amber"
                />
                <StatCard
                  title="Bookmarked"
                  value={bookmarkedHackathons.length}
                  icon={Bookmark}
                  description="Saved hackathons"
                  color="rose"
                />
                <StatCard
                  title="Announcements"
                  value={announcements.length}
                  icon={Megaphone}
                  description="Latest portal updates"
                  color="purple"
                />
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Columns - Teams & Invitations & Bookmarks */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* My Teams Panel */}
                  <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users size={20} className="text-accent" />
                      <span>My Teams & Registrations</span>
                    </h3>
                    <div className="space-y-4">
                      {myTeams.length === 0 ? (
                        <div className="text-center py-10 bg-slate-800/20 border border-dashed border-slate-800 rounded-2xl">
                          <p className="text-sm text-slate-400">You are not in any teams yet.</p>
                          <Link to="/hackathons" className="text-xs text-accent hover:underline mt-2 inline-block">
                            Browse hackathons to create or join a team
                          </Link>
                        </div>
                      ) : (
                        myTeams.map((t) => (
                          <div
                            key={t.team_id}
                            className="bg-slate-800/40 border border-slate-800 hover:border-slate-700/60 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-200"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <h4 className="font-bold text-white text-base">{t.team_name}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.registration_status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                                  t.registration_status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                                  t.registration_status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {t.registration_status ? `Reg: ${t.registration_status}` : 'Not Registered'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-semibold">{t.hackathon_title}</p>
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                                <span>Leader: {t.leader_name}</span>
                                <span>•</span>
                                <span>Size: {t.team_size}/{t.max_team_size}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.team_status === 'Open' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {t.team_status}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <Link
                                to={`/my-team?id=${t.team_id}`}
                                className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                              >
                                <span>Manage Team</span>
                                <ArrowRight size={14} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Invitations Panel */}
                  <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Mail size={20} className="text-amber-500" />
                      <span>Pending Team Invitations ({pendingInvites.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {pendingInvites.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-6">No pending invitations</p>
                      ) : (
                        pendingInvites.map((inv) => (
                          <div
                            key={inv.invitation_id}
                            className="bg-slate-800/30 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          >
                            <div>
                              <h4 className="font-bold text-white text-sm">
                                Invite to join <span className="text-accent">"{inv.team_name}"</span>
                              </h4>
                              <p className="text-xs text-slate-400 mt-1">Hackathon: {inv.hackathon_title}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                                <span>Sender: {inv.sender_name} ({inv.sender_email})</span>
                                <span>•</span>
                                <span>Team Size: {inv.team_size}/{inv.max_team_size}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                onClick={() => handleAcceptInvite(inv.invitation_id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectInvite(inv.invitation_id)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs transition"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bookmarked Hackathons */}
                  <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Bookmark size={20} className="text-rose-500" />
                      <span>Bookmarked Hackathons ({bookmarkedHackathons.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {bookmarkedHackathons.length === 0 ? (
                        <p className="col-span-2 text-center text-xs text-slate-500 py-6">No bookmarked hackathons</p>
                      ) : (
                        bookmarkedHackathons.map((h) => (
                          <div
                            key={h.hackathon_id}
                            className="bg-slate-800/30 border border-slate-800/80 p-4 rounded-2xl relative flex flex-col justify-between hover:border-rose-500/40 transition duration-200"
                          >
                            <button
                              onClick={() => handleToggleBookmark(h.hackathon_id, h.title)}
                              className="absolute top-4 right-4 text-rose-500 hover:scale-110 transition"
                            >
                              <Bookmark size={18} fill="currentColor" />
                            </button>
                            <div>
                              <h4 className="font-bold text-white text-sm pr-6 leading-tight">{h.title}</h4>
                              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                                <Calendar size={12} />
                                Starts: {new Date(h.start_date).toLocaleDateString()}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Location: {h.location}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                                Max Team: {h.max_team_size}
                              </span>
                              <Link
                                to={`/hackathons`}
                                className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                              >
                                View <ExternalLink size={10} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column - Announcements & Active Hackathons */}
                <div className="space-y-8">

                  {/* Active Hackathons */}
                  <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award size={20} className="text-emerald-500" />
                      <span>Active Hackathons</span>
                    </h3>
                    <div className="space-y-4">
                      {upcomingHackathons.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-6">No active hackathons at this moment.</p>
                      ) : (
                        upcomingHackathons.map((h) => {
                          const isBookmarked = bookmarkedHackathons.some((b) => b.hackathon_id === h.hackathon_id);
                          return (
                            <div
                              key={h.hackathon_id}
                              className="bg-slate-800/20 border border-slate-800/80 p-4 rounded-2xl flex items-start justify-between gap-3 hover:border-slate-700/60 transition"
                            >
                              <div className="space-y-1 min-w-0">
                                <h4 className="font-bold text-sm text-slate-200 truncate">{h.title}</h4>
                                <p className="text-[10px] text-slate-400">Deadline: {new Date(h.registration_deadline).toLocaleDateString()}</p>
                                <p className="text-[10px] text-slate-500 truncate">{h.location}</p>
                              </div>
                              <button
                                onClick={() => handleToggleBookmark(h.hackathon_id, h.title)}
                                className="text-slate-500 hover:text-rose-500 transition-colors flex-shrink-0"
                              >
                                <Bookmark size={16} fill={isBookmarked ? '#f43f5e' : 'none'} className={isBookmarked ? 'text-rose-500' : ''} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Announcements */}
                  <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Megaphone size={20} className="text-purple-500" />
                      <span>Announcements</span>
                    </h3>
                    <div className="space-y-4">
                      {announcements.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-10">No announcements published yet.</p>
                      ) : (
                        announcements.map((ann) => (
                          <div
                            key={ann.announcement_id}
                            className="bg-slate-800/20 border border-slate-800/80 p-4.5 rounded-2xl space-y-2 text-left"
                          >
                            <h4 className="font-bold text-sm text-slate-200">{ann.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{ann.description}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                              <span>By: {ann.author_name || 'Admin'}</span>
                              <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(ann.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
