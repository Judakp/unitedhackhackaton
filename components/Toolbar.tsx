
import React from 'react';

interface ToolbarProps {
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  side: 'LEFT' | 'RIGHT' | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  color, setColor, brushSize, setBrushSize, onClear, onAnalyze, isAnalyzing, side 
}) => {
  const colors = side === 'LEFT' 
    ? ['#f43f5e', '#fb7185', '#fda4af', '#ffffff'] 
    : ['#0ea5e9', '#38bdf8', '#7dd3fc', '#ffffff'];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl z-50">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Brush</span>
        <div className="flex gap-2">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="h-10 w-[1px] bg-slate-700" />

      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Size</span>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={brushSize} 
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-24 accent-slate-200"
        />
      </div>

      <div className="h-10 w-[1px] bg-slate-700" />

      <div className="flex gap-3">
        <button 
          onClick={onClear}
          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors group"
          title="Clear My Session"
        >
          <i className="fa-solid fa-trash-can group-hover:text-red-400"></i>
        </button>
        
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold font-orbitron text-sm transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ANALYZING...
            </>
          ) : (
            <>
              <i className="fa-solid fa-microchip"></i>
              ANALYZE DEBATE
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
