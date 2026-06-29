import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Users, UserMinus, ShieldAlert, Award, Send, CheckCircle2, AlertTriangle, Play, X, Loader2, Edit3, Trash2, Globe, Phone } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MyTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTeamId = searchParams.get('id');

  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Role Custom Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalUserId, setRoleModalUserId] = useState(null);
  const [roleModalValue, setRoleModalValue] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);

  const fetchTeamDetails = async () => {
    let teamId = targetTeamId;

    try {
      if (!teamId) {
        const myTeamsRes = await api.get('/teams/my-teams');
        if (myTeamsRes.data.data.length > 0) {
          teamId = myTeamsRes.data.data[0].team_id;
        } else {
          setLoading(false);
          return;
        }
      }

      // Fetch team details
      const res = await api.get(`/teams/${teamId}`);
      setTeamDetails(res.data.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [targetTeamId]);

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await api.delete(`/teams/${teamDetails.team_id}/members/${memberUserId}`);
        setSuccessMsg('Member removed successfully');
        fetchTeamDetails();
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to remove member');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    }
  };

  const handleLeaveTeam = async () => {
    const msg = teamDetails.leader_id === user.user_id 
      ? 'WARNING: You are the team leader. Dissolving the team will delete the team registration. Do you want to continue?'
      : 'Are you sure you want to leave the team?';
      
    if (window.confirm(msg)) {
      try {
        await api.delete(`/teams/${teamDetails.team_id}/leave`);
        alert(teamDetails.leader_id === user.user_id ? 'Team dissolved.' : 'You left the team.');
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to leave team');
      }
    }
  };

  const openRoleModal = (userId, currentRole) => {
    setRoleModalUserId(userId);
    setRoleModalValue(currentRole || 'Developer');
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleModalValue.trim()) return;

    setRoleSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put(`/teams/${teamDetails.team_id}/members/${roleModalUserId}/role`, {
        role: roleModalValue.trim()
      });
      setShowRoleModal(false);
      setSuccessMsg('Member role updated successfully!');
      fetchTeamDetails();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to assign role');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setRoleSaving(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (window.confirm('Ready to submit registration for this hackathon? Team membership will be locked.')) {
      try {
        await api.post('/registrations', {
          team_id: teamDetails.team_id,
          hackathon_id: teamDetails.hackathon_id
        });
        setSuccessMsg('Registration submitted successfully! It is now pending approval.');
        fetchTeamDetails();
        setTimeout(() => setSuccessMsg(''), 6000);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Could not submit registration');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-100">
        <Navbar title="My Team" />
        <Sidebar />
        <main className="pl-64 pt-16 min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="text-accent animate-spin" />
        </main>
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div className="min-h-screen bg-background text-slate-100">
        <Navbar title="My Team" />
        <Sidebar />
        <main className="pl-64 pt-16 min-h-screen flex flex-col items-center justify-center p-8">
          <div className="glass-panel p-12 rounded-3xl border-slate-800 text-center max-w-md">
            <Users size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Team Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              You are not currently part of any team. Browse hackathons to register a team directly.
            </p>
            <button
              onClick={() => navigate('/hackathons')}
              className="bg-accent hover:bg-accent/80 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Browse Hackathons
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isLeader = teamDetails.leader_id === user.user_id;
  const registrationStatus = teamDetails.registration?.status;
  const isRegistered = !!teamDetails.registration;

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title={`Team: ${teamDetails.team_name}`} />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6 text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                {teamDetails.team_name}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Hackathon: {teamDetails.hackathon_title}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLeaveTeam}
                className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm font-semibold transition"
              >
                {isLeader ? 'Dissolve Team' : 'Leave Team'}
              </button>
            </div>
          </div>

          {/* Registration Lock Banner */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div className="flex items-start gap-4">
              {registrationStatus === 'Approved' ? (
                <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20">
                  <CheckCircle2 size={22} />
                </div>
              ) : registrationStatus === 'Pending' ? (
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                  <ShieldAlert size={22} />
                </div>
              ) : (
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                  <AlertTriangle size={22} />
                </div>
              )}
              <div>
                <h4 className="font-bold text-white text-sm">Registration Status</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {registrationStatus === 'Approved' ? 'Your team has been officially registered and approved for the event.' :
                   registrationStatus === 'Pending' ? 'Your registration is submitted and pending review.' :
                   'Your team is currently open and has not submitted the final registration.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              {isLeader && !isRegistered && (
                <button
                  onClick={handleSubmitRegistration}
                  className="bg-accent hover:bg-accent/80 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center gap-1.5"
                >
                  <Play size={12} fill="white" />
                  <span>Submit Registration</span>
                </button>
              )}
              {isRegistered && (
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                  registrationStatus === 'Approved' ? 'bg-green-500/15 text-green-400' :
                  registrationStatus === 'Rejected' ? 'bg-red-500/15 text-red-400' :
                  'bg-amber-500/15 text-amber-400'
                }`}>
                  {registrationStatus}
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/35 rounded-2xl text-red-400 text-xs text-left">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-green-500/10 border border-green-500/35 rounded-2xl text-green-400 text-xs text-left">
              {successMsg}
            </div>
          )}

          {/* Members Panel */}
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-3xl border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3 text-left">
                <Users size={20} className="text-accent" />
                <span>Team Members ({teamDetails.members.length} / {teamDetails.max_team_size || 'N/A'})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamDetails.members.map((member) => {
                  const isMemberLeader = member.user_id === teamDetails.leader_id;
                  return (
                    <div
                      key={member.user_id}
                      className="bg-slate-800/40 border border-slate-800/80 p-6 rounded-3xl flex flex-col justify-between text-left animate-fade-in relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                              <span>{member.name}</span>
                              {isMemberLeader && (
                                <span className="bg-accent/15 text-accent text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                  Leader
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
                          </div>
                          <span className="bg-slate-700/50 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                            {member.team_role}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-300 border-t border-slate-800/60 pt-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Enrollment ID</span>
                            <span className="font-semibold">{member.enrollment_number}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Branch</span>
                            <span className="font-semibold">{member.branch} (Yr {member.year})</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 col-span-2">
                            <Phone size={12} className="text-slate-400" />
                            <span>{member.phone_number}</span>
                          </div>
                        </div>

                        {member.github_url && (
                          <div className="pt-2">
                            <a
                              href={member.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent transition"
                            >
                              <Globe size={13} />
                              <span>{member.github_url}</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Leader Actions */}
                      {isLeader && !isRegistered && !isMemberLeader && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60 justify-end">
                          <button
                            onClick={() => openRoleModal(member.user_id, member.team_role)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase transition flex items-center gap-1"
                          >
                            <Edit3 size={11} />
                            <span>Edit Role</span>
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.name)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase transition flex items-center gap-1"
                          >
                            <UserMinus size={11} />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-6 shadow-2xl relative text-left"
            >
              <button
                onClick={() => setShowRoleModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-lg">Update Member Role</h3>
                <p className="text-xs text-slate-400">Specify the role/designation of this member in your team.</p>
              </div>

              <form onSubmit={handleSaveRole} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Role / Designation</label>
                  <input
                    type="text"
                    value={roleModalValue}
                    onChange={(e) => setRoleModalValue(e.target.value)}
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                    placeholder="e.g. Frontend Developer, ML Researcher"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={roleSaving}
                    className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center"
                  >
                    {roleSaving ? <Loader2 className="animate-spin" size={14} /> : 'Save Role'}
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

export default MyTeam;
