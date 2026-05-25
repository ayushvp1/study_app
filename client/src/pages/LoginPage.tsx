import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert, KeyRound, Sparkles } from "lucide-react";
import { client, setAuthToken } from "../lib/api";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from "../components/ui/minimal";
import { useAuth } from "../lib/auth-context";

export function LoginPage() {
  const [loginMode, setLoginMode] = useState<"standard" | "demo">("standard");
  
  // Standard Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Demo Login State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear state so it doesn't reappear on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await client.api.auth.login.$post({ json: { email, password } });
      if (res.ok) {
        const { token, user } = await res.json() as any;
        setAuthToken(token);
        setUser(user);
        navigate("/");
      } else {
        const data = await res.json() as any;
        setError(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDemoOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await client.api.auth["demo-send-otp"].$post();
      if (res.ok) {
        const data = await res.json() as any;
        setGeneratedOtp(data.otp);
        setOtpSent(true);
        setSuccess(`⚡ Demo OTP generated: ${data.otp}`);
      } else {
        const data = await res.json() as any;
        setError(data.error || "Failed to generate demo OTP.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the auth service. Make sure the backend is running, then try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDemoOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await client.api.auth["demo-verify-otp"].$post({ json: { otp: otpCode } });
      if (res.ok) {
        const { token, user } = await res.json() as any;
        setAuthToken(token);
        setUser(user);
        navigate("/");
      } else {
        const data = await res.json() as any;
        setError(data.error || "Invalid or expired OTP code.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not verify the OTP. Make sure the backend is running, then try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent flex items-center gap-2">
          Conquerors Lobby
        </CardTitle>
        <CardDescription>Master your craft. Access your interactive practice modules.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Toggle between Standard Login and Demo OTP Login */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-2 gap-1">
          <button
            type="button"
            onClick={() => { setLoginMode("standard"); setError(""); setSuccess(""); }}
            className={`flex-grow py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              loginMode === "standard"
                ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md shadow-red-950/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Standard Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode("demo"); setError(""); setSuccess(""); }}
            className={`flex-grow py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              loginMode === "demo"
                ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md shadow-red-950/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Demo Account (OTP)
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        {loginMode === "standard" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                  required 
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                    required 
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
            
            <CardFooter className="px-0 pb-0 pt-4 flex flex-col gap-4">
              <Button type="submit" disabled={loading} className="w-full h-14">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="flex w-full items-center justify-between px-2">
                <Link to="/forgot-password" title="Forgot Password" className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors">
                  Forgot Password?
                </Link>
                <Link to="/signup" title="Create Account" className="text-sm font-black text-red-600 hover:text-red-700 hover:underline">
                  Create Account
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {!otpSent ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
                  <Sparkles size={22} />
                </div>
                <div className="space-y-2 max-w-xs mx-auto">
                  <h4 className="font-black text-lg text-white">Developer Mode</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Instantly sign in as <code className="text-red-400 bg-red-500/5 px-1.5 py-0.5 rounded border border-red-500/10 font-bold">demo@platform.com</code> to run testing and save Masteries consistently.
                  </p>
                </div>
                <Button 
                  onClick={handleRequestDemoOtp} 
                  disabled={loading} 
                  className="w-full h-14 mt-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 border-none shadow-lg shadow-red-950/30"
                >
                  <KeyRound size={16} />
                  {loading ? "Generating OTP..." : "Get Demo OTP"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerifyDemoOtp} className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Demo OTP</span>
                    <span className="text-3xl font-black text-red-500 tracking-[0.25em] mt-1 select-all" title="Click to select code">{generatedOtp}</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-2">Enter this 6-digit code below to authenticate</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP Code</Label>
                    <Input 
                      id="otp" 
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 123456" 
                      value={otpCode} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpCode(e.target.value)} 
                      required 
                      className="text-center font-black tracking-widest text-lg"
                      autoFocus
                    />
                  </div>
                </div>

                <CardFooter className="px-0 pb-0 pt-4 flex flex-col gap-3">
                  <Button type="submit" disabled={loading} className="w-full h-14 flex items-center justify-center gap-2">
                    {loading ? "Authenticating..." : "Verify & Sign In"}
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtpCode(""); setError(""); setSuccess(""); }} 
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors py-2 uppercase tracking-wider"
                  >
                    ← Go Back
                  </button>
                </CardFooter>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
