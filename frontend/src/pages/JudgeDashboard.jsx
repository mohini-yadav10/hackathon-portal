import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth, api } from '../context/AuthContext';
import { Star, ClipboardList, Trophy, Clock, Play, Globe, FileText, CheckCircle2, X, ChevronRight, Sparkles, Loader2, Save, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocation } from 'react-router-dom';

const JudgeDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('evaluations'); // 'evaluations' | 'leaderboard'

  useEffect(() => {
    if (location.pathname.includes('/judge/leaderboard')) {
      setActiveTab('leaderboard');
    } else {
      setActiveTab('evaluations');
    }
  }, [location.pathname]);

  // Evaluation modal states
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  
  // 6 Criteria Score Inputs
  const [innovation, setInnovation] = useState('');
  const [techComplexity, setTechComplexity] = useState('');
  const [uiUx, setUiUx] = useState('');
  const [dbDesign, setDbDesign] = useState('');
  const [presentation, setPresentation] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [evalSaving, setEvalSaving] = useState(false);

  // Leaderboard states
  const [assignedHackathons, setAssignedHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchJudgeData = async () => {
    try {
      const subsRes = await api.get('/judge/submissions');
      setSubmissions(subsRes.data.data || []);

      const hackathonsRes = await api.get('/judge/hackathons');
      setAssignedHackathons(hackathonsRes.data.data || []);
      if (hackathonsRes.data.data.length > 0) {
        setSelectedHackathonId(hackathonsRes.data.data[0].hackathon_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeData();
  }, []);

  const fetchLeaderboard = async (hackathonId) => {
    if (!hackathonId) return;
    setLoadingLeaderboard(true);
    try {
      const res = await api.get(`/judge/leaderboard/${hackathonId}`);
      setLeaderboard(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard' && selectedHackathonId) {
      fetchLeaderboard(selectedHackathonId);
    }
  }, [activeTab, selectedHackathonId]);

  const openEvalModal = (sub) => {
    setSelectedSub(sub);
    setInnovation(sub.innovation !== null ? sub.innovation.toString() : '');
    setTechComplexity(sub.technical_complexity !== null ? sub.technical_complexity.toString() : '');
    setUiUx(sub.ui_ux !== null ? sub.ui_ux.toString() : '');
    setDbDesign(sub.database_design !== null ? sub.database_design.toString() : '');
    setPresentation(sub.presentation !== null ? sub.presentation.toString() : '');
    setDocumentation(sub.documentation !== null ? sub.documentation.toString() : '');
    setFeedback(sub.judge_feedback || '');
    setShowEvalModal(true);
  };

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub || innovation === '' || techComplexity === '' || uiUx === '' || dbDesign === '' || presentation === '' || documentation === '' || !feedback.trim()) {
      return alert('Please fill in all evaluation scores and feedback.');
    }

    setEvalSaving(true);
    try {
      await api.post('/judge/evaluations', {
        submission_id: selectedSub.submission_id,
        innovation: parseInt(innovation),
        technical_complexity: parseInt(techComplexity),
        ui_ux: parseInt(uiUx),
        database_design: parseInt(dbDesign),
        presentation: parseInt(presentation),
        documentation: parseInt(documentation),
        feedback: feedback.trim()
      });
      alert('Evaluation saved and submitted successfully!');
      setShowEvalModal(false);
      fetchJudgeData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setEvalSaving(false);
    }
  };

  // Real-time sum calculation
  const totalScoreCalculated = 
    (parseInt(innovation) || 0) + 
    (parseInt(techComplexity) || 0) + 
    (parseInt(uiUx) || 0) + 
    (parseInt(dbDesign) || 0) + 
    (parseInt(presentation) || 0) + 
    (parseInt(documentation) || 0);

  const evaluationsDone = submissions.filter(s => s.score_awarded !== null).length;
  const pendingReviews = submissions.length - evaluationsDone;

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Judge Evaluation Center" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left border-b border-slate-800/60 pb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                <Sparkles size={26} className="text-amber-400 text-glow" />
                <span>Judge Evaluation Center</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name}. Evaluate projects assigned to you.</p>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/50 text-xs">
              <button
                onClick={() => setActiveTab('evaluations')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'evaluations' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Evaluations
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'leaderboard' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Leaderboard
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
              {activeTab === 'evaluations' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center gap-4 text-left">
                      <div className="text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded-2xl p-3.5">
                        <ClipboardList size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{submissions.length}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Assigned Projects</p>
                      </div>
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center gap-4 text-left">
                      <div className="text-green-400 bg-green-500/10 border border-green-500/25 rounded-2xl p-3.5">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{evaluationsDone}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Evaluations Done</p>
                      </div>
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center gap-4 text-left">
                      <div className="text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5">
                        <Clock size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{pendingReviews}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pending Reviews</p>
                      </div>
                    </div>
                  </div>

                  {/* Submissions List */}
                  <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800 text-left">
                      <h3 className="text-base font-bold text-white">Assigned Submissions</h3>
                    </div>
                    
                    <div className="divide-y divide-slate-800/80">
                      {submissions.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                          No projects have been assigned to you for evaluation yet.
                        </div>
                      ) : (
                        submissions.map((sub) => (
                          <div key={sub.submission_id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-slate-800/10 transition duration-150 text-left">
                            <div className="space-y-3 max-w-3xl">
                              <div>
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                                  {sub.hackathon_title}
                                </span>
                                <h4 className="text-lg font-extrabold text-white mt-1">{sub.project_title}</h4>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Team: {sub.team_name} | Leader: {sub.leader_name} ({sub.leader_email})</p>
                              </div>

                              <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-2">{sub.project_desc}</p>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-[11px] text-slate-300">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Problem Statement</span>
                                  <span className="font-semibold line-clamp-1">{sub.problem_statement || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Proposed Solution</span>
                                  <span className="font-semibold line-clamp-1">{sub.solution || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3 pt-2">
                                {sub.github_repo && (
                                  <a href={sub.github_repo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent font-semibold transition">
                                    <Globe size={13} />
                                    <span>GitHub Repository</span>
                                  </a>
                                )}
                                {sub.ppt_link && (
                                  <a href={sub.ppt_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent font-semibold transition">
                                    <FileText size={13} />
                                    <span>Presentation (PPT)</span>
                                  </a>
                                )}
                                {sub.video_link && (
                                  <a href={sub.video_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent font-semibold transition">
                                    <Play size={13} />
                                    <span>Demo Video</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-end">
                              {sub.score_awarded !== null ? (
                                <div className="bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-2xl text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-green-500 block tracking-widest">Score Awarded</span>
                                  <span className="text-lg font-black text-green-400">{sub.score_awarded}/100</span>
                                </div>
                              ) : (
                                <div className="bg-slate-800 border border-slate-700/50 px-4 py-2.5 rounded-2xl text-left">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-500 block tracking-widest">Evaluation</span>
                                  <span className="text-xs font-semibold text-slate-400">Pending Review</span>
                                </div>
                              )}

                              <button
                                onClick={() => openEvalModal(sub)}
                                className="bg-accent hover:bg-accent/80 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center gap-1.5 w-full sm:w-auto justify-center"
                              >
                                <Star size={13} />
                                <span>{sub.score_awarded !== null ? 'Re-evaluate' : 'Evaluate'}</span>
                              </button>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Select Assigned Hackathon */}
                  <div className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                    <div>
                      <h3 className="font-extrabold text-white text-base">Select Event</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Select an assigned event to view the live average leaderboard.</p>
                    </div>

                    <select
                      value={selectedHackathonId}
                      onChange={(e) => setSelectedHackathonId(e.target.value)}
                      className="glass-input px-4 py-3 rounded-xl text-xs font-semibold w-full sm:w-64"
                    >
                      <option value="" disabled className="bg-slate-900 text-white">Choose Hackathon</option>
                      {assignedHackathons.map(h => (
                        <option key={h.hackathon_id} value={h.hackathon_id} className="bg-slate-900 text-white">{h.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden">
                    {loadingLeaderboard ? (
                      <div className="py-24 flex items-center justify-center">
                        <Loader2 className="animate-spin text-accent" size={32} />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <th className="p-5 w-16 text-center">Rank</th>
                              <th className="p-5">Team Name</th>
                              <th className="p-5">Project Title</th>
                              <th className="p-5 text-center">Evaluations Done</th>
                              <th className="p-5 text-right">Average Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-sm">
                            {leaderboard.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="p-10 text-center text-slate-500">
                                  No projects have been evaluated for this hackathon yet.
                                </td>
                              </tr>
                            ) : (
                              leaderboard.map((row, idx) => (
                                <tr key={row.team_id} className="hover:bg-slate-800/20 transition duration-150">
                                  <td className="p-5 text-center font-bold">
                                    {idx + 1 === 1 ? <span className="text-yellow-400">🥇</span> :
                                     idx + 1 === 2 ? <span className="text-slate-400">🥈</span> :
                                     idx + 1 === 3 ? <span className="text-amber-600">🥉</span> :
                                     idx + 1}
                                  </td>
                                  <td className="p-5 font-bold text-white">{row.team_name}</td>
                                  <td className="p-5 text-slate-300">{row.project_title || 'N/A'}</td>
                                  <td className="p-5 text-center text-slate-400 font-medium">{row.total_evaluations} reviews</td>
                                  <td className="p-5 text-right font-black text-accent text-base">
                                    {row.average_score !== null ? `${row.average_score}/100` : '—'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Multi-Criteria Evaluation Input Modal */}
      <AnimatePresence>
        {showEvalModal && selectedSub && (
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
              className="w-full max-w-xl glass-panel p-6 rounded-3xl space-y-6 shadow-2xl relative text-left my-8"
            >
              <button
                onClick={() => setShowEvalModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-lg">Project Scoring Matrix</h3>
                <p className="text-xs text-slate-400">Project: {selectedSub.project_title} | Team: {selectedSub.team_name}</p>
              </div>

              <form onSubmit={handleEvalSubmit} className="space-y-4">
                
                {/* 6 Criteria Scoring Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Innovation (Max 20)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={innovation}
                      onChange={(e) => setInnovation(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                      placeholder="0 - 20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Technical Complexity (Max 20)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={techComplexity}
                      onChange={(e) => setTechComplexity(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                      placeholder="0 - 20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">UI / UX (Max 15)</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={uiUx}
                      onChange={(e) => setUiUx(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                      placeholder="0 - 15"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Database Design (Max 15)</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={dbDesign}
                      onChange={(e) => setDbDesign(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                      placeholder="0 - 15"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Presentation (Max 15)</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={presentation}
                      onChange={(e) => setPresentation(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                      placeholder="0 - 15"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Documentation (Max 15)</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={documentation}
                      onChange={(e) => setDocumentation(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-semibold"
                      placeholder="0 - 15"
                      required
                    />
                  </div>
                </div>

                {/* Total Marks Indicator */}
                <div className="bg-slate-800/60 p-4 border border-slate-800 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider">Total Marks Calculated:</span>
                  <span className={`text-base font-black ${totalScoreCalculated > 0 ? 'text-accent' : 'text-slate-500'}`}>
                    {totalScoreCalculated} / 100
                  </span>
                </div>

                {/* Feedback */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Feedback / Remarks</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs resize-none"
                    placeholder="Provide detailed feedback here..."
                    required
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEvalModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={evalSaving}
                    className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-1.5"
                  >
                    {evalSaving ? <Loader2 className="animate-spin" size={14} /> : (
                      <>
                        <Save size={13} />
                        <span>Submit Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default JudgeDashboard;
