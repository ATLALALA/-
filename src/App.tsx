import { useEffect } from 'react';
import { useGameStore } from './store';
import { BoardArea } from './components/BoardArea';
import { PlayerHUD } from './components/PlayerHUD';
import { BuildingSlotsArea } from './components/BuildingSlotsArea';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { turn, phase, funds, nextPhase, gameStatus, activeDisasters, resolvedDisasters, activeModal, closeModal, board, placedEntities } = useGameStore();

  useEffect(() => {
    if (useGameStore.getState().turn === 0) {
      useGameStore.getState().nextPhase();
    }
  }, []);

  useEffect(() => {
    if (phase !== 'ACTION' && gameStatus === 'PLAYING' && !activeModal) {
      const timer = setTimeout(() => {
        useGameStore.getState().nextPhase();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, gameStatus, activeModal]);

  const phaseNames: Record<string, string> = {
    'EVENT': '事件阶段', 'SETTLEMENT': '结算阶段', 'DRAW': '发卡阶段', 'ACTION': '行动阶段', 'SPREAD': '扩散阶段'
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F7F9F7] font-sans text-stone-800">
      {/* Top Navigation Bar */}
      <header className="h-14 shrink-0 bg-stone-900 text-stone-100 flex items-center justify-between px-6 shadow-md z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌊</span>
          <h1 className="text-xl font-bold tracking-wider font-serif">海洋保护区<span className="text-emerald-400 ml-2 text-sm italic opacity-80">玉环生态版</span></h1>
        </div>
        
        <div className="flex items-center gap-8 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-xs">TURN</span>
            <span className="text-xl font-bold text-white">{turn}</span>
          </div>
          <div className="flex items-center space-x-1 bg-stone-800 px-4 py-1.5 rounded-full border border-stone-700 shadow-inner">
            <span className={cn("font-bold tracking-wider text-xs transition-colors", phase === 'ACTION' ? 'text-emerald-400' : 'text-stone-300')}>
               {phaseNames[phase] || phase}
               {phase !== 'ACTION' && <span className="ml-2 animate-pulse">...</span>}
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-row overflow-hidden relative bg-stone-100/50">
        
        {/* Left Panel: Active Crisis Targets */}
        <div className="w-44 bg-stone-100/80 border-r border-stone-200 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10 flex flex-col overflow-hidden">
          <div className="h-10 bg-red-900/10 flex items-center justify-center border-b border-red-900/20 text-xs font-bold text-red-900 tracking-widest shrink-0 shadow-sm">
            危机目标
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
             {(() => {
                const allDisasters = [...activeDisasters, ...(resolvedDisasters || [])];
                const enrichedDisasters = allDisasters.map(d => {
                  let filledCount = 0;
                  const reqCounts: Record<string, number> = {};
                  // statically calculate for UI
                  for (let dy = 0; dy < d.areaHeight; dy++) {
                     for (let dx = 0; dx < d.areaWidth; dx++) {
                        const cx = d.x + dx;
                        const cy = d.y + dy;
                        if (cy >= 0 && cy < board.length && cx >= 0 && cx < (board[0] || []).length) {
                           const cell = board[cy][cx];
                           if (cell.type === 'BIO' && cell.entityId) {
                              const ent = Object.values(placedEntities).find(e => e.id === cell.entityId);
                              if (ent && d.validGridDefIds.includes(ent.gridDefId)) {
                                 filledCount++;
                                 reqCounts[ent.gridDefId] = (reqCounts[ent.gridDefId] || 0) + 1;
                              }
                           }
                        }
                     }
                  }
                  const maxCells = d.areaWidth * d.areaHeight;
                  let reqsMet = true;
                  if (d.requirements) {
                     for (const req of d.requirements) {
                         if ((reqCounts[req.gridDefId] || 0) < req.minCount) reqsMet = false;
                     }
                  }
                  
                  return { ...d, filledCount, currentReqCounts: reqCounts, maxCells, isCompleted: d.isCompleted || (filledCount >= maxCells && reqsMet) };
                });

                // Sort: incomplete first, then by creation (reverse order since newer is appended)
                enrichedDisasters.sort((a, b) => {
                   if (a.isCompleted !== b.isCompleted) {
                      return a.isCompleted ? 1 : -1; // Complete goes down
                   }
                   return b.id.localeCompare(a.id); // Newer goes up
                });

                if (enrichedDisasters.length === 0) {
                   return <div className="text-[10px] text-stone-400 text-center py-4 px-2 font-mono border border-dashed border-stone-200 rounded">暂无活跃危机</div>;
                }

                return enrichedDisasters.map(d => (
                  <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.9 }} 
                     animate={{ opacity: 1, scale: 1 }} 
                     key={d.id} 
                     onClick={() => {
                        useGameStore.getState().openModal(`⚠️ 危机：${d.name}`, d.scienceText, 'EVENT');
                     }}
                     className={cn(
                        "p-3 rounded-xl shadow-md border relative overflow-hidden transition-colors duration-500 cursor-pointer hover:shadow-lg",
                        d.isCompleted 
                           ? "bg-slate-50 border-emerald-200 shadow-sm grayscale-[0.2] opacity-90 hover:border-emerald-300" 
                           : "bg-[#FCFDFB] border-red-200 shadow-red-900/10 hover:border-red-300"
                     )}
                   >
                     {d.isCompleted && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
                     {!d.isCompleted && <div className="absolute top-0 right-0 w-12 h-12 bg-red-100 rounded-bl-full -z-10 opacity-30 pointer-events-none"></div>}
                     <div className={cn(
                        "font-bold mb-1.5 leading-tight flex flex-col gap-1.5",
                        d.isCompleted ? "text-emerald-700" : "text-red-800"
                     )}>
                         <span className={cn("text-xs border-b pb-0.5", d.isCompleted ? "border-emerald-200" : "border-red-100")}>{d.name}</span>
                         <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded shadow-sm self-start inline-block",
                            d.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                         )}>
                            {d.zoneId === 'coastal' ? '陆海：海岸带' : d.zoneId === 'shallow_sea' ? '潮间：浅海滩' : '潮下：深海区'}
                         </span>
                     </div>
                     <div className={cn("text-[10px] font-mono mb-2 p-1.5 rounded", d.isCompleted ? "text-emerald-700 bg-emerald-50" : "text-stone-600 bg-stone-50")}>
                        需: <span className={cn("font-bold", d.isCompleted ? "text-emerald-700" : "text-red-600")}>{d.targetSpecies}</span> <br/>
                        <ul>
                           {d.requirements && d.requirements.map(req => (
                              <li key={req.gridDefId} className="flex justify-between border-b border-black/5 last:border-0 py-0.5">
                                 <span>{req.name}</span>
                                 <span className={cn("font-bold", (d.currentReqCounts[req.gridDefId] || 0) >= req.minCount ? "text-emerald-600" : "text-stone-500")}>
                                    {(d.currentReqCounts[req.gridDefId] || 0)} / {req.minCount}格
                                 </span>
                              </li>
                           ))}
                        </ul>
                        <div className="flex justify-between mt-1 pt-1 border-t border-black/10 font-bold">
                           <span>格子填充进度:</span>
                           <span>{d.filledCount} / {d.maxCells}</span>
                        </div>
                     </div>
                     <div className={cn("w-full h-1.5 rounded-full overflow-hidden shadow-inner", d.isCompleted ? "bg-emerald-100" : "bg-stone-200")}>
                        <div className={cn("h-full transition-all duration-500", d.isCompleted ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${Math.min((d.filledCount / d.maxCells) * 100, 100)}%` }}></div>
                     </div>
                  </motion.div>
                ));
             })()}
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <header className="absolute top-4 right-8 flex gap-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FDF2E9] border border-stone-200 rounded-sm shadow-sm"></div>
              <span className="text-xs text-stone-500 font-bold">海岸过渡带</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E0F2F1] border border-stone-200 rounded-sm shadow-sm"></div>
              <span className="text-xs text-stone-500 font-bold">浅海活动区</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#B2EBF2] border border-stone-200 rounded-sm shadow-sm"></div>
              <span className="text-xs text-stone-500 font-bold">深海保护区</span>
            </div>
          </header>

          <BoardArea />

          {/* Game Over Screen */}
          {gameStatus !== 'PLAYING' && (
            <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-8">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#FCFDFB] p-10 rounded-2xl shadow-2xl border-4 border-stone-100 flex flex-col items-center justify-center max-w-lg text-center">
                    <h2 className={cn("text-5xl font-black mb-4 font-serif italic tracking-tight drop-shadow-sm", gameStatus === 'VICTORY' ? 'text-emerald-600' : 'text-purple-800')}>
                        {gameStatus === 'VICTORY' ? '生态复苏' : '污染吞噬'}
                    </h2>
                    <p className="text-stone-600 font-mono text-sm leading-relaxed mb-8 bg-stone-100 p-4 rounded-xl border border-stone-200 shadow-inner">
                        {gameStatus === 'VICTORY' ? 'VICTORY! 你成功处理了所有危机，或者带领生物群落占领了整个海湾，玉环海洋生态恢复了生机！' : 'DEFEAT... 生态空间已经耗尽，且污染的区域超过了生物所能占据的区域。海洋生态系统瓦解。'}
                    </p>
                    <button 
                        className={cn(
                            "px-8 py-3 w-full text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-lg cursor-pointer",
                            gameStatus === 'VICTORY' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-purple-800 hover:bg-purple-900"
                        )}
                        onClick={() => window.location.reload()}
                    >
                        重新开始
                    </button>
                  </motion.div>
                </motion.div>
            </AnimatePresence>
          )}

          {/* Science Modal Component */}
          {activeModal && (
            <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-8">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#FCFDFB] p-6 rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full relative">
                    <button 
                      onClick={closeModal}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                    <h3 className={cn(
                        "text-xl font-bold mb-4 flex items-center gap-2 pr-8",
                        activeModal.type === 'EVENT' ? 'text-red-700' : 'text-emerald-700'
                    )}>
                      {activeModal.title}
                    </h3>
                    <div className="text-sm text-stone-600 leading-relaxed font-serif bg-stone-50 p-4 rounded-xl border border-stone-100 shadow-inner whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                      {activeModal.images && activeModal.images.length > 0 && (
                         <div className="flex flex-col gap-3 mb-4">
                            {activeModal.images.map((img, i) => (
                               <img key={i} src={img} alt={`插图 ${i+1}`} referrerPolicy="no-referrer" className="w-full h-auto rounded shadow object-cover" />
                            ))}
                         </div>
                      )}
                      {activeModal.content}
                    </div>
                    <button
                      onClick={closeModal}
                      className="mt-6 w-full py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-900 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      继续
                    </button>
                  </motion.div>
                </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Building Slots - Right Side Panel */}
        <div className="w-48 bg-stone-100/80 border-l border-stone-200 shrink-0 shadow-inner z-10">
           <BuildingSlotsArea />
        </div>
      </main>

      {/* Player HUD - Bottom Bar */}
      <PlayerHUD />
    </div>
  );
}
