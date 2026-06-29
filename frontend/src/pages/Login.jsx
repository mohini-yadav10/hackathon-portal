import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { loginUser, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null); // { type: 'success'|'error', message }
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setErrorMsg('');
    setLoadingSubmit(true);

    const result = await loginUser({ email, password });
    if (result.success) {
      // Route based on actual role from server response
      const role = result.user?.role || 'Student';
      navigate(ROLE_HOME[role] || '/dashboard');
    } else {
      setErrorMsg(result.message || 'Invalid email or password');
      setLoadingSubmit(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotStatus(null);
    const result = await forgotPassword(forgotEmail);
    setForgotStatus({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-accent/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-purple-500/10 rounded-full blur-[80px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative"
      >
        <div className="text-center space-y-2 mb-8">
          <Link to="/" className="text-2xl font-extrabold tracking-wider">
            <span className="text-accent text-glow">HACK</span> PORTAL
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Welcome Back</h1>
          <p className="text-xs text-slate-400">Sign in to your portal account</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/35 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                placeholder="you@college.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotStatus(null); }}
                className="text-xs text-accent hover:text-accent/70 cursor-pointer transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            disabled={loadingSubmit}
            className="w-full mt-2 bg-accent hover:bg-accent/80 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 group disabled:opacity-60"
          >
            {loadingSubmit ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} className="transform group-hover:translate-x-0.5 transition duration-200" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-6">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-accent hover:underline font-semibold ml-1">
            Register Here
          </Link>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-3xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <KeyRound size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">Enter your email to receive a reset link</p>
                </div>
              </div>

              {forgotStatus && (
                <div className={`mb-5 p-3 rounded-xl flex items-start gap-2 text-xs ${
                  forgotStatus.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {forgotStatus.type === 'success'
                    ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                    : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                  <span>{forgotStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail size={18} />
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="forgot-submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent/80 text-white text-sm font-bold transition disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : 'Send Reset Link'}
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

export default Login;
