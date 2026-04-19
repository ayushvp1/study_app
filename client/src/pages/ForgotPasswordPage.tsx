import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { client } from "../lib/api";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from "../components/ui/minimal";

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.api.auth["forgot-password"].$post({ json: { email } });
      if (res.ok) {
        setMessage("OTP sent! Check your email console.");
        setError("");
        setResendTimer(30);
        setStep(2);
      } else {
        const data = await res.json() as any;
        setError(data.error || "Failed to send OTP");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setError("Server Error: Check SMTP credentials or terminal logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.api.auth["reset-password"].$post({ json: { email, otp, newPassword } });
      if (res.ok) {
        navigate("/login", { state: { message: "Success! Password reset. Please login." } });
      } else {
        const data = await res.json() as any;
        setError(data.error || "Reset failed");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
          <CardTitle className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">Recovery</CardTitle>
          <CardDescription>
            {step === 1 ? "We'll send you a secure code to reset your password." : "Verify your identity with the code sent to your email."}
          </CardDescription>
        </CardHeader>
        
        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="john@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full h-14">
                {loading ? "Sending..." : "Request Reset Code"}
              </Button>
              <Link to="/login" className="text-center text-sm font-bold text-slate-400 hover:text-red-600 transition-colors">
                Return to Login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  {message}
                </div>
              )}
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                <Label className="text-[10px] opacity-50">Resetting password for</Label>
                <div className="font-bold text-slate-700">{email}</div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-otp">6-Digit Code</Label>
                  <Input 
                    id="reset-otp"
                    name="otp"
                    placeholder="000 000" 
                    className="text-center text-2xl tracking-[1em] font-black text-red-600" 
                    value={otp} 
                    onChange={(e: any) => setOtp(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="reset-password"
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={newPassword} 
                      onChange={(e: any) => setNewPassword(e.target.value)} 
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
                {loading ? "Verifying..." : "Update Password"}
              </Button>
              <div className="flex flex-col items-center gap-3">
                <button 
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleRequestOTP}
                  className={`text-sm font-bold transition-colors ${
                    resendTimer > 0 ? "text-slate-300 cursor-not-allowed" : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
                </button>
                <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors">
                  Change Email
                </button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
  );
}
