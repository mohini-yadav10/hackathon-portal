import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, School, BookOpen, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !college || !branch || !year) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setErrorMsg('');
    setLoadingSubmit(true);

    const result = await registerUser({
      name,
      email,
      password,
      college,
      branch,
      year: parseInt(year),
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.message || 'Registration failed');
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background glowing circle */}
      <div className="absolute top-1/4 right-1/4 h-96 w-96 bg-accent/10 rounded-full blur-[100px] -z-10"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl glass-panel p-8 md:p-10 rounded-3xl shadow-2xl relative"
      >
        <div className="text-center space-y-2 mb-8">
          <Link to="/" className="text-2xl font-extrabold tracking-wider">
            <span className="text-accent text-glow">HACK</span> PORTAL
          </Link>
          <h2 className="text-xl font-bold text-white mt-4">Create Student Account</h2>
          <p className="text-xs text-slate-400">Join hackathons and collaborate with team members</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/35 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
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
                  placeholder="john@college.edu"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            {/* College */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">College Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <School size={18} />
                </span>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="University Name"
                  required
                />
              </div>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Branch / Major</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <BookOpen size={18} />
                </span>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
            </div>

            {/* Year of study */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Year of Study</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Calendar size={18} />
                </span>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm appearance-none bg-slate-900"
                  required
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full mt-4 bg-accent hover:bg-accent/80 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 group"
          >
            {loadingSubmit ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight size={18} className="transform group-hover:translate-x-0.5 transition duration-200" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-6">
          <span>Already have an account? </span>
          <Link to="/login" className="text-accent hover:underline font-semibold ml-1">
            Sign In Here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
