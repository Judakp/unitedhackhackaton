
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Side, DrawPoint, DebateSession, ChannelMessage } from './types';
import Toolbar from './components/Toolbar';
import { analyzeCanvas } from './services/geminiService';

const PRESET_TOPICS = [
  { a: "AI as a Tool", b: "AI as a Threat" },
  { a: "Remote Work", b: "Office Culture" },
  { a: "Privacy First", b: "Total Security" },
  { a: "Marvel Universe", b: "DC Universe" },
  { a: "Web3 Future", b: "Traditional Finance" }
];

const App: React.FC = () => {
  const [side, setSide] = useState<Side>(null);
  const [session, setSession] = useState<DebateSession>({
    id: 'global-debate',
    topicA: 'AI as a Tool',
    topicB: 'AI as a Threat'
  });
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isDrawing = useRef(false);

  // Initialize collaborative channel
  useEffect(() => {
    channelRef.current = new BroadcastChannel('pixel-debate-channel');
    channelRef.current.onmessage = (event) => {
      const msg: ChannelMessage = event.data;
      if (msg.type === 'DRAW') {
        drawOnCanvas(msg.data, false);
      } else if (msg.type === 'UPDATE_SESSION') {
        setSession(msg.data);
      } else if (msg.type === 'CLEAR_CANVAS') {
        performClear();
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, []);

  const drawOnCanvas = useCallback((point: DrawPoint, isLocal: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = point.color;
    ctx.lineWidth = point.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (point.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    } else if (point.type === 'move') {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    if (isLocal && channelRef.current) {
      channelRef.current.postMessage({ type: 'DRAW', data: point });
    }
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!side) return;
    isDrawing.current = true;
    const pos = getPos(e);
    
    // Constraint: Can only draw on your side
    if (side === 'LEFT' && pos.x > window.innerWidth / 2) return;
    if (side === 'RIGHT' && pos.x < window.innerWidth / 2) return;

    drawOnCanvas({
      x: pos.x,
      y: pos.y,
      color,
      width: brushSize,
      side,
      type: 'start',
      id: Math.random().toString(36).substr(2, 9)
    }, true);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !side) return;
    const pos = getPos(e);

    // Hard boundary constraint
    if (side === 'LEFT' && pos.x > window.innerWidth / 2 - 2) return;
    if (side === 'RIGHT' && pos.x < window.innerWidth / 2 + 2) return;

    drawOnCanvas({
      x: pos.x,
      y: pos.y,
      color,
      width: brushSize,
      side,
      type: 'move',
      id: Math.random().toString(36).substr(2, 9)
    }, true);
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const performClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx, canvas.width, canvas.height);
    }
  };

  const broadcastClear = () => {
    performClear();
    channelRef.current?.postMessage({ type: 'CLEAR_CANVAS' });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) drawGrid(ctx, canvas.width, canvas.height);
    }
  }, [side]);

  const handleAnalyze = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsAnalyzing(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const result = await analyzeCanvas(dataUrl, session.topicA, session.topicB);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Ensure Gemini API key is active.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateSession = (newSession: Partial<DebateSession>) => {
    const updated = { ...session, ...newSession };
    setSession(updated);
    channelRef.current?.postMessage({ type: 'UPDATE_SESSION', data: updated });
  };

  if (!side) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 px-4 overflow-y-auto">
        <div className="max-w-4xl w-full glass p-8 md:p-12 rounded-3xl text-center space-y-8 animate-in fade-in zoom-in duration-500 my-8">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
              PIXEL DEBATE
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-light">
              Collaborative visual discourse. Choose your camp.
            </p>
          </div>
          
          <div className="glass p-6 rounded-2xl border-purple-500/20 bg-purple-500/5 space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-purple-400 font-orbitron text-xs font-bold tracking-widest">DEBATE THEME</span>
              <button 
                onClick={() => setIsEditingTopic(!isEditingTopic)}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
              >
                <i className={`fa-solid ${isEditingTopic ? 'fa-check' : 'fa-pen-to-square'}`}></i>
                {isEditingTopic ? 'Done' : 'Customize'}
              </button>
            </div>

            {isEditingTopic ? (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="text-left space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Left Topic</label>
                  <input 
                    type="text" 
                    value={session.topicA}
                    onChange={(e) => updateSession({ topicA: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all"
                    placeholder="e.g. AI is helpful"
                  />
                </div>
                <div className="text-left space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Right Topic</label>
                  <input 
                    type="text" 
                    value={session.topicB}
                    onChange={(e) => updateSession({ topicB: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none transition-all"
                    placeholder="e.g. AI is scary"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-2 justify-center pt-2">
                  {PRESET_TOPICS.map((t, i) => (
                    <button 
                      key={i}
                      onClick={() => updateSession({ topicA: t.a, topicB: t.b })}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-tighter"
                    >
                      {t.a} vs {t.b}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-2">
                <span className="text-2xl font-bold text-rose-400">{session.topicA}</span>
                <span className="text-slate-600 font-orbitron italic">vs</span>
                <span className="text-2xl font-bold text-sky-400">{session.topicB}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-4">
            <button 
              onClick={() => { setSide('LEFT'); setColor('#f43f5e'); }}
              className="group p-8 rounded-2xl border-2 border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-left space-y-4"
            >
              <div className="w-12 h-12 rounded-lg bg-rose-500 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-fire"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-rose-400">JOIN SIDE A</h3>
                <p className="text-slate-300 text-sm opacity-80 uppercase tracking-widest font-orbitron">Draw for the left</p>
              </div>
            </button>

            <button 
              onClick={() => { setSide('RIGHT'); setColor('#0ea5e9'); }}
              className="group p-8 rounded-2xl border-2 border-sky-500/20 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 transition-all text-left space-y-4"
            >
              <div className="w-12 h-12 rounded-lg bg-sky-500 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-shield"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-sky-400">JOIN SIDE B</h3>
                <p className="text-slate-300 text-sm opacity-80 uppercase tracking-widest font-orbitron">Draw for the right</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden cursor-crosshair">
      {/* Background info */}
      <div className="absolute top-0 w-full flex justify-between px-10 py-6 pointer-events-none z-10">
        <div className="flex flex-col">
          <span className="text-rose-500 font-orbitron font-bold tracking-widest text-[10px] md:text-sm opacity-60">OPINION ALPHA</span>
          <h2 className="text-xl md:text-2xl font-bold text-white uppercase max-w-[40vw] truncate">{session.topicA}</h2>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-sky-500 font-orbitron font-bold tracking-widest text-[10px] md:text-sm opacity-60">OPINION BETA</span>
          <h2 className="text-xl md:text-2xl font-bold text-white uppercase max-w-[40vw] truncate">{session.topicB}</h2>
        </div>
      </div>

      <canvas 
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="bg-slate-950 touch-none"
      />

      <Toolbar 
        side={side}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onClear={broadcastClear}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Analysis Modal */}
      {analysisResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-3xl p-6 md:p-10 relative animate-in slide-in-from-bottom-10 duration-500">
            <button 
              onClick={() => setAnalysisResult(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-purple-400 font-orbitron font-bold tracking-tighter text-xl">
                <i className="fa-solid fa-brain"></i>
                GEMINI SOCIOLOGICAL SYNTHESIS
              </div>
              <div className="prose prose-invert prose-slate max-w-none text-slate-300">
                 {analysisResult.split('\n').map((line, i) => {
                   if (line.trim() === '') return <br key={i} />;
                   const isHeader = line.startsWith('#');
                   return (
                     <p key={i} className={isHeader ? 'text-white font-bold text-xl mt-6 first:mt-0' : 'mb-2'}>
                       {line.replace(/^#+\s/, '')}
                     </p>
                   );
                 })}
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button 
                onClick={() => setAnalysisResult(null)}
                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                BACK TO CANVAS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side HUD */}
      <div className={`fixed top-1/2 -translate-y-1/2 p-4 glass rounded-r-2xl border-l-4 ${side === 'LEFT' ? 'border-rose-500' : 'border-sky-500'}`}>
        <div className="flex flex-col items-center gap-2">
           <i className={`fa-solid ${side === 'LEFT' ? 'fa-fire text-rose-500' : 'fa-shield text-sky-500'} text-xl`}></i>
           <div className="h-20 w-1 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-1/2 w-full bg-slate-400 animate-pulse"></div>
           </div>
        </div>
      </div>

      <button 
        onClick={() => setSide(null)}
        className="fixed top-6 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-all z-20 flex items-center gap-2"
      >
        <i className="fa-solid fa-arrow-left"></i>
        RESELECT SIDE
      </button>
    </div>
  );
};

export default App;
