import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="min-h-screen gradient-bg text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Top Header */}
      <header className="h-20 flex justify-between items-center px-6 md:px-12 border-b border-slate-800/60 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-wider">
            <span className="text-accent text-glow">HACK</span> PORTAL
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold hover:text-accent transition duration-200">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-accent hover:bg-accent/80 text-white px-5 py-2.5 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 md:px-12 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12 flex-grow">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block bg-accent/10 border border-accent/30 px-4 py-1.5 rounded-full text-accent text-xs font-bold uppercase tracking-widest"
          >
            🚀 Empowering Student Innovation
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold leading-[1.1] text-white tracking-tight"
          >
            Discover Hackathons, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-green-400">
              Form Elite Teams.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            A high-performance collegiate hub to browse upcoming hackathons, build your perfect team using our skill-matching algorithm, and secure registrations seamlessly.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
          >
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-white font-bold px-8 py-4 rounded-2xl transition duration-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] group"
            >
              <span>Build Your Team</span>
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition duration-200" />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center border border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 font-bold px-8 py-4 rounded-2xl transition duration-300"
            >
              Explore Events
            </Link>
          </motion.div>
        </div>

        {/* Feature Grid Mockup (Right column) */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5 relative">
          <div className="absolute inset-0 bg-accent/10 rounded-full blur-[120px] -z-10 transform -translate-y-12"></div>
          
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4"
          >
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl w-fit border border-blue-500/20">
              <Trophy size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Event Finder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore dynamic, high-profile college tech hackathons in real time with complete scheduling info.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4"
          >
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl w-fit border border-green-500/20">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Team Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Query open positions filtered directly by specific developer programming language, stack skills, or project interests.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4"
          >
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit border border-purple-500/20">
              <Zap size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Trigger Actions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience instant auto-updates, notifications, and logging mechanisms driven by high performance database triggers.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4"
          >
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit border border-amber-500/20">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Transaction Safety</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enjoy structural consistency across team creations, accept invitations, and final logs through rollback-safe SQL procedures.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full px-6">
        <p>&copy; {new Date().getFullYear()} College DBMS Project. Created with React, Node, Express, and MySQL.</p>
      </footer>
    </div>
  );
};

export default Landing;
