import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Check, X, ShieldAlert, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

const AdminApprovals = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/registrations');
      setRegistrations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (window.confirm(`Are you sure you want to change this registration status to ${status}?`)) {
      try {
        await api.put(`/registrations/${id}/status`, { status });
        alert(`Registration ${status.toLowerCase()} successfully!`);
        fetchRegistrations();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="Review Registrations" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white">Review Team Registrations</h2>
            <p className="text-slate-400 text-sm mt-1">Review, approve, or reject student team registrations submitted for published hackathons.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-5">Team Info</th>
                      <th className="p-5">Event</th>
                      <th className="p-5">Team Size</th>
                      <th className="p-5">Leader</th>
                      <th className="p-5">Submitted At</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-slate-500">
                          No registrations found.
                        </td>
                      </tr>
                    ) : (
                      registrations.map((reg) => (
                        <tr key={reg.registration_id} className="hover:bg-slate-800/20 transition duration-150">
                          <td className="p-5 font-bold text-white">{reg.team_name}</td>
                          <td className="p-5 text-slate-300">{reg.hackathon_title}</td>
                          <td className="p-5 text-slate-400">{reg.team_size} members</td>
                          <td className="p-5">
                            <div>
                              <p className="text-slate-300 font-medium">{reg.leader_name}</p>
                              <p className="text-[10px] text-slate-500">{reg.leader_email}</p>
                            </div>
                          </td>
                          <td className="p-5 text-slate-400 text-xs">
                            {new Date(reg.submitted_at).toLocaleString()}
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              reg.registration_status === 'Approved' ? 'bg-green-500/10 text-green-400' :
                              reg.registration_status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {reg.registration_status === 'Approved' && <CheckCircle2 size={13} />}
                              {reg.registration_status === 'Rejected' && <XCircle size={13} />}
                              {reg.registration_status === 'Pending' && <Clock size={13} />}
                              <span>{reg.registration_status}</span>
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            {reg.registration_status === 'Pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleUpdateStatus(reg.registration_id, 'Approved')}
                                  className="p-2 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-xl border border-green-500/20 transition"
                                  title="Approve"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(reg.registration_id, 'Rejected')}
                                  className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition"
                                  title="Reject"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">No actions pending</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminApprovals;
