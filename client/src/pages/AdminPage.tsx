import React, { useState, useEffect } from "react";
import { client } from "../lib/api";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select, SelectItem, CardDescription, Textarea } from "../components/ui/minimal";
import { Sparkles, BrainCircuit, Target, Users, Trash2, Edit2, Loader2, Save, X, Plus, PencilLine, FileText } from "lucide-react";

export function AdminPage() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("type1");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forge");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      const res = await client.api.admin.modules.$get();
      if (res.ok) {
        const data = await res.json();
        setModulesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    }
  };

  // Manual Entry State
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualQuestions, setManualQuestions] = useState<any[]>([
    { text: "", type: "type1", correctAnswer: "", options: ["", "", "", ""], explanation: "" }
  ]);

  const fetchUsers = async () => {
    try {
      const res = await client.api.admin.users.$get();
      if (res.ok) {
        const data = await res.json();
        setUsersList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
    if (activeTab === "library") {
      fetchModules();
    }
  }, [activeTab]);

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm("Delete this module and all its questions?")) return;
    try {
      const res = await client.api.admin.modules[":id"].$delete({ param: { id } });
      if (res.ok) fetchModules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditModule = async (id: string) => {
    setLoading(true);
    try {
      const res = await client.api.admin.modules[":id"].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setManualTitle(data.title);
        setManualContent(data.content || "");
        setManualQuestions(data.questions.map((q: any) => ({
          text: q.text,
          type: q.type,
          correctAnswer: q.correctAnswer,
          options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : ["", "", "", ""],
          explanation: q.explanation || ""
        })));
        setEditingModuleId(id);
        setActiveTab("manual");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load module for editing.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      const res = await client.api.admin.users[":id"].$delete({ param: { id } });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await client.api.admin.users[":id"].$patch({ 
        param: { id: editingUser.id },
        json: { name: editingUser.name, role: editingUser.role }
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return alert("Please enter a topic first!");
    setLoading(true);
    try {
      const res = await client.api.admin.generate.$post({ json: { topic, type } });
      if (res.ok) {
        alert("Questions generated successfully!");
        setTopic("");
      } else {
        alert("Failed to generate questions. Check logs.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to AI service.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualTitle) return alert("Module title is required!");
    setLoading(true);
    try {
      let res;
      if (editingModuleId) {
        res = await client.api.admin.modules[":id"].$patch({
          param: { id: editingModuleId },
          json: {
            title: manualTitle,
            content: manualContent,
            questions: manualQuestions.filter(q => q.text.trim())
          }
        });
      } else {
        res = await client.api.admin.manual.$post({
          json: {
            title: manualTitle,
            content: manualContent,
            questions: manualQuestions.filter(q => q.text.trim())
          }
        });
      }

      if (res.ok) {
        alert(editingModuleId ? "Module updated successfully!" : "Module and questions saved successfully!");
        setManualTitle("");
        setManualContent("");
        setManualQuestions([{ text: "", type: "type1", correctAnswer: "", options: ["", "", "", ""], explanation: "" }]);
        setEditingModuleId(null);
        if (editingModuleId) setActiveTab("library");
      } else {
        alert("Failed to save. Check server logs.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving module.");
    } finally {
      setLoading(false);
    }
  };

  const addManualQuestion = () => {
    setManualQuestions([...manualQuestions, { text: "", type: "type1", correctAnswer: "", options: ["", "", "", ""], explanation: "" }]);
  };

  const updateManualQuestion = (index: number, field: string, value: any) => {
    const updated = [...manualQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setManualQuestions(updated);
  };

  const updateManualOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...manualQuestions];
    const options = [...updated[qIndex].options];
    options[oIndex] = value;
    updated[qIndex].options = options;
    setManualQuestions(updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-5xl font-black tracking-tighter text-white">Admin <span className="text-red-600">Forge.</span></h2>
          <p className="text-lg text-slate-400 font-medium">Manage your modules and students with precision.</p>
        </div>
        
        <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl self-start md:self-auto">
          <button 
            onClick={() => setActiveTab("forge")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "forge" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            AI Forge
          </button>
          <button 
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "manual" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            Manual Craft
          </button>
          <button 
            onClick={() => setActiveTab("library")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "library" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            Library
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "users" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            Registry
          </button>
        </div>
      </div>

      {activeTab === "forge" ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                <Sparkles size={24} />
              </div>
              <CardTitle>AI Question Generator</CardTitle>
              <CardDescription>Specify your topic and the AI will craft structured questions for your students.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Subject Topic</Label>
                  <Input 
                    placeholder="e.g. Advanced Quantum Mechanics" 
                    value={topic} 
                    onChange={(e: any) => setTopic(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectItem value="type1">Multiple Choice (Premium)</SelectItem>
                    <SelectItem value="type2">Interactive True/False</SelectItem>
                    <SelectItem value="type3">Smart Short Answer</SelectItem>
                  </Select>
                </div>
                <Button onClick={handleGenerate} disabled={loading} className="w-full h-16 text-xl">
                  {loading ? "Forging Questions..." : "Generate Question Bank"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <StatCard icon={<BrainCircuit className="text-red-500" />} title="AI Capacity" value="98%" detail="Operational" />
            <StatCard icon={<Target className="text-red-500" />} title="Accuracy" value="99.4%" detail="Expert Verified" />
          </div>
        </div>
      ) : activeTab === "manual" ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <Card className="border-red-500/20">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <PencilLine size={24} />
                </div>
                {editingModuleId && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setEditingModuleId(null);
                      setManualTitle("");
                      setManualContent("");
                      setManualQuestions([{ text: "", type: "type1", correctAnswer: "", options: ["", "", "", ""], explanation: "" }]);
                      setActiveTab("library");
                    }}
                    className="text-slate-500 hover:text-white"
                  >
                    <X size={16} className="mr-2" /> Cancel Edit
                  </Button>
                )}
              </div>
              <CardTitle>{editingModuleId ? "Edit Module" : "Manual Module Creation"}</CardTitle>
              <CardDescription>
                {editingModuleId ? "Update your module details and questions." : "Hand-craft your educational content and specific assessment items."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Module Title</Label>
                  <Input 
                    placeholder="e.g. Intro to Architecture" 
                    value={manualTitle}
                    onChange={(e: any) => setManualTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Module Overview / Content</Label>
                  <Textarea 
                    placeholder="Describe the learning objectives or main content..."
                    value={manualContent}
                    onChange={(e: any) => setManualContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Question Items</h4>
                  <Button onClick={addManualQuestion} className="h-10 py-0 px-4 text-xs bg-slate-800 hover:bg-slate-700">
                    <Plus size={16} /> Add Question
                  </Button>
                </div>

                <div className="space-y-6">
                  {manualQuestions.map((q, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 relative group/q">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded">ITEM #{idx + 1}</span>
                        <Select value={q.type} onValueChange={(v) => updateManualQuestion(idx, 'type', v)}>
                          <SelectItem value="type1">Multiple Choice</SelectItem>
                          <SelectItem value="type2">True/False</SelectItem>
                          <SelectItem value="type3">Short Answer</SelectItem>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question Text</Label>
                          <Input 
                            placeholder="Enter the question..." 
                            value={q.text}
                            onChange={(e: any) => updateManualQuestion(idx, 'text', e.target.value)}
                          />
                        </div>

                        {q.type === 'type1' && (
                          <div className="grid grid-cols-2 gap-4">
                            {q.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="space-y-1">
                                <Label className="text-[10px]">Option {String.fromCharCode(65 + oIdx)}</Label>
                                <Input 
                                  value={opt}
                                  onChange={(e: any) => updateManualOption(idx, oIdx, e.target.value)}
                                  placeholder={`Option ${oIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Correct Answer</Label>
                            <Input 
                              placeholder="Must match one of the options for MCQs" 
                              value={q.correctAnswer}
                              onChange={(e: any) => updateManualQuestion(idx, 'correctAnswer', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Explanation (Optional)</Label>
                            <Input 
                              placeholder="Why is this answer correct?" 
                              value={q.explanation}
                              onChange={(e: any) => updateManualQuestion(idx, 'explanation', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleManualSubmit} disabled={loading} className="w-full h-16 text-xl">
                {loading ? "Saving Masterpiece..." : (editingModuleId ? "Update Module Content" : "Save Module & Registry")}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : activeTab === "library" ? (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
            <div>
              <CardTitle>Module Management</CardTitle>
              <CardDescription>View and remove study modules from the platform.</CardDescription>
            </div>
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
              <FileText size={24} />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              {modulesList.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-red-500/30 transition-all">
                  <div>
                    <h4 className="font-bold text-white">{mod.title}</h4>
                    <p className="text-xs text-slate-500">Created {new Date(mod.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditModule(mod.id)}
                      className="p-2 text-slate-500 hover:text-red-500 transition-all"
                      title="Edit Module"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-2 text-slate-500 hover:text-red-500 transition-all"
                      title="Delete Module"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {modulesList.length === 0 && (
                <div className="py-10 text-center text-slate-600 font-medium italic">
                  No modules found in library.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered students on the platform.</CardDescription>
            </div>
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
              <Users size={24} />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-500 px-4">Name</th>
                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-500 px-4">Email</th>
                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-500 px-4">Role</th>
                    <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-500 text-right px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4">
                        {editingUser?.id === user.id ? (
                          <Input 
                            value={editingUser.name} 
                            onChange={(e: any) => setEditingUser({...editingUser, name: e.target.value})} 
                            className="h-10 w-40" 
                          />
                        ) : (
                          <span className="font-bold text-slate-200">{user.name}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">{user.email}</td>
                      <td className="py-4 px-4">
                        {editingUser?.id === user.id ? (
                          <Select 
                            value={editingUser.role} 
                            onValueChange={(r: string) => setEditingUser({...editingUser, role: r})}
                          >
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {editingUser?.id === user.id ? (
                            <>
                              <button 
                                onClick={handleUpdateUser} 
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                                title="Save Changes"
                              >
                                <Save size={18} />
                              </button>
                              <button 
                                onClick={() => setEditingUser(null)} 
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors border border-white/5"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditingUser(user)} className="p-2 text-slate-500 hover:text-red-500 transition-all active:scale-90">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-500 hover:text-red-500 transition-all active:scale-90">
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-600 font-medium italic">
                        No students found in registry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, detail }: any) {
  return (
    <Card className="p-1">
      <CardContent className="p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-500/20">{icon}</div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{detail}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
