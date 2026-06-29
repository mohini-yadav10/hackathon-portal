import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Trophy, Calendar, MapPin, Users, Plus, Search, Bookmark, X, Star, Sparkles, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BrowseHackathons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Create Team Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [leaderDetails, setLeaderDetails] = useState({
    enrollment_number: '',
    phone_number: '',
    branch: '',
    year: 1,
    github_url: ''
  });
  const [members, setMembers] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Team Name, 2 = Leader details, 3 = Teammates registry

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hRes = await api.get('/hackathons');
        setHackathons(hRes.data.data);

        // Fetch user's bookmarks list
        const bRes = await api.get('/hackathons/bookmarks/list');
        setBookmarkedIds(bRes.data.data.map(b => b.hackathon_id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleBookmark = async (hackathonId) => {
    try {
      const res = await api.post(`/hackathons/${hackathonId}/bookmark`);
      if (res.data.bookmarked) {
        setBookmarkedIds(prev => [...prev, hackathonId]);
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== hackathonId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addMemberField = () => {
    if (1 + members.length >= selectedHackathon.max_team_size) {
      alert(`This hackathon only allows up to ${selectedHackathon.max_team_size} members per team.`);
      return;
    }
    setMembers(prev => [...prev, {
      name: '',
      email: '',
      enrollment_number: '',
      phone_number: '',
      branch: '',
      year: 1,
      github_url: ''
    }]);
  };

  const removeMemberField = (idx) => {
    setMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx, field, val) => {
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) return alert('Please enter a team name');
    if (!leaderDetails.enrollment_number.trim() || !leaderDetails.phone_number.trim() || !leaderDetails.branch.trim()) {
      return alert('Please fill all team leader details');
    }

    // Basic email validation for members
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.enrollment_number.trim() || !m.phone_number.trim() || !m.branch.trim()) {
        return alert(`Please fill all details for Member #${i + 1}`);
      }
    }

    try {
      const res = await api.post('/teams', {
        hackathon_id: selectedHackathon.hackathon_id,
        team_name: teamName.trim(),
        leader_details: leaderDetails,
        members
      });

      alert(res.data.message || 'Team registered successfully!');
      setShowCreateModal(false);
      setTeamName('');
      setMembers([]);
      setLeaderDetails({
        enrollment_number: '',
        phone_number: '',
        branch: '',
        year: 1,
        github_url: ''
      });
      navigate('/my-team');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create team');
    }
  };

  const filteredHackathons = hackathons.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'All' || 
                            (locationFilter === 'Online' && h.location.toLowerCase() === 'online') || 
                            (locationFilter === 'Physical' && h.location.toLowerCase() !== 'online');
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Browse Events" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                <Sparkles size={24} className="text-accent" />
                <span>Explore Hackathons</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Discover premium collegiate tech events, form local teams, and submit your entries.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs w-full md:w-64"
                />
              </div>

              <div className="flex bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/50 text-xs">
                {['All', 'Online', 'Physical'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLocationFilter(opt)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      locationFilter === opt ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-slate-800/40 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHackathons.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center col-span-full">No hackathons match your search parameters.</p>
              ) : (
                filteredHackathons.map((h) => {
                  const deadlinePassed = new Date() > new Date(h.registration_deadline);
                  const isBookmarked = bookmarkedIds.includes(h.hackathon_id);
                  return (
                    <div
                      key={h.hackathon_id}
                      className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col justify-between h-96 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

                      <div className="space-y-4 relative">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-accent/10 text-accent rounded-2xl border border-accent/20">
                            <Trophy size={22} />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBookmark(h.hackathon_id)}
                              className="text-slate-500 hover:text-rose-500 transition-colors p-2 rounded-xl bg-slate-800/40 hover:bg-slate-850"
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark hackathon'}
                            >
                              <Bookmark size={16} fill={isBookmarked ? '#f43f5e' : 'none'} className={isBookmarked ? 'text-rose-500' : ''} />
                            </button>

                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              h.status === 'Completed' ? 'bg-slate-700/50 text-slate-400' :
                              deadlinePassed ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                            }`}>
                              {h.status === 'Completed' ? 'Completed' : deadlinePassed ? 'Deadline Passed' : 'Active'}
                            </span>
                          </div>
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

                        {h.status === 'Completed' ? (
                          <div className="text-center text-xs text-slate-500 py-1 bg-slate-800/30 rounded-xl">
                            Event has concluded
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedHackathon(h);
                                setMembers([]);
                                setTeamName('');
                                setCurrentStep(1);
                                setShowCreateModal(true);
                              }}
                              disabled={deadlinePassed}
                              className="flex-grow bg-accent hover:bg-accent/80 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            >
                              <Plus size={14} />
                              <span>Create Team</span>
                            </button>
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
      <AnimatePresence>
        {showCreateModal && selectedHackathon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-950 border border-slate-900 p-8 rounded-3xl space-y-8 shadow-2xl relative my-8 text-left max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 text-slate-500 hover:text-white transition"
              >
                <X size={20} />
              </button>

              {/* Title Header */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-xl flex items-center gap-2">
                  <Sparkles size={20} className="text-accent animate-pulse" />
                  <span>Register Team & Members</span>
                </h3>
                <p className="text-xs text-slate-500">Event: {selectedHackathon.title} (Max Team Size: {selectedHackathon.max_team_size} members)</p>
              </div>

              {/* Progress Steps bar */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-5 pt-2">
                {[
                  { step: 1, label: 'Team Settings' },
                  { step: 2, label: 'Team Leader' },
                  { step: 3, label: 'Teammates' },
                ].map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        currentStep === s.step 
                          ? 'bg-accent text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                          : currentStep > s.step 
                          ? 'bg-green-500 text-white' 
                          : 'bg-slate-900 text-slate-500'
                      }`}>
                        {currentStep > s.step ? '✓' : s.step}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${
                        currentStep === s.step ? 'text-accent' : 'text-slate-500'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && <span className="flex-grow h-0.5 bg-slate-900 mx-4 max-w-[60px]" />}
                  </React.Fragment>
                ))}
              </div>

              <form onSubmit={handleCreateTeamSubmit} className="space-y-6">

                {/* STEP 1: Team Name Settings */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent pl-1">1. Team Settings</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Team Name</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full glass-input px-4 py-3 rounded-xl text-xs"
                        placeholder="e.g. Cyber Warriors"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Leader Details */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent pl-1">2. Your Details (Team Leader)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Enrollment Number</label>
                        <input
                          type="text"
                          value={leaderDetails.enrollment_number}
                          onChange={(e) => setLeaderDetails({ ...leaderDetails, enrollment_number: e.target.value })}
                          className="w-full glass-input px-4 py-3 rounded-xl text-xs"
                          placeholder="e.g. ENR123456"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={leaderDetails.phone_number}
                          onChange={(e) => setLeaderDetails({ ...leaderDetails, phone_number: e.target.value })}
                          className="w-full glass-input px-4 py-3 rounded-xl text-xs"
                          placeholder="e.g. 9876543210"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Branch</label>
                        <input
                          type="text"
                          value={leaderDetails.branch}
                          onChange={(e) => setLeaderDetails({ ...leaderDetails, branch: e.target.value })}
                          className="w-full glass-input px-4 py-3 rounded-xl text-xs"
                          placeholder="e.g. Computer Science"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
                        <select
                          value={leaderDetails.year}
                          onChange={(e) => setLeaderDetails({ ...leaderDetails, year: parseInt(e.target.value) })}
                          className="w-full glass-input px-3 py-3 rounded-xl text-xs font-semibold"
                          required
                        >
                          {[1, 2, 3, 4, 5].map(y => (
                            <option key={y} value={y} className="bg-slate-900 text-white">Year {y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">GitHub Profile URL (Optional)</label>
                        <input
                          type="url"
                          value={leaderDetails.github_url}
                          onChange={(e) => setLeaderDetails({ ...leaderDetails, github_url: e.target.value })}
                          className="w-full glass-input px-4 py-3 rounded-xl text-xs"
                          placeholder="https://github.com/username"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Teammates Registry */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center pl-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-accent">3. Team Members Details ({members.length} added)</h4>
                      {1 + members.length < selectedHackathon.max_team_size && (
                        <button
                          type="button"
                          onClick={addMemberField}
                          className="bg-accent/15 hover:bg-accent text-accent hover:text-white border border-accent/20 px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition flex items-center gap-1"
                        >
                          <Plus size={12} />
                          <span>Add Member</span>
                        </button>
                      )}
                    </div>

                    {members.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-900 rounded-2xl">
                        No teammates added yet. Click "Add Member" to fill in details.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {members.map((m, idx) => (
                          <div key={idx} className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-4 relative">
                            <button
                              type="button"
                              onClick={() => removeMemberField(idx)}
                              className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition"
                              title="Remove Member"
                            >
                              <Trash2 size={14} />
                            </button>

                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Member #{idx + 1}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                                  placeholder="Member name"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                                <input
                                  type="email"
                                  value={m.email}
                                  onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                                  placeholder="e.g. mate@gmail.com"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Enrollment Number</label>
                                <input
                                  type="text"
                                  value={m.enrollment_number}
                                  onChange={(e) => handleMemberChange(idx, 'enrollment_number', e.target.value)}
                                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                                  placeholder="College ID"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                                <input
                                  type="text"
                                  value={m.phone_number}
                                  onChange={(e) => handleMemberChange(idx, 'phone_number', e.target.value)}
                                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                                  placeholder="Mobile number"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Branch</label>
                                <input
                                  type="text"
                                  value={m.branch}
                                  onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                                  placeholder="CSE / IT / ECE"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                                <select
                                  value={m.year}
                                  onChange={(e) => handleMemberChange(idx, 'year', parseInt(e.target.value))}
                                  className="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-semibold"
                                  required
                                >
                                  {[1, 2, 3, 4, 5].map(y => (
                                    <option key={y} value={y} className="bg-slate-900 text-white">Year {y}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">GitHub Profile URL (Optional)</label>
                                <input
                                  type="url"
                                  value={m.github_url}
                                  onChange={(e) => handleMemberChange(idx, 'github_url', e.target.value)}
                                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                                  placeholder="https://github.com/username"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Actions Footer */}
                <div className="flex gap-3 pt-6 border-t border-slate-900">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold py-3 rounded-xl text-xs transition"
                    >
                      Back
                    </button>
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep === 1 && !teamName.trim()) {
                          return alert('Please enter a team name');
                        }
                        if (currentStep === 2 && (!leaderDetails.enrollment_number.trim() || !leaderDetails.phone_number.trim() || !leaderDetails.branch.trim())) {
                          return alert('Please fill all team leader details');
                        }
                        setCurrentStep(prev => prev + 1);
                      }}
                      className="flex-grow bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-grow bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl text-xs transition shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Register Team</span>
                    </button>
                  )}
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowseHackathons;
