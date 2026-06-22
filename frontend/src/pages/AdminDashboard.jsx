import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { Users, Award, FileText, CheckCircle, BarChart3, Megaphone, Send, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceDesc, setAnnounceDesc] = useState('');
  const [announceSuccess, setAnnounceSuccess] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleAnnounceSubmit = async (e) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceDesc.trim()) return;

    try {
      await api.post('/admin/announcements', {
        title: announceTitle.trim(),
        description: announceDesc.trim()
      });
      setAnnounceSuccess(true);
      setAnnounceTitle('');
      setAnnounceDesc('');
      fetchAnalytics(); // refresh if metrics count announcements
      setTimeout(() => setAnnounceSuccess(false), 5000);
    } catch (err) {
      alert('Failed to publish announcement');
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Admin Command Center" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-left">
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="text-accent text-glow" size={28} />
                <span>Admin Command Center</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Monitor registrations, user demographics, and dispatch global communications.</p>
            </div>
            <div>
              <Link
                to="/admin/approvals"
                className="bg-accent hover:bg-accent/80 text-white font-semibold px-5 py-3 rounded-xl text-xs transition shadow-[0_0_20px_rgba(59,130,246,0.25)] inline-block"
              >
                Review Pending Approvals
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : !analytics ? (
            <p className="text-slate-400 text-center py-12">Failed to load analytics data.</p>
          ) : (
            <>
              {/* StatCards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Students"
                  value={analytics.cards.totalStudents}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Total Teams"
                  value={analytics.cards.totalTeams}
                  icon={FileText}
                  color="purple"
                />
                <StatCard
                  title="Active Events"
                  value={analytics.cards.totalHackathons}
                  icon={Award}
                  color="green"
                />
                <StatCard
                  title="Pending Reviews"
                  value={analytics.cards.pendingRegistrations}
                  icon={CheckCircle}
                  color="amber"
                  description={`Approved: ${analytics.cards.approvedRegistrations}`}
                />
              </div>

              {/* Charts & Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visual Analytics Charts */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Hackathon Popularity Chart */}
                  <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6 text-left">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-accent" />
                      <span>Hackathon Popularity (Registrations Count)</span>
                    </h3>

                    <div className="space-y-4 pt-2">
                      {analytics.charts.hackathonPopularity.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No registration data available</p>
                      ) : (
                        analytics.charts.hackathonPopularity.map((item, idx) => {
                          const maxCount = Math.max(...analytics.charts.hackathonPopularity.map(i => i.registrations_count), 1);
                          const percentage = Math.round((item.registrations_count / maxCount) * 100);
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-300 truncate max-w-xs">{item.title}</span>
                                <span className="text-accent">{item.registrations_count} registrations</span>
                              </div>
                              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-accent to-blue-400 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Team Trends Chart */}
                  <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6 text-left">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-green-400" />
                      <span>Team Formation Trends (Total Teams Created)</span>
                    </h3>

                    <div className="space-y-4 pt-2">
                      {analytics.charts.teamTrends.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No team data available</p>
                      ) : (
                        analytics.charts.teamTrends.map((item, idx) => {
                          const maxCount = Math.max(...analytics.charts.teamTrends.map(i => i.teams_count), 1);
                          const percentage = Math.round((item.teams_count / maxCount) * 100);
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-300 truncate max-w-xs">{item.title}</span>
                                <span className="text-green-400">{item.teams_count} teams</span>
                              </div>
                              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Announcement Disptach Panel */}
                <div className="space-y-8">
                  <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 text-left">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Megaphone size={18} className="text-purple-500" />
                      <span>Send Announcements</span>
                    </h3>
                    
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Publish announcements system-wide. All active students will receive a dashboard notification.
                    </p>

                    {announceSuccess && (
                      <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-xs font-semibold">
                        Announcement sent to all users!
                      </div>
                    )}

                    <form onSubmit={handleAnnounceSubmit} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Annoucement Title</label>
                        <input
                          type="text"
                          value={announceTitle}
                          onChange={(e) => setAnnounceTitle(e.target.value)}
                          className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                          placeholder="e.g. Server Maintenance tonight"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <textarea
                          value={announceDesc}
                          onChange={(e) => setAnnounceDesc(e.target.value)}
                          rows={4}
                          className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs resize-none"
                          placeholder="Provide details here..."
                          required
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-1.5"
                      >
                        <Send size={12} />
                        <span>Publish Announcements</span>
                      </button>
                    </form>
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

export default AdminDashboard;
