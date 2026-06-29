import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  Users,
  Search,
  CheckSquare,
  Bell,
  FolderKanban,
  Star,
  Settings,
  LogOut,
  Gavel,
  Trophy,
  ClipboardList,
  Megaphone,
  BarChart2,
  ShieldCheck,
  UserCog,
  Database,
} from 'lucide-react';

const NAV_LINKS = {
  Student: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/hackathons', label: 'Browse Hackathons', icon: Award },
    { path: '/team-search', label: 'Find Teams', icon: Search },
    { path: '/my-team', label: 'My Team', icon: Users },
    { path: '/my-submission', label: 'My Submission', icon: FolderKanban },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  Leader: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/hackathons', label: 'Browse Hackathons', icon: Award },
    { path: '/my-team', label: 'My Team', icon: Users },
    { path: '/my-submission', label: 'Project Submission', icon: FolderKanban },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  Judge: [
    { path: '/judge', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/judge/assignments', label: 'My Assignments', icon: ClipboardList },
    { path: '/judge/evaluations', label: 'Evaluations', icon: Star },
    { path: '/judge/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  Manager: [
    { path: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/manager/hackathons', label: 'My Hackathons', icon: Award },
    { path: '/manager/registrations', label: 'Registrations', icon: CheckSquare },
    { path: '/manager/judges', label: 'Manage Judges', icon: Gavel },
    { path: '/manager/announcements', label: 'Announcements', icon: Megaphone },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  Admin: [
    { path: '/admin', label: 'Dashboard', icon: BarChart2 },
    { path: '/admin/users', label: 'Manage Users', icon: UserCog },
    { path: '/admin/hackathons', label: 'Hackathons', icon: Award },
    { path: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/admin/logs', label: 'System Logs', icon: Database },
    { path: '/admin/roles', label: 'Role Manager', icon: ShieldCheck },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

const Sidebar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const links = NAV_LINKS[user?.role] || NAV_LINKS.Student;

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 fixed left-0 top-16 bottom-0 z-20 flex flex-col justify-between py-4 overflow-y-auto">
      <div className="space-y-4">
        <div className="px-6 pt-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Navigation</p>
        </div>
        <nav className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/admin' || link.path === '/dashboard' || link.path === '/judge' || link.path === '/manager'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-accent/15 text-accent border-l-4 border-accent shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-4 border-transparent'
                  }`
                }
              >
                <Icon size={17} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-3 space-y-2">
        {/* User info card */}
        <div className="px-4 py-3 bg-slate-800/30 border border-slate-700/40 rounded-2xl text-center">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
            <User size={16} className="text-accent" />
          </div>
          <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold rounded-full bg-accent/20 text-accent uppercase tracking-wider">
            {user?.role}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
