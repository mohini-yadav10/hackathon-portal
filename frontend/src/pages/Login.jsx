import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

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
      // Determine destination based on role (returned in token decode state / auth context)
      // Check auth context state or fetch me
      // We wait for user state to load, but context handles it. Let's redirect based on credentials
      if (email.includes('admin@hackportal.com') || email.toLowerCase() === 'admin@hackportal.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setErrorMsg(result.message || 'Invalid email or password');
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glowing circle */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-accent/10 rounded-full blur-[100px] -z-10"></div>
      
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
          <h2 className="text-xl font-bold text-white mt-4">Welcome Back</h2>
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
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
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
              <span className="text-xs text-slate-500 hover:text-accent cursor-pointer transition">Forgot?</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
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
            disabled={loadingSubmit}
            className="w-full mt-2 bg-accent hover:bg-accent/80 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 group"
          >
            {loadingSubmit ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
    </div>
  );
};

export default Login;
