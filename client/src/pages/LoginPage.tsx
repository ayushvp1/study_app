import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { client, setAuthToken } from "../lib/api";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from "../components/ui/minimal";
import { useAuth } from "../lib/auth-context";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
          <CardTitle className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">BHVR</CardTitle>
          <CardDescription>Master your craft. Login to access your practice modules.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {success}
              </div>
            )}
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
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full h-14">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="flex items-center justify-between px-2">
              <Link to="/forgot-password" title="Forgot Password" className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors">
                Forgot Password?
              </Link>
              <Link to="/signup" title="Create Account" className="text-sm font-black text-red-600 hover:text-red-700 hover:underline">
                Create Account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
  );
}
