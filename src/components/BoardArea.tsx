import React from 'react';
import { useGameStore } from '../store';
import { cn } from '../lib/utils';
import { BIO_ENTITIES } from '../data/entities';
import { motion, AnimatePresence } from 'motion/react';

export const BoardArea: React.FC = () => {
  const board = useGameStore((state) => state.board);
  const zones = useGameStore((state) => state.zones);
  const selectedInventoryItem = useGameStore((state) => state.selectedInventoryItem);
  const placeEntity = useGameStore((state) => state.placeEntity);
  const placedEntities = Object.values(useGameStore((state) => state.placedEntities));
  const activeDisasters = useGameStore((state) => state.activeDisasters);
  const resolvedDisasters = useGameStore((state) => state.resolvedDisasters);

  const spreadWarnings: {x: number, y: number}[] = [];
  board.forEach(row => row.forEach(cell => {
     if (cell.type === 'POLLUTION' && cell.spreadTarget) {
        spreadWarnings.push(cell.spreadTarget);
     }
  }));

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 min-h-0">
      <div 
        className={cn(
          "relative grid bg-stone-400 border-[3px] border-stone-500 rounded-xl shadow-2xl gap-[2px] p-[2px] overflow-hidden",
          selectedInventoryItem ? "cursor-crosshair" : ""
        )}
        style={{
          gridTemplateColumns: `repeat(12, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(8, minmax(0, 1fr))`,
          width: '100%',
          maxHeight: '100%',
          aspectRatio: '12/8'
        }}
      >
        {/* Cell Grid */}
        {board.map((row, y) =>
          row.map((cell, x) => {
            const zone = zones[cell.zoneId];
            return (
              <div
                key={`${x}-${y}`}
                onClick={() => placeEntity(x, y)}
                style={{
                  gridColumnStart: x + 1,
                  gridRowStart: y + 1,
                }}
                className={cn(
                  'w-full h-full flex items-center justify-center text-[10px] transition-colors duration-300 relative',
                  zone?.colorClass || 'bg-stone-50', // base zone color
                  cell.isTourism ? 'ring-inset ring-[3px] ring-orange-400/80 bg-orange-100 z-10' : '',
                  selectedInventoryItem && cell.type === 'EMPTY' ? 'hover:bg-emerald-300/60 transition-none cursor-crosshair' : 'text-stone-400/50',
                  cell.type === 'POLLUTION' ? 'bg-purple-900 overflow-hidden text-purple-200 shadow-inner' : ''
                )}
                title={`${zone?.name} (${x}, ${y})`}
              >
                {cell.isTourism && cell.type === 'EMPTY' && (
                   <span className="absolute inset-x-0 bottom-1 text-[8px] text-orange-600 font-bold opacity-80 pointer-events-none drop-shadow-sm text-center">旅游区</span>
                )}
                {cell.type === 'POLLUTION' && (
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-800 to-stone-900 opacity-90 border border-purple-500/50"></div>
                )}
                <span className="opacity-30 select-none relative z-10 font-bold pointer-events-none drop-shadow-sm flex items-center justify-center">
                  {cell.type === 'POLLUTION' ? '☢️' : `${x},${y}`}
                </span>
              </div>
            );
          })
        )}

        {/* Spread Warnings */}
        {spreadWarnings.map((target, idx) => (
          <div
            key={`sw-${idx}`}
            className="pointer-events-none relative z-[15] bg-purple-500/50 animate-pulse border-2 border-purple-400 border-dashed m-[1px]"
            style={{
              gridColumnStart: target.x + 1,
              gridRowStart: target.y + 1,
            }}
          >
             <div className="absolute inset-0 flex items-center justify-center text-purple-200 opacity-80 text-xl font-bold">☠️</div>
          </div>
        ))}

        {/* Disaster Overlays */}
        {activeDisasters.map(d => {
           let filledCount = 0;
           for (let dy = 0; dy < d.areaHeight; dy++) {
              for (let dx = 0; dx < d.areaWidth; dx++) {
                 const cx = d.x + dx;
                 const cy = d.y + dy;
                 if (cy >= 0 && cy < board.length && cx >= 0 && cx < (board[0] || []).length) {
                    const cell = board[cy][cx];
                    if (cell.type === 'BIO' && cell.entityId) {
                       const ent = placedEntities.find(e => e.id === cell.entityId);
                       if (ent && d.validGridDefIds.includes(ent.gridDefId)) {
                          filledCount++;
                       }
                    }
                 }
              }
           }
           
           return (
              <div
                 key={d.id}
                 className="pointer-events-none z-10 border-[4px] min-[400px]:border-[3px] border-red-500/90 rounded-md shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse bg-red-500/10"
                 style={{
                    gridColumnStart: d.x + 1,
                    gridColumnEnd: d.x + 1 + d.areaWidth,
                    gridRowStart: d.y + 1,
                    gridRowEnd: d.y + 1 + d.areaHeight
                 }}
              >
                 <div className="absolute -top-7 left-0 bg-red-600 text-white font-bold text-xs px-2 py-1 rounded shadow text-nowrap select-none overflow-visible">
                    ⚠️ {d.name} <span className="opacity-80 font-normal">({filledCount}/{d.areaWidth * d.areaHeight})</span>
                 </div>
              </div>
           );
        })}

        {/* Placed Entities Overlay */}
        <AnimatePresence>
          {placedEntities.map((entity) => {
            const config = BIO_ENTITIES[entity.gridDefId];

            return (
              <motion.div
                key={entity.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ 
                  gridColumnStart: entity.originX + 1,
                  gridColumnEnd: entity.originX + 1 + entity.width,
                  gridRowStart: entity.originY + 1,
                  gridRowEnd: entity.originY + 1 + entity.height,
                  zIndex: 20
                }}
                className={cn(
                  "rounded-md shadow-lg flex items-center justify-center flex-col text-center border-2 pointer-events-none m-[1px]",
                  config?.colorClass || "bg-stone-800 text-white border-stone-900"
                )}
              >
                <div className="font-bold sm:text-sm text-xs leading-none drop-shadow-md pb-0.5">{entity.speciesType}</div>
                <div className="text-[9px] sm:text-[10px] opacity-80 font-mono tracking-tighter bg-black/20 px-1.5 py-0.5 rounded-full mt-0.5">HP: {entity.health}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Resolved Disasters Pre-allocated Image Overlay */}
        <AnimatePresence>
           {resolvedDisasters?.map((d) => (
               <motion.div
                 key={d.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 style={{ 
                   gridColumnStart: d.x + 1,
                   gridColumnEnd: d.x + 1 + d.areaWidth,
                   gridRowStart: d.y + 1,
                   gridRowEnd: d.y + 1 + d.areaHeight,
                   zIndex: 25
                 }}
                 className="rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] pointer-events-none m-[1px] border-2 border-emerald-400 overflow-hidden relative"
               >
                  <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-[2px]" />
                  <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-white/90 font-black tracking-widest uppercase text-xl leading-none drop-shadow-md z-10" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                     <div className="flex flex-col items-center justify-center">
                        <span className="text-sm opacity-80 font-bold tracking-widest font-mono text-emerald-200 mb-1 inline-flex items-center gap-1">✅ 保护区建立</span>
                        {d.name.split('：')[1] || d.targetSpecies}
                        <span className="text-[10px] font-medium opacity-60 mt-1 block px-2 leading-tight">永久免疫污染<br/>(此处预留真实物种照片替换)</span>
                     </div>
                  </div>
                  {/* Image placeholder slot */}
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none" />
               </motion.div>
           ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
