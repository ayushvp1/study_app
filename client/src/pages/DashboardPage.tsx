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

interface RecitationStats {
  tableNumber: number;
  count: number;
}

interface DashboardStats {
  streak: string;
  mastery: string;
  totalQuizzes: string;
  accuracy: string;
  activity: ActivityPoint[];
  recentAttempts: RecentAttempt[];
  recitations: RecitationStats[];
}

interface MasteryLevel {
  name: string;
  badge: string;
  color: string;
  glow: string;
  min: number;
}

const getMasteryLevel = (count: number): MasteryLevel => {
  if (count >= 10000) {
    return { name: "Transcender", badge: "🌌", color: "text-indigo-400 bg-indigo-950 border-indigo-800", glow: "shadow-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]", min: 10000 };
  }
  if (count >= 1000) {
    return { name: "Conqueror", badge: "👑", color: "text-amber-400 bg-yellow-950 border-yellow-800", glow: "shadow-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]", min: 1000 };
  }
  if (count >= 500) {
    return { name: "Elder", badge: "🛡️", color: "text-slate-300 bg-slate-900 border-slate-700", glow: "shadow-slate-400/30 shadow-[0_0_10px_rgba(148,163,184,0.2)]", min: 500 };
  }
  if (count >= 100) {
    return { name: "Commoner", badge: "🏅", color: "text-orange-400 bg-amber-950 border-amber-800", glow: "shadow-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]", min: 100 };
  }
  if (count >= 10) {
    return { name: "Novice", badge: "🌱", color: "text-emerald-400 bg-zinc-800 border-zinc-700", glow: "shadow-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]", min: 10 };
  }
  return { name: "Initiate", badge: "🌾", color: "text-slate-400 bg-slate-900 border-white/5", glow: "", min: 0 };
};

const getNextLevelInfo = (count: number) => {
  if (count >= 10000) {
    return { nextName: "Ultimate Mastery", target: count, progressPercent: 100, remaining: 0 };
  }
  
  let currentMin = 0;
  let target = 10;
  let nextName = "Novice";
  
  if (count >= 1000) {
    currentMin = 1000;
    target = 10000;
    nextName = "Transcender";
  } else if (count >= 500) {
    currentMin = 500;
    target = 1000;
    nextName = "Conqueror";
  } else if (count >= 100) {
    currentMin = 100;
    target = 500;
    nextName = "Elder";
  } else if (count >= 10) {
    currentMin = 10;
    target = 100;
    nextName = "Commoner";
  }
  
  const range = target - currentMin;
  const currentProgress = count - currentMin;
  const progressPercent = Math.min(100, Math.max(0, (currentProgress / range) * 100));
  const remaining = target - count;
  
  return { nextName, target, progressPercent, remaining };
};

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

      {/* Recitation Medals & Mastery Levels Card */}
      {(() => {
        const medalStats = getMedalStats(stats?.recitations || []);
        const statsMap: Record<number, number> = {};
        (stats?.recitations || []).forEach(r => {
          statsMap[r.tableNumber] = r.count;
        });

        return (
          <Card className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Recitation Mastery & Medals</h3>
                <p className="text-slate-400 text-sm font-semibold">Chant and recite multiplication tables in order to unlock ultimate medals.</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-white shadow-lg shadow-amber-950/40">
                <Trophy size={18} className="animate-bounce" />
                <span className="text-sm font-black uppercase tracking-wider">{medalStats.totalRecitations} Total Recitations</span>
              </div>
            </div>

            {/* Medals Showcase Grid */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
              <MedalShowcaseCard 
                badge="🌱" 
                name="Novice" 
                currentRecs={medalStats.noviceRecs} 
                targetRecs={190} 
                borderColor="border-slate-700" 
                bgColor="bg-zinc-800" 
                textColor="text-emerald-400"
                completedTables={medalStats.tablesFullyNovice}
              />
              <MedalShowcaseCard 
                badge="🏅" 
                name="Commoner" 
                currentRecs={medalStats.commonerRecs} 
                targetRecs={1900} 
                borderColor="border-amber-800/80" 
                bgColor="bg-amber-950" 
                textColor="text-orange-400"
                glow="shadow-orange-950/20"
                completedTables={medalStats.tablesFullyCommoner}
              />
              <MedalShowcaseCard 
                badge="🛡️" 
                name="Elder" 
                currentRecs={medalStats.elderRecs} 
                targetRecs={9500} 
                borderColor="border-slate-700" 
                bgColor="bg-slate-900" 
                textColor="text-slate-300"
                glow="shadow-slate-950/20"
                completedTables={medalStats.tablesFullyElder}
              />
              <MedalShowcaseCard 
                badge="👑" 
                name="Conqueror" 
                currentRecs={medalStats.conquerorRecs} 
                targetRecs={19000} 
                borderColor="border-yellow-800/80" 
                bgColor="bg-yellow-950" 
                textColor="text-amber-400"
                glow="shadow-yellow-950/25"
                completedTables={medalStats.tablesFullyConqueror}
              />
              <MedalShowcaseCard 
                badge="🌌" 
                name="Transcender" 
                currentRecs={medalStats.transcenderRecs} 
                targetRecs={190000} 
                borderColor="border-indigo-800/80" 
                bgColor="bg-indigo-950" 
                textColor="text-indigo-400"
                glow="shadow-indigo-950/30"
                completedTables={medalStats.tablesFullyTranscender}
              />
            </div>

            {/* Overall Medals Completion Progress Bar */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Table Mastery Coverage
                </span>
                <span className="text-white">{medalStats.masteredTables} / 19 Tables Mastered</span>
              </div>
              <div className="relative w-full h-4 bg-slate-950/60 rounded-full border border-white/5 overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${(medalStats.masteredTables / 19) * 100}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wide">
                Reach at least 10 recitations (Novice Medal) on each table from 12 to 30 to increase coverage!
              </p>
            </div>

            {/* Detailed Table Masteries & Progress Bars */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <Brain size={18} className="text-red-500" />
                  Individual Table Progress Bars
                </h4>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tables 12 - 30</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 19 }, (_, i) => {
                  const num = i + 12;
                  const count = statsMap[num] || 0;
                  const level = getMasteryLevel(count);
                  const nextLevel = getNextLevelInfo(count);
                  
                  return (
                    <div 
                      key={num}
                      onClick={() => navigate("/practice")}
                      className="p-4 bg-slate-950/40 border border-white/5 hover:border-red-500/30 rounded-2xl transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-white group-hover:text-red-500 transition-colors">Table of {num}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${level.color} ${level.glow}`}>
                          <span>{level.badge}</span>
                          <span>{level.name}</span>
                        </span>
                      </div>
                      
                      <div className="mt-3.5 space-y-1.5">
                        <div className="relative w-full h-2.5 bg-slate-950/80 rounded-full border border-white/5 overflow-hidden p-0.5">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.4)] transition-all duration-1000 ease-out"
                            style={{ width: `${nextLevel.progressPercent}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>{count} Recs</span>
                          <span>{nextLevel.remaining > 0 ? `${nextLevel.remaining} left` : "MAX 🏆"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })()}

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

const getMedalStats = (recitations: RecitationStats[] = []) => {
  const statsMap: Record<number, number> = {};
  recitations.forEach(r => {
    statsMap[r.tableNumber] = r.count;
  });

  let totalRecitations = 0;
  
  // Progress calculations for tables 12-30 (19 tables in total)
  let noviceRecs = 0;       // capped at 10 per table
  let commonerRecs = 0;     // capped at 100 per table
  let elderRecs = 0;        // capped at 500 per table
  let conquerorRecs = 0;    // capped at 1000 per table
  let transcenderRecs = 0;  // capped at 10000 per table

  for (let num = 1; num <= 30; num++) {
    const count = statsMap[num] || 0;
    totalRecitations += count;
  }

  // Count fully completed tables (12 to 30) for each rank
  let tablesFullyNovice = 0;
  let tablesFullyCommoner = 0;
  let tablesFullyElder = 0;
  let tablesFullyConqueror = 0;
  let tablesFullyTranscender = 0;

  for (let num = 12; num <= 30; num++) {
    const count = statsMap[num] || 0;
    
    noviceRecs += Math.min(count, 10);
    commonerRecs += Math.min(count, 100);
    elderRecs += Math.min(count, 500);
    conquerorRecs += Math.min(count, 1000);
    transcenderRecs += Math.min(count, 10000);

    if (count >= 10000) {
      tablesFullyTranscender++;
    } else if (count >= 1000) {
      tablesFullyConqueror++;
    } else if (count >= 500) {
      tablesFullyElder++;
    } else if (count >= 100) {
      tablesFullyCommoner++;
    } else if (count >= 10) {
      tablesFullyNovice++;
    }
  }

  return {
    totalRecitations,
    // progress totals (capped sums)
    noviceRecs,
    commonerRecs,
    elderRecs,
    conquerorRecs,
    transcenderRecs,
    // fully achieved table counts
    tablesFullyNovice,
    tablesFullyCommoner,
    tablesFullyElder,
    tablesFullyConqueror,
    tablesFullyTranscender,
    // 19 tables in total (12-30)
    masteredTables: tablesFullyNovice
  };
};

interface MedalShowcaseProps {
  badge: string;
  name: string;
  currentRecs: number;
  targetRecs: number;
  borderColor: string;
  bgColor: string;
  textColor: string;
  glow?: string;
  completedTables: number;
}

function MedalShowcaseCard({ badge, name, currentRecs, targetRecs, borderColor, bgColor, textColor, glow = "", completedTables }: MedalShowcaseProps) {
  const percent = Math.min(100, Math.max(0, (currentRecs / targetRecs) * 100));
  
  return (
    <div className={`p-5 rounded-2xl border ${borderColor} ${bgColor} ${glow} flex flex-col justify-between text-center transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden shadow-xl`}>
      <div className="flex flex-col items-center">
        <span className="text-4xl group-hover:scale-110 transition-transform duration-300 select-none">{badge}</span>
        <h4 className="text-sm font-black text-white uppercase tracking-wider mt-2.5">{name}</h4>
        
        {/* Recitations progress text */}
        <p className="text-xl font-black mt-2 text-white tracking-tighter">
          {currentRecs.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 tracking-normal">/ {targetRecs.toLocaleString()}</span>
        </p>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Recitations</span>
      </div>

      <div className="mt-4 space-y-2">
        {/* Sleek Progress Bar */}
        <div className="relative w-full h-2.5 bg-slate-950/80 rounded-full border border-white/5 overflow-hidden p-0.5 mt-1.5">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
          <span>{percent.toFixed(0)}% Done</span>
          <span className={`${textColor}`}>{completedTables} / 19 Tables</span>
        </div>
      </div>
    </div>
  );
}
