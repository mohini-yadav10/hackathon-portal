import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, Shield, Zap, Sun, Moon, Sparkles, CheckCircle2, ChevronRight, Gavel, UserCheck, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Top Header / Navigation Bar */}
      <header className="h-20 flex justify-between items-center px-6 md:px-12 border-b border-slate-800/40 fixed left-0 right-0 top-0 bg-background/80 backdrop-blur-md z-50 w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-wider text-white">
            <span className="text-accent text-glow">JUMP</span>PORTAL
          </h1>
        </div>

        {/* Central Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition">Home</button>
          <button onClick={() => scrollToSection('why-blockchain')} className="hover:text-white transition">Why Hack Portal</button>
          <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition">How It Works</button>
          <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition">Role Benefits</button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/20 transition"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} className="text-slate-400" /> : <Sun size={18} className="text-amber-400" />}
          </button>

          <Link to="/login" className="text-xs font-bold hover:text-white text-slate-400 transition">
            Login
          </Link>
          <Link
            to="/register"
            className="text-xs font-bold bg-accent hover:bg-accent/80 text-white px-5 py-2.5 rounded-full transition duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Centered Hero Section with Grayscale Hackathon Crowd Background */}
      <main className="relative min-h-[90vh] flex flex-col justify-center items-center w-full px-6 md:px-12 pt-32 pb-24 overflow-hidden border-b border-slate-800/20">
        
        {/* Dot-grid mesh (visible in light mode) */}
        <div className="hero-mesh absolute inset-0 -z-10 w-full h-full"></div>

        {/* Decorative animated gradient blobs */}
        <div
          className="light-blob-blue w-[500px] h-[500px] top-[-100px] left-[-120px] opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="light-blob-blue w-[400px] h-[400px] bottom-[-60px] right-[-80px] opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
        />
        <div
          className="light-blob-blue w-[300px] h-[300px] top-[30%] right-[15%] opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)' }}
        />

        {/* Grayscale Hackathon Crowd Background Image */}
        <div className="absolute inset-0 -z-20 w-full h-full select-none">
          <img 
            src="/hackathon_crowd.png" 
            alt="Collegiate hackathon coding crowd background" 
            className="hero-crowd-img w-full h-full object-cover"
          />
        </div>

        {/* Dynamic theme gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background -z-10"></div>

        {/* Centered Content */}
        <div className="max-w-4xl mx-auto text-center space-y-8 z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex bg-accent/10 border border-accent/30 px-4 py-1.5 rounded-full text-accent text-[10px] font-bold uppercase tracking-widest"
          >
            🚀 Empowering Student Innovation
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-7xl font-black leading-[1.1] text-white tracking-tight"
          >
            Unleashing the Power <br />
            of <span className="text-accent text-glow">Hackathons</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed font-medium"
          >
            Transforming collegiate hackathons with secure, direct team-building configurations, interactive judge matrices, and automated real-time rankings.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto"
          >
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-10 py-4 rounded-full transition duration-300 shadow-[0_0_25px_rgba(59,130,246,0.3)] group text-xs uppercase tracking-wider"
            >
              <span>Get Started With Portal</span>
            </Link>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="flex items-center justify-center border border-slate-800/40 hover:border-slate-500 bg-slate-850/40 hover:bg-slate-800/20 text-slate-400 hover:text-white font-bold px-10 py-4 rounded-full transition duration-300 text-xs uppercase tracking-wider"
            >
              Discover How It Works
            </button>
          </motion.div>

          {/* Stats Strip */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 pt-6 border-t border-slate-800/30 w-full max-w-2xl"
          >
            {[
              { value: '500+', label: 'Students Registered' },
              { value: '30+', label: 'Hackathons Hosted' },
              { value: '100%', label: 'Automated Scoring' },
            ].map((stat, i) => (
              // <div key={i} className="text-center">
              //   <div className="text-2xl font-black text-accent text-glow">{stat.value}</div>
              //   <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{stat.label}</div>
              // </div>
            ))}
          </motion.div> */}
        </div>
      </main>

      {/* Why Hack Portal Section */}
      <section id="why-blockchain" className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-slate-800/30 text-center space-y-16">
        <div className="space-y-3">
          <h3 className="text-2xl md:text-3xl font-black text-white">
            Why <span className="text-accent text-glow">Hack Portal?</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Standardizing trust and efficiency in collegiate registration. Here is why it matters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Direct Entry', desc: 'No email invitations. Leaders register full teammate branches and enrollment keys directly.', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { title: 'Score Security', desc: 'Judges only access assigned teams. Complete transparency with structured evaluations.', icon: Shield, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { title: 'Live Averages', desc: 'Multi-judge scores are calculated automatically in the database to compile leaderboards.', icon: Trophy, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { title: 'Task Isolation', desc: 'Role-based access controls keep student, manager, judge, and admin panels secure.', icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
          ].map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="glass-panel border border-slate-800/40 p-6 rounded-2xl text-left space-y-4 shadow-xl"
            >
              <div className={`p-3 rounded-xl w-fit border ${feat.color}`}>
                <feat.icon size={22} />
              </div>
              <h4 className="font-extrabold text-base text-white">{feat.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works / Tech Grid Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-slate-800/30 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-grow space-y-6 text-left max-w-xl">
          <h3 className="text-2xl md:text-3xl font-black text-white">
            Why Hack Portal <span className="text-accent text-glow">Matters</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            We streamline the chaos of college hackathons. By automating the registration pipeline and deploying structural DB views for evaluation matrices, we guarantee a fair and automated evaluation standard for all developers.
          </p>
          <button onClick={() => scrollToSection('pricing')} className="bg-accent/15 text-accent border border-accent/20 font-bold px-6 py-2.5 rounded-full text-xs transition hover:bg-accent hover:text-white uppercase tracking-wider">
            View Role Benefits
          </button>
        </div>

        {/* CSS Mockup of Server Grid */}
        <div className="flex-1 w-full flex justify-center relative">
          <div className="absolute inset-0 bg-accent/10 rounded-full blur-[100px] -z-10"></div>
          <div className="w-full max-w-md glass-panel border border-slate-800/40 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">leaderboard_live_view.sql</span>
            </div>

            <div className="space-y-2.5 text-left font-mono text-[11px] text-slate-300">
              <div className="p-3 bg-slate-850/30 border border-slate-800/40 rounded-xl flex justify-between items-center">
                <span className="font-bold text-accent">1. Demo Cyber Knights</span>
                <span className="font-black text-green-400">87.00 AVG</span>
              </div>
              <div className="p-3 bg-slate-850/30 border border-slate-800/40 rounded-xl flex justify-between items-center opacity-80">
                <span>2. team agile</span>
                <span>74.50 AVG</span>
              </div>
              <div className="p-3 bg-slate-850/30 border border-slate-800/40 rounded-xl flex justify-between items-center opacity-60">
                <span>3. team smartCity</span>
                <span>68.00 AVG</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role / Pricing Plans Section */}
      <section id="pricing" className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-slate-800/30 text-center space-y-16">
        <div className="space-y-10">
          <h3 className="text-2xl md:text-3xl font-black text-white ">
            Role <span className="text-accent text-glow">Benefits</span>
          </h3>
          {/* <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Choose your login view to see the tailored dashboard panels built for every college hackathon actor.
          </p> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          
          {/* Student Card */}
          <div className="glass-panel border border-slate-800/40 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative hover:border-slate-700/60 transition">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Default Role</span>
                <h4 className="text-xl font-bold text-white mt-1">Student / Leader</h4>
              </div>
              <p className="text-xs text-slate-400">Register for events and manage teammate profiles in one location.</p>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-slate-800/40 pt-4">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Browse Active Events</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Direct Teammate Registry</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Submit GitHub & Videos</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Live Status Tracking</li>
              </ul>
            </div>
            <Link to="/register" className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-center text-xs transition">
              Join as Student
            </Link>
          </div>

          {/* Judge Card */}
          <div className="glass-panel border border-slate-800/40 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-slate-700/60 transition">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Evaluation Role</span>
                <h4 className="text-xl font-bold text-white mt-1">Event Judge</h4>
              </div>
              <p className="text-xs text-slate-400">Score submissions against specialized innovation and UI criteria.</p>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-slate-800/40 pt-4">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Assigned Teams View Only</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> 6-Criteria Matrix Input</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Edit Score Drafts</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Read-Only Leaderboard</li>
              </ul>
            </div>
            <Link to="/login" className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-center text-xs transition">
              Log In as Judge
            </Link>
          </div>

          {/* Manager Card */}
          <div className="glass-panel border border-accent/25 p-6  rounded-2xl flex flex-col justify-between space-y-6 relative hover:border-accent/40 transition shadow-[0_0_20px_rgba(59,130,246,0.05)]">
            <div className="absolute -top-8 -left-13 bg-accent text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              Most Popular
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-accent tracking-wider">Moderator Role</span>
                <h4 className="text-xl font-bold text-white mt-1">Hackathon Manager</h4>
              </div>
              <p className="text-xs text-slate-400">Manage registrations, assign judges, and review project uploads.</p>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-slate-800/40 pt-4">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Approve / Reject Teams</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Assign Judges to Teams</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Monitor Scores & Logs</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Post Announcements</li>
              </ul>
            </div>
            <Link to="/login" className="bg-accent hover:bg-accent/80 text-white font-bold py-2.5 rounded-xl text-center text-xs transition">
              Log In as Manager
            </Link>
          </div>

          {/* Admin Card */}
          <div className="glass-panel border border-slate-800/40 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-slate-700/60 transition">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Superuser Role</span>
                <h4 className="text-xl font-bold text-white mt-1">System Admin</h4>
              </div>
              <p className="text-xs text-slate-400">Overwatch user assignments, database audit logs, and global parameters.</p>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-slate-800/40 pt-4">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Manage Global Users</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Assign Event Managers</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> View System Logs</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-accent" /> Advanced CSV Exports</li>
              </ul>
            </div>
            <Link to="/login" className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-center text-xs transition">
              Log In as Admin
            </Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      {/* <footer className="border-t border-slate-800/40 py-8 text-center text-xs text-slate-600 max-w-7xl mx-auto w-full px-6">
        <p>&copy; {new Date().getFullYear()} Hack Portal. Built for college innovation and database workflow management.</p>
      </footer> */}
    </div>
  );
};

export default Landing;
