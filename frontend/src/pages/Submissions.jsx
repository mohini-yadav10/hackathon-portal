import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { api } from '../context/AuthContext';
import { FolderKanban, GitBranch, Link2, Video, FileText, Loader2, CheckCircle2, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

const EMPTY_FORM = {
  team_id: '',
  hackathon_id: '',
  project_title: '',
  description: '',
  problem_statement: '',
  solution: '',
  tech_stack: '',
  github_url: '',
  ppt_url: '',
  demo_video_url: '',
};

const Submissions = () => {
  const [myTeams, setMyTeams] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMyTeams = useCallback(async () => {
    try {
      const res = await api.get('/teams/my-teams');
      const teams = res.data.data || [];
      setMyTeams(teams);
      if (teams.length > 0) {
        const activeTeam = teams[0];
        setForm((f) => ({
          ...f,
          team_id: activeTeam.team_id,
          hackathon_id: activeTeam.hackathon_id,
        }));
        // Check if submission exists
        try {
          const subRes = await api.get(`/submissions/team/${activeTeam.team_id}`);
          setSubmission(subRes.data.submission);
          setForm({ ...subRes.data.submission, team_id: activeTeam.team_id, hackathon_id: activeTeam.hackathon_id });
        } catch (_) {
          setSubmission(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyTeams(); }, [fetchMyTeams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/submissions', form);
      showToast('success', submission ? 'Submission updated successfully!' : 'Project submitted successfully!');
      setEditing(false);
      // Refresh
      const subRes = await api.get(`/submissions/team/${form.team_id}`);
      setSubmission(subRes.data.submission);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!submission?.submission_id) return;
    if (!window.confirm('Are you sure you want to delete your submission? This cannot be undone.')) return;
    try {
      await api.delete(`/submissions/${submission.submission_id}`);
      setSubmission(null);
      setForm((f) => ({ ...f, project_title: '', description: '', problem_statement: '', solution: '', tech_stack: '', github_url: '', ppt_url: '', demo_video_url: '' }));
      setEditing(false);
      showToast('success', 'Submission deleted');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete submission');
    }
  };

  const showForm = !submission || editing;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <main className="pt-16 p-8">
          {/* Toast */}
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

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FolderKanban size={24} className="text-accent" /> Project Submission
            </h1>
            <p className="text-slate-400 text-sm mt-1">Submit your hackathon project details and deliverables</p>
          </div>

          {loading ? (
            <div className="glass-panel rounded-2xl p-12 flex items-center justify-center">
              <Loader2 size={32} className="text-accent animate-spin" />
            </div>
          ) : myTeams.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <FolderKanban size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">You are not part of any team</p>
              <p className="text-slate-500 text-sm mt-1">Create or join a team first, then register for a hackathon to enable project submission.</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-6">
              {/* Existing submission view */}
              {submission && !editing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-2xl p-7 space-y-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{submission.project_title}</h2>
                      <p className="text-xs text-accent mt-1">{submission.hackathon_title}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="edit-submission"
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        id="delete-submission"
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{submission.description}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Solution</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{submission.solution}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Problem Statement</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{submission.problem_statement}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Tech Stack</p>
                      <p className="text-sm text-slate-300">{submission.tech_stack}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {submission.github_url && (
                      <a href={submission.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition">
                        <GitBranch size={15} /> GitHub Repository
                      </a>
                    )}
                    {submission.ppt_url && (
                      <a href={submission.ppt_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition">
                        <FileText size={15} /> PPT
                      </a>
                    )}
                    {submission.demo_video_url && (
                      <a href={submission.demo_video_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition">
                        <Video size={15} /> Demo Video
                      </a>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Submitted: {new Date(submission.created_at).toLocaleString()}
                    {submission.updated_at !== submission.created_at && ` • Updated: ${new Date(submission.updated_at).toLocaleString()}`}
                  </p>
                </motion.div>
              )}

              {/* Submit / Edit Form */}
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-2xl p-7"
                >
                  <h2 className="text-lg font-bold text-white mb-6">
                    {submission ? 'Edit Submission' : 'Submit Your Project'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Project Title *</label>
                        <input name="project_title" value={form.project_title} onChange={handleChange}
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="Awesome Hackathon Project" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description *</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm resize-none" placeholder="Brief overview of your project..." required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Problem Statement *</label>
                        <textarea name="problem_statement" value={form.problem_statement} onChange={handleChange} rows={4}
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm resize-none" placeholder="What problem does it solve?" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Solution *</label>
                        <textarea name="solution" value={form.solution} onChange={handleChange} rows={3}
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm resize-none" placeholder="How does your project solve it?" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tech Stack *</label>
                        <input name="tech_stack" value={form.tech_stack} onChange={handleChange}
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="React, Node.js, MySQL..." required />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <GitBranch size={13} /> GitHub Repository URL *
                        </label>
                        <input name="github_url" value={form.github_url} onChange={handleChange} type="url"
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="https://github.com/..." required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={13} /> PPT / Slides URL
                        </label>
                        <input name="ppt_url" value={form.ppt_url} onChange={handleChange} type="url"
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="https://drive.google.com/..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Video size={13} /> Demo Video URL
                        </label>
                        <input name="demo_video_url" value={form.demo_video_url} onChange={handleChange} type="url"
                          className="w-full glass-input px-4 py-3 rounded-xl text-sm" placeholder="https://youtube.com/..." />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      {editing && (
                        <button type="button" onClick={() => setEditing(false)}
                          className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition">
                          Cancel
                        </button>
                      )}
                      <button type="submit" id="submit-project" disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : submission ? 'Update Submission' : 'Submit Project'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Submissions;
