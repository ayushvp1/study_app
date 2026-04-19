export const Button = ({ children, className = "", ...props }: any) => {
  const hasCustomBg = className.includes('bg-');
  const defaultBase = "relative isolate overflow-hidden px-6 py-3 rounded-xl font-bold active:scale-[0.98] transition-all duration-300 shadow-xl border border-white/10 group cursor-pointer";
  const colorBase = hasCustomBg ? "" : "bg-red-600 text-white hover:bg-red-500 shadow-red-900/20";
  
  return (
    <button 
      {...props} 
      className={`${defaultBase} ${colorBase} ${className}`}
    >
      <div className="flex items-center justify-center gap-2 relative z-10">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export const Card = ({ children, className = "" }: any) => (
  <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }: any) => (
  <div className={`p-6 pb-2 space-y-1.5 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "" }: any) => (
  <h3 className={`text-2xl font-black tracking-tight text-white ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = "" }: any) => (
  <p className="text-sm font-medium text-slate-400 leading-relaxed">
    {children}
  </p>
);

export const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-6 pt-2 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "" }: any) => (
  <div className={`p-6 pt-0 flex flex-col gap-4 ${className}`}>
    {children}
  </div>
);

export const Input = ({ className = "", ...props }: any) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-500 font-medium text-white shadow-inner ${className}`} 
  />
);

export const Label = ({ children, htmlFor, className = "" }: any) => (
  <label 
    htmlFor={htmlFor} 
    className={`text-xs font-black text-slate-400 ml-0.5 uppercase tracking-widest ${className}`}
  >
    {children}
  </label>
);

export const Select = ({ children, value, onValueChange }: any) => (
  <div className="relative group">
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)} 
      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-white appearance-none cursor-pointer shadow-inner"
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-red-500 transition-colors">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
);

export const SelectItem = ({ value, children }: any) => (
  <option value={value} className="bg-slate-900 text-white font-medium py-2">
    {children}
  </option>
);
