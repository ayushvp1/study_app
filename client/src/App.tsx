import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthLayout } from "./components/AuthLayout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { useAuth } from "./lib/auth-context";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/minimal";
import { client } from "./lib/api";
import { BookOpen, ChevronDown, Sparkles } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { PracticePage } from "./pages/PracticePage";

const Profile = () => {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-md mx-auto p-10 bg-white rounded-[3rem] border border-slate-100 shadow-2xl text-center space-y-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-600 to-rose-700"></div>
      <div className="relative pt-12">
        <div className="w-28 h-28 bg-white text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl font-black shadow-2xl border-8 border-white">
          {user.name.charAt(0)}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{user.name}</h2>
        <p className="text-slate-500 font-bold">{user.email}</p>
        <div className="mt-4 inline-block px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded-full uppercase tracking-widest shadow-sm">
          {user.role}
        </div>
      </div>
      <Button onClick={logout} className="w-full bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white border-none h-14 shadow-none hover:shadow-xl hover:shadow-red-200">
        Log Out
      </Button>
    </div>
  );
};

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/practice" element={user ? <PracticePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
