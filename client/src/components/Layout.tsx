import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, User, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-white relative">
      <div className="bg-mesh" />
      <div className="bg-noise" />
      <main className="flex-1 pb-24 md:pb-0 md:pl-72 transition-all duration-500">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <Outlet />
        </div>
      </main>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-white/5 flex-col p-8 z-50 shadow-2xl">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
            <span className="text-white font-black italic">C</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-tight">Conquerors<br/>Lobby</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavLink to="/" icon={<Home size={22} />} label="Dashboard" active={location.pathname === "/"} />
          <NavLink to="/practice" icon={<BookOpen size={22} />} label="Practice" active={location.pathname === "/practice"} />
          {isAdmin && <NavLink to="/admin" icon={<ShieldCheck size={22} />} label="Forge" active={location.pathname === "/admin"} />}
          <NavLink to="/profile" icon={<User size={22} />} label="Account" active={location.pathname === "/profile"} />
        </nav>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 p-4 rounded-xl text-slate-500 hover:bg-red-600/10 hover:text-red-500 transition-all font-bold mt-auto border border-transparent hover:border-red-500/20"
        >
          <LogOut size={22} />
          <span>Log Out</span>
        </button>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-around px-6 shadow-2xl z-50">
        <MobileNavLink to="/" icon={<Home size={24} />} active={location.pathname === "/"} />
        <MobileNavLink to="/practice" icon={<BookOpen size={24} />} active={location.pathname === "/practice"} />
        {isAdmin && <MobileNavLink to="/admin" icon={<ShieldCheck size={24} />} active={location.pathname === "/admin"} />}
        <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-500 transition-all active:scale-90">
          <LogOut size={24} />
        </button>
      </nav>
    </div>
  );
}

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-4 p-4 rounded-xl transition-all group ${
        active 
          ? "bg-red-600 text-white shadow-lg shadow-red-900/40 border border-white/10" 
          : "text-slate-500 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className={`${active ? "text-white" : "text-slate-500 group-hover:text-white"} transition-colors`}>
        {icon}
      </span>
      <span className="font-bold tracking-tight">{label}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon, active }: { to: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link 
      to={to} 
      className={`p-4 rounded-xl transition-all active:scale-90 ${
        active ? "text-white bg-red-600 shadow-lg shadow-red-900/40" : "text-slate-500"
      }`}
    >
      {icon}
    </Link>
  );
}
