import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../components/ui/minimal";
import { Brain, Trophy, Flame, ChevronRight, Activity, Loader2, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { client } from "../lib/api";

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await client.api.stats.summary.$get();
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={48} />
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

      {/* Stats Grid */}
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

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Activity size={18} />
              </div>
              Quiz Activity
            </CardTitle>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              Live Feed
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-64 w-full relative">
              <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={generateWavePath(stats?.activity || [])}
                  fill="url(#chart-grad)"
                />
                <path
                  d={generateWavePath(stats?.activity || [])}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-draw"
                />
                {(stats?.activity || []).map((point: any, i: number) => (
                  <circle 
                    key={i} 
                    cx={(i * 400) / 6} 
                    cy={150 - (point.count * 15 + 20)} 
                    r="4" 
                    fill="white" 
                    stroke="#ef4444" 
                    strokeWidth="2"
                  />
                ))}
              </svg>
              <div className="flex justify-between mt-6 text-[10px] font-black text-slate-300 uppercase tracking-tighter border-t border-slate-50 pt-4 px-2">
                {(stats?.activity || []).map((point: any, i: number) => (
                  <span key={i}>{point.day}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-slate-200">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-xl">Mastery Ring</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-10 space-y-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - (parseFloat(stats?.accuracy?.replace('%', '') || "0") / 100 || 0))}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white tracking-tighter">{stats?.accuracy || "0%"}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-black text-slate-50 tracking-tight">Sharpening Skills</p>
              <p className="text-xs text-slate-300 font-medium uppercase tracking-widest">Top 15% this week</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function generateWavePath(activity: any[]) {
  if (!activity || activity.length === 0) return "";
  const points = activity.map((p, i) => ({
    x: (i * 400) / 6,
    y: 150 - (p.count * 15 + 20)
  }));
  
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  d += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

function StatCard({ icon, title, value, trend, color }: any) {
  const colorMap: any = {
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
