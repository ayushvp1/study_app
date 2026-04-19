import React, { useState, useEffect } from "react";
import { client } from "../lib/api";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "../components/ui/minimal";
import { BookOpen, ChevronDown, Sparkles, CheckCircle2, XCircle } from "lucide-react";

type PracticeTopic = {
  id: string;
  topic: string;
  content: string | null;
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

export function PracticePage() {
  const [topics, setTopics] = useState<PracticeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, { selected: string; isCorrect: boolean }>>({});

  const loadTopics = async () => {
    try {
      const res = await client.api.questions.$get();
      if (!res.ok) return;
      const data = await res.json();
      const nextTopics = Array.isArray(data?.topics) ? data.topics : [];
      setTopics(nextTopics);
      if (nextTopics.length > 0) {
        setExpandedTopic(nextTopics[0].id);
      }
    } catch (error) {
      console.error("Failed to load practice topics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleAttempt = async (questionId: string, answer: string, correctAnswer: string) => {
    if (attempts[questionId]) return; // Already attempted

    const normalizedAnswer = String(answer).toLowerCase().trim().replace(/,/g, "");
    const normalizedCorrect = String(correctAnswer).toLowerCase().trim().replace(/,/g, "");
    const isCorrect = normalizedAnswer === normalizedCorrect;

    setAttempts((prev) => ({
      ...prev,
      [questionId]: { selected: answer, isCorrect }
    }));

    try {
      await client.api.questions.attempt.$post({
        json: {
          questionId,
          answer,
          isCorrect
        }
      });
    } catch (error) {
      console.error("Failed to record attempt:", error);
    }
  };

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
            Master your knowledge by attempting questions. Your progress will be tracked on the dashboard.
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
            const isExpanded = expandedTopic === topic.id;

            return (
              <Card key={topic.id} className="overflow-hidden border-white/10">
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
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
                    {topic.content && (
                      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5 text-slate-300 italic">
                        {topic.content}
                      </div>
                    )}
                    {topic.questions.map((question, questionIndex) => {
                      const attempt = attempts[question.id];
                      return (
                        <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                                  Q{questionIndex + 1}
                                </span>
                                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-300 border border-white/10">
                                  {question.type}
                                </span>
                              </div>
                              <p className="text-lg font-bold text-white leading-relaxed">{question.text}</p>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            {question.options.length > 0 ? (
                              question.options.map((option) => {
                                const isSelected = attempt?.selected === option;
                                const isCorrect = option === question.correctAnswer;
                                let borderColor = "border-white/10";
                                let bgColor = "bg-white/5";
                                let textColor = "text-slate-200";

                                if (attempt) {
                                  if (isCorrect) {
                                    borderColor = "border-emerald-500/50";
                                    bgColor = "bg-emerald-500/10";
                                    textColor = "text-emerald-400";
                                  } else if (isSelected) {
                                    borderColor = "border-red-500/50";
                                    bgColor = "bg-red-500/10";
                                    textColor = "text-red-400";
                                  }
                                }

                                return (
                                  <button
                                    key={option}
                                    disabled={!!attempt}
                                    onClick={() => handleAttempt(question.id, option, question.correctAnswer)}
                                    className={`text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${borderColor} ${bgColor} ${textColor} ${!attempt ? "hover:border-red-500/50 hover:bg-white/10" : "cursor-default"}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      {option}
                                      {attempt && isCorrect && <CheckCircle2 size={16} />}
                                      {attempt && isSelected && !isCorrect && <XCircle size={16} />}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="col-span-2 space-y-3">
                                {!attempt ? (
                                  <div className="flex gap-2">
                                    <Input 
                                      id={`ans-${question.id}`}
                                      placeholder="Type your answer..."
                                      className="flex-1"
                                    />
                                    <Button 
                                      onClick={() => {
                                        const val = (document.getElementById(`ans-${question.id}`) as HTMLInputElement)?.value;
                                        if (val) handleAttempt(question.id, val, question.correctAnswer);
                                      }}
                                    >
                                      Submit
                                    </Button>
                                  </div>
                                ) : (
                                  <div className={`p-4 rounded-xl border ${attempt.isCorrect ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                                    <p className="font-bold">Your Answer: {attempt.selected}</p>
                                    <p className="text-sm mt-1">Correct Answer: {question.correctAnswer}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {attempt && (
                            <div className="animate-in slide-in-from-top-2 duration-500">
                              <div className="h-px bg-white/10 my-4" />
                              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <h5 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Explanation</h5>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed">
                                  {question.explanation || "No explanation provided."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
