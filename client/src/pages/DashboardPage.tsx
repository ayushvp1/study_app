import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../components/ui/minimal";
import { Brain, Trophy, Flame, Activity, Loader2, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { client } from "../lib/api";

interface ActivityPoint {
  day: string;
  count: number;
}

interface RecentAttempt {
  id: string;
  questionText: string;
  isCorrect: boolean;
  attemptedAt: string;
}

interface DashboardStats {
  streak: string;
  mastery: string;
  totalQuizzes: string;
  accuracy: string;
  activity: ActivityPoint[];
  recentAttempts: RecentAttempt[];
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      console.log("Fetching stats...");
      try {
        const res = await client.api.stats.summary.$get();
        console.log("Stats response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("Stats data received:", data);
          setStats(data);
        } else {
          console.error("Stats fetch failed with status:", res.status);
          setError("Failed to load your progress. Please try logging in again.");
        }
      } catch (err) {
        console.error("Failed to fetch stats catch block:", err);
        setError("Connection error. Please check your internet.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-red-600" size={48} />
        <p className="text-slate-400 font-bold animate-pulse">Calculating your mastery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center">
          <Activity size={32} />
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-white">Oops! Something went wrong</p>
          <p className="text-slate-400 font-medium">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} className="h-12 px-8">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="space-y-1 relative z-10">
          <h2 className="text-4xl font-black tracking-tight leading-none">
            Welcome, <span className="text-red-500">Learner.</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg">Your progress is exceptional today.</p>
        </div>
        <Button onClick={() => navigate("/practice")} className="h-14 bg-white text-slate-900 hover:bg-red-500 hover:text-white px-8 rounded-2xl group border-none">
          Continue Learning
          <ArrowUpRight className="ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" size={20} />
        </Button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
      </div>

      {/* Simple Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Flame className="text-orange-500" size={20} />} 
          title="Daily Streak" 
          value={stats?.streak || "0 Days"} 
          trend="Active"
          color="orange"
        />
        <StatCard 
          icon={<Brain className="text-blue-500" size={20} />} 
          title="Mastery Score" 
          value={stats?.mastery || "0"} 
          trend="Keep going"
          color="blue"
        />
        <StatCard 
          icon={<Trophy className="text-yellow-500" size={20} />} 
          title="Questions" 
          value={stats?.totalQuizzes || "0"} 
          trend="Lifetime"
          color="yellow"
        />
        <StatCard 
          icon={<Activity className="text-emerald-500" size={20} />} 
          title="Accuracy" 
          value={stats?.accuracy || "0%"} 
          trend="7 Days"
          color="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-8">
          <h3 className="text-2xl font-black mb-4">Quiz Activity</h3>
          <p className="text-slate-400">Activity data for the last 7 days is recorded.</p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-4">
            {(stats?.activity || []).map((p, i) => (
              <div key={i} className="flex-1 min-w-[60px] p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase text-slate-500">{p.day}</p>
                <p className="text-xl font-black text-white">{p.count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-2xl font-black mb-4">Mastery Overview</h3>
          <div className="flex items-center gap-6">
            <div className="text-6xl font-black text-red-500">{stats?.accuracy || "0%"}</div>
            <div>
              <p className="font-bold text-white">Overall Accuracy</p>
              <p className="text-slate-400 text-sm">Target: 90% mastery</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <h3 className="text-2xl font-black mb-6">Recent Attempts</h3>
        <div className="space-y-3">
          {(stats?.recentAttempts || []).map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{a.questionText}</p>
                <p className="text-xs text-slate-500">{new Date(a.attemptedAt).toLocaleString()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${a.isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {a.isCorrect ? "Correct" : "Incorrect"}
              </div>
            </div>
          ))}
          {(!stats?.recentAttempts || stats.recentAttempts.length === 0) && (
            <p className="text-center text-slate-500 py-4">No recent attempts found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function generateWavePath(activity: ActivityPoint[]) {
  if (!activity || activity.length === 0) return "";
  
  const points = activity.map((p, i) => ({
    x: (i * 400) / Math.max(1, activity.length - 1),
    y: 150 - ((p?.count || 0) * 15 + 20)
  }));
  
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  d += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  color: "orange" | "blue" | "yellow" | "emerald";
}

function StatCard({ icon, title, value, trend, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="hover:border-slate-300 transition-all duration-300 group relative overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className={`w-10 h-10 ${colorMap[color]} rounded-xl flex items-center justify-center shadow-inner`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em]">{title}</p>
          <p className="text-2xl font-black text-white tracking-tighter mt-1 group-hover:text-red-300 transition-colors">{value}</p>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{trend}</span>
        </div>
      </CardContent>
      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
        {icon}
      </div>
    </Card>
  );
}
