import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'Invalid or missing reset token. Please request a new link.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    const result = await resetPassword(token, password);
    setLoading(false);

    if (result.success) {
      setStatus({ type: 'success', message: result.message });
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setStatus({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 h-96 w-96 bg-accent/10 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl"
      >
        <div className="text-center space-y-2 mb-8">
          <Link to="/" className="text-2xl font-extrabold tracking-wider">
            <span className="text-accent text-glow">HACK</span> PORTAL
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Set New Password</h1>
          <p className="text-xs text-slate-400">Enter and confirm your new password below</p>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs ${
            status.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/35 text-red-400'
          }`}>
            {status.type === 'success'
              ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        {status?.type !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  id="reset-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="reset-submit"
              disabled={loading}
              className="w-full mt-2 bg-accent hover:bg-accent/80 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 group disabled:opacity-60"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight size={18} className="transform group-hover:translate-x-0.5 transition duration-200" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-6">
          <Link to="/login" className="text-accent hover:underline font-semibold">← Back to Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
