import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Users, UserMinus, ShieldAlert, Award, Send, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const MyTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTeamId = searchParams.get('id');

  const [teamDetails, setTeamDetails] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTeamDetails = async () => {
    // If no specific team ID is passed, retrieve the user's active teams and take the first one, or prompt select.
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

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !teamDetails) return;

    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/invitations', {
        receiver_email: inviteEmail.trim(),
        team_id: teamDetails.team_id
      });
      setSuccessMsg(`Invitation successfully sent to ${inviteEmail.trim()}!`);
      setInviteEmail('');
      fetchTeamDetails();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await api.delete(`/teams/${teamDetails.team_id}/members/${memberUserId}`);
        alert('Member removed successfully');
        fetchTeamDetails();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const handleLeaveTeam = async () => {
    const msg = teamDetails.leader_id === user.user_id 
      ? 'WARNING: You are the team leader. Leaving the team will DISSOLVE it entirely. Do you want to continue?'
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

  const handleAssignRole = async (memberUserId, currentRole) => {
    const newRole = prompt('Enter team role for this member (e.g. Frontend, Backend, ML Engineer, UI Designer):', currentRole);
    if (newRole === null) return; // cancelled

    try {
      await api.put(`/teams/${teamDetails.team_id}/members/${memberUserId}/role`, {
        role: newRole || 'Developer'
      });
      alert('Role updated successfully!');
      fetchTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign role');
    }
  };

  const handleSubmitRegistration = async () => {
    if (window.confirm('Do you want to submit the final registration? Once submitted, the team will be locked and cannot be edited.')) {
      try {
        await api.post('/registrations', {
          team_id: teamDetails.team_id,
          hackathon_id: teamDetails.hackathon_id
        });
        alert('Registration submitted successfully!');
        fetchTeamDetails();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to submit registration');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-100">
        <Navbar title="My Team" />
        <Sidebar />
        <main className="pl-64 pt-16 min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </main>
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div className="min-h-screen bg-background text-slate-100">
        <Navbar title="My Team" />
        <Sidebar />
        <main className="pl-64 pt-16 min-h-screen">
          <div className="p-8 max-w-4xl mx-auto space-y-6 text-center py-24">
            <Users size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No active teams found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">
              You are currently not associated with any team. Browse hackathons to form or join a team.
            </p>
            <button
              onClick={() => navigate('/hackathons')}
              className="mt-6 bg-accent hover:bg-accent/80 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Browse Hackathons
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isLeader = teamDetails.leader_id === user.user_id;
  const isRegistered = teamDetails.registration !== null;
  const registrationStatus = teamDetails.registration?.status || 'Not Submitted';

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title={`Team: ${teamDetails.team_name}`} />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-left">
              <span className="text-xs text-accent font-bold uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full border border-accent/25">
                {teamDetails.hackathon_title}
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-3">{teamDetails.team_name}</h2>
              <p className="text-slate-400 text-sm mt-1">
                Leader: <span className="text-slate-200 font-semibold">{teamDetails.leader_name}</span> | Team Size: {teamDetails.team_size}/{teamDetails.hackathon_max_size}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLeaveTeam}
                className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 font-bold px-4 py-2.5 rounded-xl text-xs transition"
              >
                {isLeader ? 'Dissolve Team' : 'Leave Team'}
              </button>
            </div>
          </div>

          {/* Registration Status Alert Banner */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              {registrationStatus === 'Approved' ? (
                <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20">
                  <CheckCircle size={22} />
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
                   registrationStatus === 'Pending' ? 'Your registration is submitted and pending admin approval.' :
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

          {/* Members list & Invite Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Members Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel p-6 rounded-3xl border-slate-800">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3 text-left">
                  <Users size={20} className="text-accent" />
                  <span>Team Members ({teamDetails.members.length})</span>
                </h3>

                <div className="space-y-4">
                  {teamDetails.members.map((member) => {
                    const isMemberLeader = member.user_id === teamDetails.leader_id;
                    return (
                      <div
                        key={member.user_id}
                        className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{member.name}</h4>
                            {isMemberLeader && (
                              <span className="bg-accent/15 text-accent text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                Leader
                              </span>
                            )}
                            <span className="bg-slate-700/50 text-slate-300 text-[10px] px-2 py-0.5 rounded font-semibold">
                              {member.team_role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">
                            {member.email} | {member.college} | {member.branch} | Year {member.year}
                          </p>
                          {member.bio && <p className="text-xs text-slate-500 leading-relaxed italic">"{member.bio}"</p>}
                          {member.skills && member.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.skills.map(s => (
                                <span key={s} className="bg-accent/5 text-[9px] text-accent/80 border border-accent/15 px-1.5 py-0.5 rounded-md">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Leader Actions */}
                        {isLeader && !isRegistered && !isMemberLeader && (
                          <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
                            <button
                              onClick={() => handleAssignRole(member.user_id, member.team_role)}
                              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs transition"
                            >
                              Assign Role
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.user_id, member.name)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition"
                              title="Kick member"
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Invite Form Panel */}
            <div className="space-y-6">
              {isLeader && !isRegistered && (
                <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 text-left">
                    <Send size={16} className="text-accent" />
                    <span>Invite Teammate</span>
                  </h3>
                  
                  <p className="text-xs text-slate-400 leading-relaxed text-left">
                    Enter the email address of a registered student to send them an invitation to join this team.
                  </p>

                  <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase pl-1">Student Email</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                        placeholder="teammate@college.edu"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    >
                      Send Invitation
                    </button>
                  </form>
                </div>
              )}

              {/* Event Guidelines Card */}
              <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 text-left">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Award size={16} className="text-accent" />
                  <span>Guidelines</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-400 list-disc pl-4 leading-relaxed">
                  <li>A user can only belong to one active team per hackathon.</li>
                  <li>Final registration must be submitted by the Team Leader.</li>
                  <li>Once final registration is submitted, team membership is locked.</li>
                  <li>If the team leader leaves, the team dissolves.</li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default MyTeam;
