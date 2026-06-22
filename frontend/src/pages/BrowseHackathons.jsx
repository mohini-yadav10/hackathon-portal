import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Trophy, Calendar, MapPin, Users, Plus, Search, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BrowseHackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [teamName, setTeamName] = useState('');
  const navigate = useNavigate();

  const fetchHackathons = async () => {
    try {
      const res = await api.get('/hackathons');
      setHackathons(res.data.data);
    } catch (err) {
      console.error('Error fetching hackathons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !selectedHackathon) return;

    try {
      const res = await api.post('/teams', {
        hackathon_id: selectedHackathon.hackathon_id,
        team_name: teamName.trim()
      });
      alert('Team registered successfully!');
      setShowCreateModal(false);
      setTeamName('');
      // Navigate to My Team page with the new team ID
      navigate(`/my-team?id=${res.data.team_id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create team');
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Browse Hackathons" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white">Active Hackathons</h2>
            <p className="text-slate-400 text-sm mt-1">Explore current events, create your own team, or apply to join an existing group.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackathons.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center col-span-full">No active hackathons published yet.</p>
              ) : (
                hackathons.map((h) => {
                  const deadlinePassed = new Date() > new Date(h.registration_deadline);
                  return (
                    <div
                      key={h.hackathon_id}
                      className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col justify-between h-96 relative group overflow-hidden"
                    >
                      {/* Glow outline on card hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

                      <div className="space-y-4 relative">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-accent/10 text-accent rounded-2xl border border-accent/20">
                            <Trophy size={22} />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            h.status === 'Completed' ? 'bg-slate-700/50 text-slate-400' :
                            deadlinePassed ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                          }`}>
                            {h.status === 'Completed' ? 'Completed' : deadlinePassed ? 'Deadline Passed' : 'Active'}
                          </span>
                        </div>

                        <div className="space-y-2 text-left">
                          <h3 className="font-extrabold text-white text-lg leading-snug line-clamp-2">{h.title}</h3>
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{h.description}</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800/80 relative">
                        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-500" />
                            <span>{new Date(h.start_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-500" />
                            <span className="truncate">{h.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-slate-500" />
                            <span>Max Size: {h.max_team_size} members</span>
                          </div>
                        </div>

                        {/* CTAs */}
                        {h.status === 'Completed' ? (
                          <div className="text-center text-xs text-slate-500 py-1 bg-slate-800/30 rounded-xl">
                            Event has concluded
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedHackathon(h);
                                setShowCreateModal(true);
                              }}
                              disabled={deadlinePassed}
                              className="flex-1 bg-accent hover:bg-accent/80 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            >
                              <Plus size={14} />
                              <span>Create Team</span>
                            </button>

                            <Link
                              to={`/team-search?hackathon_id=${h.hackathon_id}`}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                            >
                              <Search size={14} />
                              <span>Find Teams</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Team Modal */}
      {showCreateModal && selectedHackathon && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 text-left">
              <h3 className="font-extrabold text-white text-lg">Create Team</h3>
              <p className="text-xs text-slate-400">For: {selectedHackathon.title}</p>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                  placeholder="e.g. Code Commanders"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  Confirm Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseHackathons;
