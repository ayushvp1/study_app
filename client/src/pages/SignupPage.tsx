import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { client } from "../lib/api";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from "../components/ui/minimal";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.api.auth.register.$post({ json: { email, password, name } });
      if (res.ok) {
        navigate("/login", { state: { message: "Account created! Please login." } });
      } else {
        const data = await res.json() as any;
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
          <CardTitle className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent leading-normal">Join Us</CardTitle>
          <CardDescription>Create your account and start your learning journey today.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup} id="signup-form" name="signup">
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input 
                  id="signup-name"
                  name="name"
                  placeholder="John Doe" 
                  value={name} 
                  onChange={(e: any) => setName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email"
                  name="email"
                  type="email" 
                  placeholder="john@example.com" 
                  value={email} 
                  onChange={(e: any) => setEmail(e.target.value)} 
                  required 
                  autoComplete="email" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e: any) => setPassword(e.target.value)} 
                    required 
                    autoComplete="new-password"
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
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm font-bold text-slate-400">
              Already have an account? <Link to="/login" className="text-red-600 hover:underline">Sign In</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
  );
}
