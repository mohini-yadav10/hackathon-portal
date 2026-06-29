import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { User, Mail, Lock, School, BookOpen, Calendar, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLES = [
  { value: 'Student', label: 'Student', description: 'Join hackathons & build teams' },
  { value: 'Judge', label: 'Judge', description: 'Evaluate and score projects' },
  { value: 'Manager', label: 'Hackathon Manager', description: 'Create & manage hackathons' },
];

const Register = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    branch: '',
    year: 1,
    role: 'Student',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, college, branch, year, role } = formData;

    if (!name || !email || !password || !role) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    setErrorMsg('');
    setLoadingSubmit(true);

    const result = await registerUser({
      name,
      email,
      password,
      college: college || null,
      branch: branch || null,
      year: parseInt(year) || null,
      role,
    });

    if (result.success) {
      const userRole = result.user?.role || role;
      navigate(ROLE_HOME[userRole] || '/dashboard');
    } else {
      setErrorMsg(result.message || 'Registration failed');
      setLoadingSubmit(false);
    }
  };

  const isStudent = formData.role === 'Student';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 h-96 w-96 bg-accent/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 left-1/4 h-64 w-64 bg-purple-500/10 rounded-full blur-[80px] -z-10" />

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
          <h1 className="text-xl font-bold text-white mt-4">Create Your Account</h1>
          <p className="text-xs text-slate-400">Join the hackathon ecosystem</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/35 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-6 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <ShieldCheck size={13} /> Register As
          </label>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                id={`role-${r.value.toLowerCase()}`}
                onClick={() => setFormData((p) => ({ ...p, role: r.value }))}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  formData.role === r.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <p className="text-xs font-bold">{r.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70 leading-tight">{r.description}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={18} />
                </span>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                  id="register-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  id="register-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            {/* College (optional for non-students) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
                College / Institution {!isStudent && <span className="text-slate-600">(optional)</span>}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <School size={18} />
                </span>
                <input
                  id="register-college"
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="University Name"
                  required={isStudent}
                />
              </div>
            </div>

            {/* Branch — only relevant for Students */}
            {isStudent && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Branch / Major</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <BookOpen size={18} />
                    </span>
                    <input
                      id="register-branch"
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Year of Study</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Calendar size={18} />
                    </span>
                    <select
                      id="register-year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
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
              </>
            )}
          </div>

          <button
            type="submit"
            id="register-submit"
            disabled={loadingSubmit}
            className="w-full mt-4 bg-accent hover:bg-accent/80 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 group disabled:opacity-60"
          >
            {loadingSubmit ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
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
