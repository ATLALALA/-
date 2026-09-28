import React from 'react';
import { useGameStore } from '../store';
import { BIO_ENTITIES } from '../data/entities';
import { CARD_DATABASE } from '../data/cards';
import { cn } from '../lib/utils';

export const BuildingSlotsArea: React.FC = () => {
    const buildingSlots = useGameStore(s => s.buildingSlots);

    return (
        <div className="flex flex-col h-full p-3 gap-2 bg-transparent">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center border-b border-stone-200 pb-1.5 mb-1">
               建设中设施
            </div>
            
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto hide-scrollbar pb-6">
                {buildingSlots.map((slot, i) => (
                    <div 
                        key={i} 
                        className={cn("h-20 shrink-0 bg-[#FCFDFB] border border-stone-200 rounded-xl shadow-sm flex flex-col items-center justify-center p-1.5 relative transition-all overflow-hidden group", slot ? "cursor-pointer hover:border-emerald-300 hover:shadow-md" : "")}
                        onClick={() => {
                            if (slot) {
                                const card = CARD_DATABASE[slot.cardId];
                                useGameStore.getState().openModal(`📝 建筑科普：${slot.name.replace('[建筑] ', '')}`, card.scienceText, 'SCIENCE');
                            }
                        }}
                    >
                        {slot ? (
                            <div className="flex flex-col items-center text-center w-full z-10">
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded w-full truncate border border-emerald-100 shadow-sm mb-1.5 leading-relaxed">
                                    {slot.name.replace('[建筑] ', '')}
                                </span>
                                <div className="text-[10px] font-mono text-stone-600 bg-white p-1.5 flex flex-col gap-1 items-center justify-center w-full border border-stone-100 rounded shrink-0 shadow-inner">
                                   <span className="text-emerald-700 font-bold tracking-tight">
                                       + {(slot.production.gridIds || []).map(id => BIO_ENTITIES[id]?.name || '生物').join(', ')}
                                   </span>
                                   <span className="opacity-80 text-[10px] flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200">
                                       ⏳ 持续产出中
                                   </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-stone-400 font-mono tracking-wider opacity-60 border-2 border-dashed border-stone-300 rounded-lg w-full h-full flex items-center justify-center bg-stone-50 group-hover:bg-stone-100 transition-colors">
                                空闲槽位
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
