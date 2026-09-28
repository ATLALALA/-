import React from 'react';
import { useGameStore } from '../store';
import { CardView } from './CardView';
import { BIO_ENTITIES } from '../data/entities';
import { AnimatePresence } from 'motion/react';

export const PlayerHUD: React.FC = () => {
    const { hand, deck, discardPile, inventory, phase, funds, playCard, nextPhase, selectedInventoryItem, selectInventoryItem, turn, board, placedEntities } = useGameStore();

    const isActionPhase = phase === 'ACTION';

    let tourismIncome = 0;
    Object.values(placedEntities).forEach(entity => {
       let inTourism = false;
       for (let y = 0; y < entity.height; y++) {
           for (let x = 0; x < entity.width; x++) {
               const cx = entity.originX + x;
               const cy = entity.originY + y;
               if (cx >= 0 && cx < (board[0]?.length || 0) && cy >= 0 && cy < board.length) {
                   if (board[cy][cx].isTourism) {
                       inTourism = true;
                   }
               }
           }
       }
       if (inTourism) {
           tourismIncome += 1;
       }
    });

    const nextSettlementTurn = (phase === 'EVENT' || phase === 'SETTLEMENT') ? turn : turn + 1;
    const baseIncome = nextSettlementTurn <= 2 ? 4 : 2;
    const projectedIncome = baseIncome + tourismIncome;

    return (
        <div className="h-44 w-full bg-[#FCFDFB] border-t border-stone-200 p-2 sm:p-3 flex gap-2 sm:gap-4 items-end shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-20">
            <div className="w-28 sm:w-36 lg:w-48 bg-stone-50 rounded-xl border border-stone-200 h-full p-2 sm:p-3 flex flex-col items-center shadow-inner overflow-hidden shrink-0">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 shrink-0">生物库存 ({inventory.length})</span>
                <div className="w-full flex-1 overflow-y-auto flex flex-wrap gap-1.5 content-start hide-scrollbar pt-1">
                    {inventory.length === 0 && (
                        <span className="text-[10px] text-stone-400 text-center w-full mt-2 bg-white p-2 rounded border border-dashed border-stone-200">库存为空</span>
                    )}
                    {inventory.map(grid => {
                        const config = BIO_ENTITIES[grid.gridDefId];
                        const isSelected = selectedInventoryItem === grid.id;
                        return (
                            <div 
                                key={grid.id} 
                                onClick={() => isActionPhase && selectInventoryItem(isSelected ? null : grid.id)}
                                className={`text-[10px] px-2 py-1 rounded font-bold border shadow-sm flex items-center gap-1 transition-transform ${isActionPhase ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-60'} ${isSelected ? 'ring-2 ring-emerald-500 scale-105' : ''} ${config?.colorClass || 'bg-stone-100 text-stone-700 border-stone-300'}`}
                            >
                                {grid.speciesType} <span className="opacity-50 font-mono">[{grid.width}x{grid.height}]</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex gap-0 overflow-visible px-2 sm:px-4 items-center h-full hide-scrollbar border-x border-stone-100 relative pt-4 pb-2 justify-center" style={{ perspective: "1000px" }}>
                {hand.length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 font-mono text-sm opacity-60">
                        暂无手牌，等待 DRAW 抽卡阶段...
                    </div>
                )}
                <AnimatePresence mode="popLayout">
                    {hand.map((card, i) => (
                        <CardView 
                            key={card.id} 
                            card={card} 
                            index={i}
                            totalCards={hand.length}
                            disabled={!isActionPhase || funds < card.cost}
                            onClick={() => isActionPhase && playCard(card.id)} 
                        />
                    ))}
                </AnimatePresence>
            </div>

            <div className="w-28 sm:w-36 lg:w-48 h-full flex flex-col gap-2 shrink-0">
               <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-2 sm:px-4 py-2 shadow-inner h-12 relative group">
                   <div className="flex flex-col items-start leading-none">
                       <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-widest hidden sm:block">资金</span>
                   </div>
                   <div className="flex items-start gap-1 relative">
                       <span className="text-sm self-center text-emerald-600">💰</span>
                       <span className="text-sm sm:text-xl font-bold font-mono text-emerald-600 self-center">{funds}</span>
                       <span className="text-[10px] font-bold font-mono text-emerald-500 absolute -right-4 -top-1">+{projectedIncome}</span>
                   </div>
                   {/* Tooltip for funds preview */}
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-stone-800 text-stone-100 text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                       <div className="font-bold mb-1 border-b border-stone-600 pb-1">下回合结算预计收入: +{projectedIncome}</div>
                       <div className="flex justify-between"><span>地方补助:</span><span>+{baseIncome}</span></div>
                       <div className="flex justify-between text-stone-300"><span>(第3回合起地方补助下调为2)</span></div>
                       <div className="flex justify-between mt-1"><span>旅游区收益:</span><span>+{tourismIncome}</span></div>
                   </div>
               </div>
               
               <div className="flex gap-1 sm:gap-2 h-10">
                   <div className="flex-1 bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center shadow-inner relative overflow-hidden group transition-all">
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest hidden lg:block">抽牌堆</span>
                        <span className="text-xs sm:text-sm font-mono text-stone-600 font-bold">{deck.length}</span>
                      </div>
                   </div>
                   <div className="flex-1 bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center shadow-inner opacity-80 relative overflow-hidden">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest hidden lg:block">弃牌</span>
                        <span className="text-xs sm:text-sm font-mono text-stone-600 font-bold">{discardPile.length}</span>
                      </div>
                   </div>
               </div>

               <button 
                  className={`mt-auto h-12 w-full font-bold rounded-xl shadow-md transition-transform flex items-center justify-center gap-1 sm:gap-2 ${isActionPhase ? 'bg-stone-800 hover:bg-stone-900 text-white active:scale-95 cursor-pointer shadow-stone-800/20' : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'}`}
                  onClick={() => isActionPhase && nextPhase()}
                  disabled={!isActionPhase}
               >
                  <span className="text-xs sm:text-sm lg:text-base hidden sm:block">结束回合</span>
                  <span className="text-xs sm:text-sm lg:text-base sm:hidden">结束</span>
                  <span className="text-sm sm:text-lg leading-none">🏁</span>
               </button>
            </div>
        </div>
    );
};
