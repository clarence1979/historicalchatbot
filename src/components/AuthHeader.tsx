import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
        <Settings className="text-green-400" size={20} />
        <span className="text-white text-sm font-medium">{user.username}</span>
      </div>

      <button
        onClick={logout}
        className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md rounded-full p-2 border border-red-500/50 transition-colors duration-200 group"
        title="Logout"
      >
        <LogOut className="text-red-300 group-hover:text-red-200" size={20} />
      </button>
    </div>
  );
}
