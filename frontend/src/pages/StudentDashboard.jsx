import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { Megaphone, Users, Award, Mail, Calendar, ArrowRight, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Parallel fetches
      const [annRes, teamRes, inviteRes] = await Promise.all([
        api.get('/admin/announcements'),
        api.get('/teams/my-teams'),
        api.get('/invitations/pending')
      ]);

      setAnnouncements(annRes.data.data.slice(0, 5)); // show latest 5
      setMyTeams(teamRes.data.data);
      setPendingInvites(inviteRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptInvite = async (id) => {
    if (window.confirm('Are you sure you want to accept this invitation and join the team?')) {
      try {
        await api.put(`/invitations/${id}/accept`);
        alert('Successfully joined the team!');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to accept invitation');
      }
    }
  };

  const handleRejectInvite = async (id) => {
    if (window.confirm('Are you sure you want to decline this invitation?')) {
      try {
        await api.put(`/invitations/${id}/reject`);
        alert('Invitation declined');
        fetchData();
      } catch (err) {
        alert('Failed to decline invitation');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Student Dashboard" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Welcome back, {user?.name}!</h2>
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
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <>
              {/* StatCards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  title="Announcements"
                  value={announcements.length}
                  icon={Megaphone}
                  description="Latest portal announcements"
                  color="purple"
                />
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns - Teams & Invitations */}
                <div className="lg:col-span-2 space-y-8">
                  {/* My Teams Panel */}
                  <div className="glass-panel rounded-3xl p-6 border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users size={20} className="text-accent" />
                      <span>My Teams</span>
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
                              <h4 className="font-bold text-white text-base">{t.team_name}</h4>
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
                </div>

                {/* Right Column - Announcements */}
                <div className="space-y-8">
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
