import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'blue' }) => {
  const colorMaps = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-500 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{title}</span>
        <h3 className="text-3xl font-extrabold text-white">{value}</h3>
        {description && <p className="text-[11px] text-slate-500 font-medium">{description}</p>}
      </div>
      <div className={`p-4 rounded-2xl border ${colorMaps[color] || colorMaps.blue}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
