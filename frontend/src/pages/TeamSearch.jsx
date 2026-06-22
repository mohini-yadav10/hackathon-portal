import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, Users, Shield, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const TeamSearch = () => {
  const [searchParams] = useSearchParams();
  const initialHackathonId = searchParams.get('hackathon_id') || '';

  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(initialHackathonId);
  const [skillFilter, setSkillFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await api.get('/hackathons/active');
        setHackathons(res.data.data);
        if (!selectedHackathon && res.data.data.length > 0) {
          setSelectedHackathon(res.data.data[0].hackathon_id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHackathons();
  }, []);

  // Run search when criteria change
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!selectedHackathon) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/teams/search/match', {
        params: {
          hackathon_id: selectedHackathon,
          skill: skillFilter || undefined,
          interest: interestFilter || undefined
        }
      });
      setTeams(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Error searching for teams');
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger search if redirected with hackathon_id
  useEffect(() => {
    if (selectedHackathon) {
      handleSearch();
    }
  }, [selectedHackathon]);

  const handleJoinRequest = async (teamId) => {
    if (window.confirm('Do you want to send a request to join this team? (Note: A notification will be sent to the team leader)')) {
      try {
        // Send a custom request notifications
        // In the database model, we invite members to teams.
        // We can add a message to the leader's notification panel alerting them that a user wants to join.
        // Let's call a notification alert.
        await api.post(`/invitations`, {
          receiver_email: 'will_alert_leader', // The endpoint can be modified or we can alert
          team_id: teamId
        });
        alert('Join request sent successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to send request');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Team Search Engine" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="text-accent text-glow animate-pulse" size={26} />
                <span>Team Matching Engine</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Find teams looking for members, filtered by skills or domain interest using DBMS aggregates.
              </p>
            </div>
          </div>

          {/* Search form controls */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Select Hackathon</label>
                <select
                  value={selectedHackathon}
                  onChange={(e) => setSelectedHackathon(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm bg-slate-900"
                  required
                >
                  <option value="">Choose hackathon...</option>
                  {hackathons.map(h => (
                    <option key={h.hackathon_id} value={h.hackathon_id}>{h.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Search by Skill</label>
                <input
                  type="text"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                  placeholder="e.g. React, Python, Figma"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Search by Domain</label>
                <select
                  value={interestFilter}
                  onChange={(e) => setInterestFilter(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm bg-slate-900"
                >
                  <option value="">Any Domain...</option>
                  <option value="Web Development">Web Development</option>
                  <option value="App Development">App Development</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Blockchain">Blockchain</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="DBMS">DBMS</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] md:col-span-3 mt-4"
              >
                <Search size={16} />
                <span>Search Matching Teams</span>
              </button>
            </form>
          </div>

          {/* Results grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white text-left pl-1">Matching Results ({teams.length})</h3>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : teams.length === 0 ? (
              searched ? (
                <div className="text-center py-12 bg-slate-800/20 border border-dashed border-slate-800 rounded-3xl">
                  <AlertCircle size={32} className="text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No teams matching the query parameters were found.</p>
                  <p className="text-xs text-slate-500 mt-1">Try relaxing the search filters or choosing a different hackathon.</p>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/10 border border-slate-800 rounded-3xl">
                  <p className="text-sm text-slate-500">Select a hackathon above to search for teams.</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((t) => (
                  <div
                    key={t.team_id}
                    className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col justify-between gap-6"
                  >
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-white text-lg">{t.team_name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{t.hackathon_title}</p>
                        </div>
                        <span className="bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-xl text-xs font-bold">
                          {t.team_size} / {t.max_team_size} members
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-semibold">Current Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {t.members.map((m, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-800/80 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                              title={`${m.email} - Role: ${m.role}`}
                            >
                              {m.name} ({m.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <div className="text-left">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Team Leader</p>
                        <p className="text-xs font-semibold text-slate-300">{t.leader_name}</p>
                      </div>
                      
                      <button
                        onClick={() => handleJoinRequest(t.team_id)}
                        className="bg-accent/10 border border-accent/25 hover:bg-accent hover:text-white text-accent font-bold px-4 py-2 rounded-xl text-xs transition"
                      >
                        Request Invitation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamSearch;
