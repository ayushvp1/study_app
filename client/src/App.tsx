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

type PracticeTopic = {
  topic: string;
  totalQuestions: number;
  latestCreatedAt: string;
  questions: Array<{
    id: string;
    type: string;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    status: string;
    createdAt: string;
  }>;
};

const Practice = () => {
  const [topics, setTopics] = React.useState<PracticeTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedTopic, setExpandedTopic] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await client.api.questions.$get();
        if (!res.ok) return;
        const data = await res.json();
        const nextTopics = Array.isArray(data?.topics) ? data.topics : [];
        setTopics(nextTopics);
        setExpandedTopic(nextTopics[0]?.topic || null);
      } catch (error) {
        console.error("Failed to load practice topics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-300 font-bold">
        Loading practice topics...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-5xl font-black tracking-tighter text-white">
            Practice <span className="text-red-500">Library.</span>
          </h2>
          <p className="max-w-2xl text-lg text-slate-300 font-medium">
            Every generated bank now appears under its topic so you can open, review, and practice from one place.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 backdrop-blur-xl">
          <Sparkles size={18} className="text-red-400" />
          {topics.length} topic{topics.length === 1 ? "" : "s"} available
        </div>
      </div>

      {topics.length === 0 ? (
        <Card className="border-white/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/10 text-red-400">
              <BookOpen size={28} />
            </div>
            <p className="text-2xl font-black text-white">No practice topics yet</p>
            <p className="mt-2 text-slate-300 font-medium">
              Generate a question bank in Forge and it will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {topics.map((topic, index) => {
            const isExpanded = expandedTopic === topic.topic;

            return (
              <Card key={topic.topic} className="overflow-hidden border-white/10">
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : topic.topic)}
                  className="w-full text-left"
                >
                  <CardHeader className="border-b border-white/5 pb-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 text-red-400 border border-red-500/20">
                          <span className="text-lg font-black">{index + 1}</span>
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-3xl text-white">{topic.topic}</CardTitle>
                          <CardDescription className="text-slate-300">
                            {topic.totalQuestions} question{topic.totalQuestions === 1 ? "" : "s"} in this bank
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-start md:self-auto">
                        <div className="rounded-full bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 border border-white/10">
                          Updated {new Date(topic.latestCreatedAt).toLocaleDateString()}
                        </div>
                        <div className={`rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-6">
                    {topic.questions.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                                Q{questionIndex + 1}
                              </span>
                              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-300 border border-white/10">
                                {question.type}
                              </span>
                              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-300 border border-emerald-500/20">
                                {question.status}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-white leading-relaxed">{question.text}</p>
                          </div>
                        </div>

                        {question.options.length > 0 && (
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {question.options.map((option) => (
                              <div
                                key={option}
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                                  option === question.correctAnswer
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                    : "border-white/10 bg-white/5 text-slate-200"
                                }`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.options.length === 0 && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
                            Answer: {question.correctAnswer}
                          </div>
                        )}

                        {question.explanation && (
                          <p className="mt-4 text-sm font-medium text-slate-300">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/admin" element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={<Profile />} />
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
