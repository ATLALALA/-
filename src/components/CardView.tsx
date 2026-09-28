import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Card } from '../types';
import { cn } from '../lib/utils';

export const CardView: React.FC<{ card: Card, index?: number, totalCards?: number, onClick?: () => void, disabled?: boolean }> = ({ card, index = 0, totalCards = 1, onClick, disabled }) => {
   const [isHovered, setIsHovered] = useState(false);
   const [isPlayed, setIsPlayed] = useState(false);

   // Motion values for 3D hover
   const x = useMotionValue(0);
   const y = useMotionValue(0);

   const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
   const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

   const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [15, -15]);
   const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-15, 15]);

   const highlightX = useTransform(mouseXSpring, [-0.5, 0.5], ['-10%', '10%']);
   const highlightY = useTransform(mouseYSpring, [-0.5, 0.5], ['-10%', '10%']);

   const handleClick = () => {
      if (disabled) return;
      setIsPlayed(true);
      if (onClick) onClick();
   };

   let borderClass = 'border-stone-200 bg-white';
   
   if (card.type === 'INVESTIGATION') {
       borderClass = 'border-purple-400 bg-purple-50/70 shadow-purple-200/50';
   } else if (card.type === 'BUILDING') {
       borderClass = 'border-amber-400 bg-amber-50/40 shadow-amber-200/50';
   } else if (card.type === 'SPECIAL_EVENT') {
       borderClass = 'border-emerald-300 bg-emerald-50/30 shadow-emerald-200/50';
   } else if (card.type === 'ECONOMY') {
       borderClass = 'border-blue-400 bg-blue-50/50 shadow-blue-200/50';
   } else if (card.type === 'EVENT') {
       borderClass = 'border-red-400 bg-red-50/50 shadow-red-200/50';
   }

   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      x.set(mouseX / width - 0.5);
      y.set(mouseY / height - 0.5);
   };

   const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
   };

   const handleMouseEnter = () => {
      if (!disabled) setIsHovered(true);
   };

   // Fan layout angles
   const midPoint = (totalCards - 1) / 2;
   const positionOffset = index - midPoint;
   const baseRotation = positionOffset * 4; 
   const translateY = Math.abs(positionOffset) * 4;

   return (
      <motion.div 
         layout="position"
         initial={{ opacity: 0, scale: 0.5, y: 200, rotateY: 180 }}
         animate={{ 
            opacity: 1, 
            scale: 1, 
            y: isHovered ? translateY - 20 : translateY, 
            rotateY: 0,
            rotateZ: isHovered ? 0 : baseRotation,
            transition: {
               delay: isHovered ? 0 : index * 0.08,
               type: "spring",
               stiffness: 260,
               damping: 20,
               mass: 1
            }
         }}
         exit={{ 
            scale: 0, 
            y: -100, 
            opacity: 0, 
            filter: "blur(4px)",
            transition: { duration: 0.4, ease: "backIn" } 
         }}
         style={{
            zIndex: isHovered ? 50 : index,
            perspective: 800,
            marginLeft: totalCards > 5 && index !== 0 ? '-1rem' : '0.25rem',
            marginRight: '0.25rem'
         }}
         className={cn(
             "shrink-0 relative group",
             disabled ? "opacity-60 cursor-not-allowed grayscale" : "cursor-pointer"
         )}
         onClick={handleClick}
         onMouseEnter={handleMouseEnter}
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseLeave}
      >
         <motion.div
            style={{
               rotateX,
               rotateY,
               scale: isHovered ? 1.08 : 1,
               transformStyle: "preserve-3d"
            }}
            className={cn(
                "w-36 h-48 rounded-xl shadow-md border-2 p-3 flex flex-col justify-between transition-shadow relative",
                borderClass,
                isHovered ? "shadow-[0px_20px_40px_rgba(0,0,0,0.2)]" : ""
            )}
         >
            {/* Card Back for entry flip */}
            <div 
               className="absolute inset-[-2px] border-2 border-stone-300 rounded-xl bg-stone-200 shadow-inner [backface-visibility:hidden] z-0 overflow-hidden"
               style={{ transform: "rotateY(180deg)" }}
            >
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-300 to-stone-400 opacity-50" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-stone-500 tracking-widest text-lg font-mono opacity-30">
                  RESERVE
               </div>
            </div>

            {/* Front content */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 overflow-hidden rounded-xl bg-inherit [backface-visibility:hidden] z-10">
               <div className="flex justify-between items-start pointer-events-none">
                   <span className="text-[10px] font-bold text-stone-500 uppercase">{card.type.substring(0,6)}</span>
                   <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-800 shadow-sm border border-emerald-200">
                     {card.cost}
                   </div>
               </div>
               <h4 className="font-bold text-xs text-stone-800 leading-tight my-2 block w-full pointer-events-none relative z-20">{card.name}</h4>
               {card.imageUrl && (
                  <div className="w-full h-14 mb-1 rounded bg-stone-100 overflow-hidden shrink-0 border border-stone-200 pointer-events-none relative z-20 shadow-sm">
                     <img src={card.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
               )}
               <p className="text-[10px] text-stone-600 flex-1 overflow-hidden leading-snug bg-white/50 p-1.5 rounded border border-stone-100 pointer-events-none relative z-20">
                   {card.description}
               </p>
               
               {/* Holographic reflection highlight effect */}
               {isHovered && !disabled && (
                  <motion.div 
                      className="absolute inset-0 rounded-xl pointer-events-none mix-blend-overlay z-30"
                      style={{
                          background: `radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
                          x: highlightX,
                          y: highlightY,
                      }}
                  />
               )}
            </div>

            {/* Water bubbles effect on play */}
            {isPlayed && (
               <div className="absolute inset-0 pointer-events-none overflow-visible z-40">
                   {[...Array(6)].map((_, i) => (
                      <motion.div
                         key={i}
                         initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                         animate={{ 
                            scale: Math.random() * 1.5 + 0.5,
                            x: (Math.random() - 0.5) * 120, 
                            y: (Math.random() - 0.5) * 120 - 40,
                            opacity: 0,
                         }}
                         transition={{ duration: 0.6, ease: "easeOut" }}
                         className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-200/50 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      />
                   ))}
               </div>
            )}
         </motion.div>
      </motion.div>
   )
}
