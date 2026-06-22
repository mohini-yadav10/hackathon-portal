import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  Award, 
  Users, 
  Search, 
  CheckSquare, 
  Megaphone,
  BarChart2
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const studentLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/hackathons', label: 'Browse Hackathons', icon: Award },
    { path: '/team-search', label: 'Find Teams', icon: Search },
    { path: '/my-team', label: 'My Team', icon: Users },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: BarChart2 },
    { path: '/admin/hackathons', label: 'Hackathons', icon: Award },
    { path: '/admin/approvals', label: 'Approvals', icon: CheckSquare },
    { path: '/admin/users', label: 'Manage Users', icon: Users },
  ];

  const links = user?.role === 'Admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 fixed left-0 top-16 bottom-0 z-20 flex flex-col justify-between py-6">
      <div className="space-y-6">
        <div className="px-6">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Navigation</p>
        </div>
        <nav className="space-y-1.5 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/admin' || link.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 ${
                    isActive
                      ? 'bg-accent/15 text-accent border-l-4 border-accent shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-6 py-4 bg-slate-800/20 border-t border-slate-800/60 mx-3 rounded-2xl text-center">
        <p className="text-xs text-slate-400">Logged in as:</p>
        <p className="text-xs font-semibold text-slate-200 truncate mt-1">{user?.email}</p>
        <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold rounded bg-accent/20 text-accent uppercase tracking-wider">
          {user?.role}
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
