import React, { useState, useEffect } from "react";
import { client } from "../lib/api";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select, SelectItem, CardDescription } from "../components/ui/minimal";
import { Sparkles, BrainCircuit, Target, Users, Trash2, Edit2, Loader2, Save, X } from "lucide-react";

export function AdminPage() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("type1");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forge");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);

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
  }, [activeTab]);

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
            Questions
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "users" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            User Registry
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
