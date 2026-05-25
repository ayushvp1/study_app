import React, { useState, useEffect, useRef } from "react";
import { client } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Button, Card, CardContent, Input } from "../components/ui/minimal";
import { Send, User as UserIcon, Shield, Search, MoreVertical, Paperclip, Smile, Loader2, X, Image as ImageIcon } from "lucide-react";
import type { Message } from "shared";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🚀", "🎓", "📚"];

export function MessengerPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null); // For admin, it's studentId; for student, it's just one view
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchMessages();
    if (isAdmin) {
      fetchStudents();
    } else {
      setSelectedChat("admin");
    }
    
    // Simple polling for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChat]);

  const fetchMessages = async () => {
    try {
      const res = await client.api.messages.$get();
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await client.api.messages.students.$get();
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (data.length > 0 && !selectedChat) {
          setSelectedChat("broadcast");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Improved Routing: If admin, send to selected student. If student, try to reply to the last admin who messaged.
      let receiverId = isAdmin ? (selectedChat === "broadcast" ? null : selectedChat) : null;
      
      if (!isAdmin) {
        // Students find the most recent message from an admin to reply to them directly
        const lastAdminMsg = [...messages].reverse().find(m => m.sender?.role === 'admin');
        if (lastAdminMsg) receiverId = lastAdminMsg.senderId;
      }

      const res = await client.api.messages.$post({
        json: {
          receiverId,
          content: newMessage
        }
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (isAdmin) {
      if (selectedChat === "broadcast") return !msg.receiverId;
      return msg.senderId === selectedChat || msg.receiverId === selectedChat;
    } else {
      // Students see messages where they are receiver OR messages from admins to "everyone" (receiverId: null)
      // Also messages they sent
      return !msg.receiverId || msg.senderId === user?.id || msg.receiverId === user?.id;
    }
  });

  if (loading && messages.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-700">
      {/* Sidebar for Admin */}
      {isAdmin && (
        <div className="w-full md:w-80 flex flex-col gap-4 h-full">
          <Card className="flex-1 overflow-hidden flex flex-col p-0 border-white/5">
             <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-black text-white">Registry</h3>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search students..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto">
                <button 
                  onClick={() => setSelectedChat("broadcast")}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all border-l-4 ${selectedChat === "broadcast" ? "border-red-600 bg-red-600/5" : "border-transparent"}`}
                >
                  <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-red-900/20">ALL</div>
                  <div className="text-left">
                    <p className="font-bold text-white">Global Broadcast</p>
                    <p className="text-xs text-slate-500">To all students</p>
                  </div>
                </button>
                {students.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedChat(s.id)}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all border-l-4 ${selectedChat === s.id ? "border-red-600 bg-red-600/5" : "border-transparent"}`}
                  >
                    <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      <UserIcon size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-xs text-emerald-500 font-medium">{s.phone || "No Number"}</p>
                    </div>
                  </button>
                ))}
             </div>
          </Card>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col gap-4 h-full">
        <Card className="flex-1 overflow-hidden flex flex-col p-0 border-white/5">
           {/* Chat Header */}
           <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900 shadow-xl z-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                    {isAdmin ? (selectedChat === "broadcast" ? <Shield className="text-red-500" size={20}/> : <UserIcon className="text-slate-400" size={20}/>) : <Shield className="text-red-500" size={20}/>}
                 </div>
                 <div>
                    <h4 className="font-bold text-white uppercase tracking-tight">
                      {isAdmin ? (selectedChat === "broadcast" ? "Broadcast Station" : students.find(s => s.id === selectedChat)?.name || "Lobby") : "Academic Support"}
                    </h4>
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] animate-pulse">Connection Stable</p>
                 </div>
              </div>
              <button className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all"><MoreVertical size={20}/></button>
           </div>

           {/* Messages List */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40 relative">
              <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
              <div className="flex flex-col gap-3 relative z-10">
                 {filteredMessages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                         <div className={`max-w-[75%] p-4 rounded-2xl text-sm relative transition-all ${
                            isOwn 
                              ? "bg-red-600 text-white rounded-tr-none shadow-2xl shadow-red-900/40" 
                              : "bg-slate-800/80 backdrop-blur-md text-slate-200 rounded-tl-none border border-white/10"
                         }`}>
                            {!isOwn && (
                               <p className="text-[10px] font-black text-red-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                                  {msg.sender?.name}
                                  {msg.sender?.role === 'admin' && <Shield size={10} className="fill-red-500" />}
                               </p>
                            )}
                            <p className="font-medium leading-relaxed">{msg.content}</p>
                            <p className={`text-[9px] mt-2 text-right font-black uppercase tracking-widest opacity-60`}>
                               {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                      </div>
                    );
                 })}
                 {filteredMessages.length === 0 && (
                    <div className="h-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                          <Send size={24} className="text-slate-500 rotate-12" />
                       </div>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting transmission...</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="p-4 bg-slate-900 border-t border-white/5 relative">
              {showEmojis && (
                <div className="absolute bottom-full left-4 mb-2 p-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl flex gap-2 animate-in slide-in-from-bottom-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => {setNewMessage(prev => prev + e); setShowEmojis(false)}} className="hover:scale-125 transition-transform text-xl">{e}</button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={(e) => {
                     if (e.target.files?.[0]) {
                       setNewMessage(`[Attachment: ${e.target.files[0].name}]`);
                     }
                   }}
                 />
                 <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                 >
                    <Paperclip size={20}/>
                 </button>
                 <div className="flex-1 relative group">
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isAdmin ? "Type your command..." : "Ask for assistance..."} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-red-500/50 transition-all text-white font-medium shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowEmojis(!showEmojis)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${showEmojis ? "text-red-500" : "text-slate-500 hover:text-red-500"}`}
                    >
                       <Smile size={20}/>
                    </button>
                 </div>
                 <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-900/60 disabled:opacity-50 disabled:scale-100 disabled:shadow-none border border-white/10"
                 >
                    <Send size={22} className="relative left-0.5" />
                 </button>
              </form>
           </div>
        </Card>
      </div>
    </div>
  );
}
