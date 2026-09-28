import { create } from 'zustand';
import { GameState, Cell, GamePhase, Zone, Card } from './types';
import { CARD_DATABASE, INITIAL_DECK, BUILDING_PRODUCTIONS, DISASTERS } from './data/cards';
import { BIO_ENTITIES } from './data/entities';

const shuffleAndGenerateDeck = (): Card[] => {
  const deck: Card[] = INITIAL_DECK.map((id, index) => {
    const template = CARD_DATABASE[id];
    return { ...template, id: `card_${Date.now()}_${index}` };
  });
  return deck.sort(() => Math.random() - 0.5);
};

const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 8;

const initialZones: Record<string, Zone> = {
  coastal: { id: 'coastal', name: '海岸区', colorClass: 'bg-[#FDF2E9]' },
  shallow_sea: { id: 'shallow_sea', name: '浅海区', colorClass: 'bg-[#E0F2F1]' },
  deep_sea: { id: 'deep_sea', name: '深海区', colorClass: 'bg-[#B2EBF2]' },
  tourism: { id: 'tourism', name: '生态旅游区', colorClass: 'bg-orange-50' }
};

const getZoneForCell = (x: number, y: number): string => {
  if (x >= 8 && y >= 5) return 'tourism';
  if (x < 4) return 'coastal';
  if (x < 8) return 'shallow_sea';
  return 'deep_sea';
};

const createInitialBoard = (): Cell[][] => {
  const board: Cell[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      row.push({
        x,
        y,
        zoneId: getZoneForCell(x, y),
        type: 'EMPTY',
        entityId: null,
        pollutionLevel: 0,
      });
    }
    board.push(row);
  }

  return board;
};

const checkGameStatus = (board: Cell[][], state: GameState, currentResolvedCount?: number): 'PLAYING' | 'VICTORY' | 'DEFEAT' => {
   let emptyCount = 0;
   let pollutionCount = 0;
   let bioCount = 0;
   for (let y = 0; y < BOARD_HEIGHT; y++) {
     for (let x = 0; x < BOARD_WIDTH; x++) {
        if(board[y][x].type === 'EMPTY') emptyCount++;
        if(board[y][x].type === 'POLLUTION') pollutionCount++;
        if(board[y][x].type === 'BIO') bioCount++;
     }
   }
   const resolved = currentResolvedCount !== undefined ? currentResolvedCount : (state.resolvedDisasters?.length || 0);
   if (resolved >= DISASTERS.length) {
      return 'VICTORY';
   }
   if (emptyCount === 0) {
      return pollutionCount > bioCount ? 'DEFEAT' : 'VICTORY';
   }
   return 'PLAYING';
}

const PHASE_ORDER: GamePhase[] = ['EVENT', 'SETTLEMENT', 'DRAW', 'ACTION', 'SPREAD'];

export const useGameStore = create<GameState>((set) => ({
  turn: 0,
  phase: 'SPREAD',
  funds: 2,
  tourismCost: 0,
  gameStatus: 'PLAYING',
  
  hand: [],
  deck: shuffleAndGenerateDeck(),
  discardPile: [],
  buildingSlots: [null, null, null, null, null, null, null, null],
  inventory: [],
  unlockedCards: ['evt_bridge'],
  pendingCardsToHand: [],
  
  board: createInitialBoard(),
  zones: initialZones as Record<string, Zone>,
  activeDisasters: [],
  spawnedDisasters: [],
  resolvedDisasters: [],
  placedEntities: {},
  selectedInventoryItem: null,
  activeModal: null,

  openModal: (title, content, type, images) => set({ activeModal: { title, content, type, images } }),
  closeModal: () => set({ activeModal: null }),

  nextPhase: () =>
    set((state) => {
      if (state.gameStatus !== 'PLAYING') return state;
      const currentPhaseIndex = PHASE_ORDER.indexOf(state.phase);
      const isLastPhase = currentPhaseIndex === PHASE_ORDER.length - 1;
      
      const nextPhaseName = isLastPhase ? PHASE_ORDER[0] : PHASE_ORDER[currentPhaseIndex + 1];
      const nextTurn = isLastPhase ? state.turn + 1 : state.turn;
      
      const updates: Partial<GameState> = {
        phase: nextPhaseName,
        turn: nextTurn,
      };

      if (nextPhaseName === 'EVENT') {
        const newBoard = (updates.board || state.board).map(r => r.map(c => ({...c})));
        
        if (nextTurn % 5 === 1) { // Apply disaster effect every 5 turns
            const availableDisasters = DISASTERS.filter(d => !(state.spawnedDisasters || []).includes(d.disasterId));
            if (availableDisasters.length > 0) {
               const disasterBase = availableDisasters[Math.floor(Math.random() * availableDisasters.length)];
               const newDisasterId = `disaster_active_${Date.now()}`;
               
               // Randomly allocate a valid 2D region for the disaster
               const maxX = BOARD_WIDTH - disasterBase.areaWidth;
               const maxY = BOARD_HEIGHT - disasterBase.areaHeight;
               const allocatedX = Math.floor(Math.random() * (maxX + 1));
               const allocatedY = Math.floor(Math.random() * (maxY + 1));

               const prevDisasterCount = state.spawnedDisasters?.length || 0;
               const dynamicPollutionCount = 4 + prevDisasterCount * 2;

               updates.activeDisasters = [...state.activeDisasters, {
                  ...disasterBase,
                  id: newDisasterId,
                  x: allocatedX,
                  y: allocatedY,
                  filledCells: 0
               }];

               updates.spawnedDisasters = [...(state.spawnedDisasters || []), disasterBase.disasterId];

            if (disasterBase.relatedInvestigation) {
               const invCardDef = CARD_DATABASE[disasterBase.relatedInvestigation];
               if (invCardDef) {
                   updates.pendingCardsToHand = [...(state.pendingCardsToHand || []), { ...invCardDef, id: `card_${Date.now()}_${invCardDef.id}` }];
               }
            }

            const totalArea = disasterBase.areaWidth * disasterBase.areaHeight;
            updates.activeModal = {
               title: `⚠️ 突发灾害：${disasterBase.name}`,
               content: disasterBase.scienceText + `\n\n⚠ 警告：本次灾害在区域内带来了 ${dynamicPollutionCount} 格污染！\n\n[目标] 将受灾区域（红框闪烁区）填满合格的生物格子（如【${disasterBase.targetSpecies}】，需覆盖 ${totalArea} 个格子）以消除危机！`,
               type: 'EVENT'
            };

            const targetZoneCells: {x:number, y:number}[] = [];
            for (let dy = 0; dy < disasterBase.areaHeight; dy++) {
               for (let dx = 0; dx < disasterBase.areaWidth; dx++) {
                   const cx = allocatedX + dx;
                   const cy = allocatedY + dy;
                   if (newBoard[cy][cx].type === 'EMPTY') {
                      targetZoneCells.push({x: cx, y: cy});
                   }
               }
            }
            targetZoneCells.sort(() => Math.random() - 0.5);
            for(let i=0; i<Math.min(dynamicPollutionCount, targetZoneCells.length); i++) {
               const cy = targetZoneCells[i].y;
               const cx = targetZoneCells[i].x;
               newBoard[cy][cx].type = 'POLLUTION';
               newBoard[cy][cx].pollutionAge = 0;
               newBoard[cy][cx].spreadTarget = undefined;
            }
            }
        }
        
        updates.board = newBoard;
      } else if (nextPhaseName === 'SETTLEMENT') {
        let addedFunds = nextTurn <= 2 ? 4 : 2; // Base income 4 funds for first 2 turns, then 2
        
        // Tourism income: 1 fund per entity placed where at least one cell overlaps with a tourism zone
        Object.values(state.placedEntities).forEach(entity => {
           let inTourism = false;
           for (let y = 0; y < entity.height; y++) {
               for (let x = 0; x < entity.width; x++) {
                   const cell = state.board[entity.originY + y]?.[entity.originX + x];
                   if (cell?.isTourism) {
                       inTourism = true;
                   }
               }
           }
           if (inTourism) {
               addedFunds += 1;
           }
        });

        updates.funds = Math.min(state.funds + addedFunds, 99);
        const newSlots = [...state.buildingSlots];
        const newInventory = [...state.inventory];

        newSlots.forEach((slot, index) => {
          if (slot) {
             const prodIds = slot.production?.gridIds || [];
             prodIds.forEach(prodId => {
               const config = BIO_ENTITIES[prodId];
               if (config) {
                 newInventory.push({
                   id: `biogrid_${Date.now()}_${Math.random()}`,
                   gridDefId: prodId,
                   speciesType: config.name,
                   width: config.width,
                   height: config.height
                 });
               }
             });
             
             // Buildings produce indefinitely
             newSlots[index] = { ...slot };
          }
        });
        
        updates.buildingSlots = newSlots;
        updates.inventory = newInventory;
        
      } else if (nextPhaseName === 'DRAW') {
        let newDiscardPile = [...state.discardPile];
        
        // 1. First, any unused cards from hand go to discard pile
        newDiscardPile.push(...state.hand);
        
        let newHand: Card[] = [];
        let newDeck = [...state.deck];

        // 2. Add pending investigation cards first
        if (state.pendingCardsToHand && state.pendingCardsToHand.length > 0) {
            newHand.push(...state.pendingCardsToHand);
            updates.pendingCardsToHand = [];
        }

        // 3. Draw cards from deck up to hand size limit (e.g. 5)
        while (newHand.length < 5) {
           if (newDeck.length === 0) {
              if (newDiscardPile.length === 0) break; // no more cards to draw at all
              newDeck = newDiscardPile.sort(() => Math.random() - 0.5);
              newDiscardPile = [];
           }
           if (newDeck.length > 0) {
              newHand.push(newDeck.pop()!);
           }
        }

        updates.deck = newDeck;
        updates.hand = newHand;
        updates.discardPile = newDiscardPile;
      } else if (nextPhaseName === 'SPREAD') {
        const newBoard = (updates.board || state.board).map(r => r.map(c => ({...c})));
        const newPlaced = { ...(updates.placedEntities || state.placedEntities) };
        const dirs = [[0,1], [1,0], [0,-1], [-1,0]];
        const newPollutions: {x:number, y:number}[] = [];
        const entitiesToHit = new Set<string>();

        // Spread from existing pollution
        for (let y = 0; y < BOARD_HEIGHT; y++) {
          for (let x = 0; x < BOARD_WIDTH; x++) {
            const cell = newBoard[y][x];
            if (cell.type === 'POLLUTION') {
               let age = cell.pollutionAge || 0;
               age++;

               if (age >= 2) {
                  const targetCoords = cell.spreadTarget;
                  if (targetCoords) {
                     const {x: tx, y: ty} = targetCoords;
                     const targetCell = newBoard[ty]?.[tx];
                     if (targetCell && !targetCell.immuneToPollution) {
                        if (targetCell.type === 'EMPTY') {
                           newPollutions.push({x: tx, y: ty});
                        } else if (targetCell.type === 'BIO' && targetCell.entityId) {
                           entitiesToHit.add(targetCell.entityId);
                        }
                     }
                  }
                  cell.pollutionAge = 0;
                  cell.spreadTarget = undefined;
               } else {
                  cell.pollutionAge = age;
                  const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);
                  let foundTarget = false;
                  for (const [dx, dy] of shuffledDirs) {
                     const nx = x + dx;
                     const ny = y + dy;
                     if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
                        const targetCell = newBoard[ny][nx];
                        if (!targetCell.immuneToPollution && targetCell.type !== 'POLLUTION') {
                            cell.spreadTarget = {x: nx, y: ny};
                            foundTarget = true;
                            break;
                        }
                     }
                  }
                  if (!foundTarget) {
                     cell.spreadTarget = undefined;
                  }
               }
            }
          }
        }
        
        // Spawn 1-2 new pollution randomly EVERY turn
        const rand = Math.random();
        const spawnCount = rand < 0.2 ? 2 : 1;
        
        const emptyCells: {x: number, y: number}[] = [];
        newBoard.forEach((r, cy) => r.forEach((c, cx) => {
           if (c.type === 'EMPTY' && !c.immuneToPollution) emptyCells.push({x: cx, y: cy});
        }));
        if (emptyCells.length > 0) {
           for (let i = 0; i < Math.min(spawnCount, emptyCells.length); i++) {
               const rIdx = Math.floor(Math.random() * emptyCells.length);
               const randomEmpty = emptyCells.splice(rIdx, 1)[0];
               newPollutions.push({x: randomEmpty.x, y: randomEmpty.y});
           }
        }
        
        newPollutions.forEach(({x, y}) => {
           newBoard[y][x].type = 'POLLUTION';
           newBoard[y][x].pollutionAge = 0;
           newBoard[y][x].spreadTarget = undefined;
        });

        const killedEntityTypes: string[] = [];
        entitiesToHit.forEach(entityId => {
           if (newPlaced[entityId]) {
              newPlaced[entityId] = { ...newPlaced[entityId], health: newPlaced[entityId].health - 1 };
              if (newPlaced[entityId].health <= 0) {
                 const ent = newPlaced[entityId];
                 killedEntityTypes.push(ent.speciesType);
                 for (let dy = 0; dy < ent.height; dy++) {
                    for (let dx = 0; dx < ent.width; dx++) {
                       newBoard[ent.originY + dy][ent.originX + dx].type = 'POLLUTION';
                       newBoard[ent.originY + dy][ent.originX + dx].entityId = null;
                    }
                 }
                 delete newPlaced[entityId];
              }
           }
        });

        if (killedEntityTypes.length > 0) {
            const species = killedEntityTypes[0]; // Just show the first one that died as a representative
            const textDict: Record<string, string> = {
                '黑脸琵鹭': '黑脸琵鹭是全球濒危鸟类。当湿地遭受污染，红树林萎缩，它们不仅失去了隐藏栖息的林冠，还会因为底栖鱼虾重金属过载，导致食物链断裂，使得种群繁衍面临致命考验。',
                '秋茄': '秋茄是玉环沿海生态的关键红树植物。但过度的工业污水和油污泄漏会粘附在它的呼吸根上，导致根系窒息缺氧。土壤重金属累积也会损害其树体生理机能，最终导致大面积成林枯萎。',
                '大黄鱼': '大黄鱼对水质的要求极高。富营养化引发赤潮会导致海水中溶解氧急剧下降，造成大黄鱼群窒息死亡；此外，化工厂排放的有毒物质也会直接腐蚀和损伤幼鱼的鳃组织。',
                '疣荔枝螺': '疣荔枝螺极易受到海底沉积的重金属及微塑料污染的影响。这些持久性的污染物质会干扰它们的内分泌系统，导致种群基因受损、数量锐减，进而破坏珊瑚礁与岩礁体生态体系。',
                '牡蛎礁': '牡蛎被誉为“生态净水器”，但过量的污染水体（特别是酸性废水和重金属）会快速溶解它们的碳酸钙外壳，阻碍幼体附着成礁，并引发严重的生物毒性富集，最终摧毁这道天然生物防波堤。'
            };
            const imageDict: Record<string, string> = {
                '黑脸琵鹭': '/img/black_faced_spoonbill.jpg',
                '大黄鱼': '/img/yellow_croaker.jpg',
            };
            updates.activeModal = {
                type: 'SCIENCE',
                title: `生态危急！[${species}] 被污染吞噬`,
                content: textDict[species] || '环境污染扩散严重破坏了局部生态，导致部分生物失去了生存空间。',
                images: imageDict[species] ? [imageDict[species]] : undefined
            };
        }

        updates.board = newBoard;
        updates.placedEntities = newPlaced;
      }
      
      if (updates.board) {
         updates.gameStatus = checkGameStatus(updates.board, state);
      }
      
      return updates;
    }),

  drawCards: (count) => set((state) => {
    const newDeck = [...state.deck];
    const newHand = [...state.hand];
    for (let i = 0; i < count; i++) {
      if (newDeck.length > 0 && newHand.length < 8) {
        const randomIndex = Math.floor(Math.random() * newDeck.length);
        const card = newDeck.splice(randomIndex, 1)[0];
        newHand.push(card);
      }
    }
    return { deck: newDeck, hand: newHand };
  }),

  playCard: (cardId) => set((state) => {
    const cardIndex = state.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return state;
    
    const card = state.hand[cardIndex];
    if (state.funds < card.cost) return state; // cannot afford
    
    const newHand = [...state.hand];
    newHand.splice(cardIndex, 1);
    const newFunds = state.funds - card.cost;
    const newInventory = [...state.inventory];
    
    const nextDiscard = card.exhaust ? state.discardPile : [...state.discardPile, card];
     const modalUpdate = {
       activeModal: {
          title: `📝 调查/建设：${card.name}`,
          content: card.scienceText || card.description,
          type: 'SCIENCE' as const,
          images: card.imageUrl ? [card.imageUrl] : undefined
       }
    };

    if (card.type === 'SPECIAL_EVENT' || card.type === 'ECONOMY') {
       if (card.effects.globalEffect === 'CLEAR_POLLUTION') {
          const newBoard = state.board.map(r => r.map(c => c.type === 'POLLUTION' ? { ...c, type: 'EMPTY' as const } : c));
          return { hand: newHand, funds: newFunds, discardPile: nextDiscard, board: newBoard, gameStatus: checkGameStatus(newBoard, state), ...modalUpdate };
       }

       if (card.effects.globalEffect === 'CLEAR_POLLUTION_AMOUNT' && card.effects.count) {
          const pollutionCells: {x: number, y: number}[] = [];
          state.board.forEach(r => r.forEach(c => {
             if (c.type === 'POLLUTION') pollutionCells.push({x: c.x, y: c.y});
          }));
          const toClear = pollutionCells.sort(() => Math.random() - 0.5).slice(0, card.effects.count);
          const newBoard = state.board.map(r => r.map(c => {
             if (toClear.some(tc => tc.x === c.x && tc.y === c.y)) {
                return { ...c, type: 'EMPTY' as const };
             }
             return c;
          }));
          return { hand: newHand, funds: newFunds, discardPile: nextDiscard, board: newBoard, gameStatus: checkGameStatus(newBoard, state), ...modalUpdate };
       }

       if (card.effects.globalEffect === 'GAIN_FUNDS' && card.effects.count) {
          return { hand: newHand, funds: newFunds + card.effects.count, discardPile: nextDiscard, ...modalUpdate };
       }
       
       if (card.effects.globalEffect === 'CREATE_TOURISM_ZONE') {
          const emptyCells: {x:number, y:number}[] = [];
          for (let y = 0; y < BOARD_HEIGHT; y++) {
             for (let x = 0; x < BOARD_WIDTH; x++) {
                if (state.board[y][x].type === 'EMPTY' && !state.board[y][x].isTourism) {
                   emptyCells.push({x, y});
                }
             }
          }
          if (emptyCells.length > 0) {
             const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
             const newBoard = state.board.map(r => r.map(c => ({...c})));
             newBoard[target.y][target.x].isTourism = true;
             
             const newTourismCost = Math.min(state.tourismCost + 1, 6);
             const updateCardCost = (c: Card) => c.effects?.globalEffect === 'CREATE_TOURISM_ZONE' ? { ...c, cost: newTourismCost } : c;
             const updatedHand = newHand.map(updateCardCost);
             const updatedDeck = state.deck.map(updateCardCost);
             const updatedDiscard = nextDiscard.map(updateCardCost);

             return { 
                hand: updatedHand, 
                deck: updatedDeck,
                discardPile: updatedDiscard,
                funds: newFunds, 
                board: newBoard, 
                tourismCost: newTourismCost,
                ...modalUpdate 
             };
          }
       }

       if (card.effects.globalEffect === 'PRODUCE_RANDOM_BIO') {
          const bioIds = ['grid_spoonbill', 'grid_mangrove', 'grid_croaker', 'grid_snail', 'grid_oyster'];
          const randomId = bioIds[Math.floor(Math.random() * bioIds.length)];
          const config = BIO_ENTITIES[randomId];
          const newInventory = [...state.inventory];
          if (config) {
             newInventory.push({
                id: `biogrid_${Date.now()}_${Math.random()}`,
                gridDefId: randomId,
                speciesType: config.name,
                width: config.width,
                height: config.height
             });
          }
          return { hand: newHand, funds: newFunds, discardPile: nextDiscard, inventory: newInventory, ...modalUpdate };
       }
    }

    if (card.type === 'INVESTIGATION') {
       if (card.effects.grantsGrids) {
          card.effects.grantsGrids.forEach(g => {
             for(let k=0; k<g.count; k++) {
                const config = BIO_ENTITIES[g.gridId];
                if (config) {
                   newInventory.push({
                      id: `biogrid_${Date.now()}_${Math.random()}`,
                      gridDefId: g.gridId,
                      speciesType: config.name,
                      width: config.width,
                      height: config.height
                   });
                }
             }
          });
       }

       let newUnlockedCards = state.unlockedCards;
       if (card.effects.unlocksCard && CARD_DATABASE[card.effects.unlocksCard]) {
          if (!state.unlockedCards.includes(card.effects.unlocksCard)) {
             newUnlockedCards = [...state.unlockedCards, card.effects.unlocksCard];
          }
          newHand.push({
             ...CARD_DATABASE[card.effects.unlocksCard],
             id: `card_${Date.now()}_unlocked`
          });
       }
       return { hand: newHand, funds: newFunds, discardPile: nextDiscard, inventory: newInventory, unlockedCards: newUnlockedCards, ...modalUpdate };
    }

    if (card.type === 'BUILDING') {
      const newSlots = [...state.buildingSlots];
      const emptySlotIndex = newSlots.findIndex(s => s === null);
      if (emptySlotIndex !== -1) {
        const pcfg = BUILDING_PRODUCTIONS[card.effects.spawnsBuilding || ''];
        if (pcfg) {
           newSlots[emptySlotIndex] = {
              cardId: card.id,
              name: card.name,
              durationLeft: pcfg.maxDuration, 
              production: { gridIds: pcfg.gridIds } 
           };
           return { hand: newHand, funds: newFunds, buildingSlots: newSlots, ...modalUpdate };
        }
      }
      return state; // No slot available
    }
    
    const newDiscard = [...state.discardPile, card];
    return { hand: newHand, funds: newFunds, discardPile: newDiscard, ...modalUpdate };
  }),

  selectInventoryItem: (id) => set({ selectedInventoryItem: id }),

  placeEntity: (x, y) => set((state) => {
    if (state.phase !== 'ACTION') return state; // Only place during action phase
    if (!state.selectedInventoryItem) return state;
    
    const itemIndex = state.inventory.findIndex(i => i.id === state.selectedInventoryItem);
    if (itemIndex === -1) return state;
    const item = state.inventory[itemIndex];

    // Check boundaries
    if (x + item.width > BOARD_WIDTH || y + item.height > BOARD_HEIGHT) return state;

    // Check collisions
    let canPlace = true;
    const entitiesToReplace = new Set<string>();

    for (let dy = 0; dy < item.height; dy++) {
      for (let dx = 0; dx < item.width; dx++) {
        const cell = state.board[y + dy][x + dx];
        if (cell.type === 'POLLUTION') {
          canPlace = false; // Cannot place on pollution
        } else if (cell.type === 'BIO' && cell.entityId) {
          const existingEnt = state.placedEntities[cell.entityId];
          if (existingEnt && existingEnt.gridDefId !== item.gridDefId) {
             entitiesToReplace.add(cell.entityId);
          }
          // If they are the same type, we don't add to entitiesToReplace, 
          // meaning the old one survives but its cells under the new placement get overwritten by the new one.
        }
      }
    }
    if (!canPlace) return state;

    // Place entity
    const finalBoard = state.board.map(row => row.map(cell => ({ ...cell })));
    const entityId = `placed_${Date.now()}_${Math.random()}`;
    const newPlacedEntities = { ...state.placedEntities };

    // Remove old entities we are overwriting
    entitiesToReplace.forEach(eid => {
       const ent = newPlacedEntities[eid];
       if (ent) {
          for(let r=ent.originY; r<ent.originY+ent.height; r++) {
             for(let c=ent.originX; c<ent.originX+ent.width; c++) {
                 if (finalBoard[r] && finalBoard[r][c] && finalBoard[r][c].entityId === eid) {
                     finalBoard[r][c].type = 'EMPTY';
                     finalBoard[r][c].entityId = null;
                 }
             }
          }
          delete newPlacedEntities[eid];
       }
    });

    for (let dy = 0; dy < item.height; dy++) {
      for (let dx = 0; dx < item.width; dx++) {
        const subEntityId = `placed_${Date.now()}_${Math.random()}`;
        finalBoard[y + dy][x + dx].type = 'BIO';
        finalBoard[y + dy][x + dx].entityId = subEntityId;
        
        // Remove old 1x1 overlapping (if it was same type so it wasn't picked up by entitiesToReplace)
        const oldEid = state.board[y + dy][x + dx].entityId;
        if (oldEid && newPlacedEntities[oldEid]) {
            delete newPlacedEntities[oldEid];
        }

        newPlacedEntities[subEntityId] = {
           id: subEntityId,
           gridDefId: item.gridDefId,
           speciesType: item.speciesType,
           originX: x + dx, // 1x1's own X
           originY: y + dy, // 1x1's own Y
           width: 1,
           height: 1,
           health: BIO_ENTITIES[item.gridDefId]?.hp || 1 // 1x1 has configured HP or 1 health
        };
      }
    }

    const newInventory = [...state.inventory];

    newInventory.splice(itemIndex, 1);

    // Check if any active disasters are resolved
    let addedFunds = 0;
    let completedDisaster: (typeof state.activeDisasters)[0] | null = null;
    const newResolvedDisasters = [...state.resolvedDisasters];
    const remainingDisasters = state.activeDisasters.filter(d => {
       let filledCount = 0;
       const reqCounts: Record<string, number> = {};
       for (let dy = 0; dy < d.areaHeight; dy++) {
          for (let dx = 0; dx < d.areaWidth; dx++) {
             const cx = d.x + dx;
             const cy = d.y + dy;
             if (cy >= 0 && cy < BOARD_HEIGHT && cx >= 0 && cx < BOARD_WIDTH) {
                const cell = finalBoard[cy][cx];
                if (cell.type === 'BIO' && cell.entityId) {
                   const ent = newPlacedEntities[cell.entityId];
                   if (ent && d.validGridDefIds.includes(ent.gridDefId)) {
                      filledCount++;
                      reqCounts[ent.gridDefId] = (reqCounts[ent.gridDefId] || 0) + 1;
                   }
                }
             }
          }
       }
       
       let requirementsMet = true;
       if (d.requirements) {
          for (const req of d.requirements) {
             if ((reqCounts[req.gridDefId] || 0) < req.minCount) {
                requirementsMet = false;
                break;
             }
          }
       }

       if (filledCount >= (d.areaWidth * d.areaHeight) && requirementsMet) {
          addedFunds += 5; // Reward for clearing a disaster
          newResolvedDisasters.push({ ...d, isCompleted: true });
          completedDisaster = { ...d, isCompleted: true };
          
          // Pre-allocate: make those cells immune to pollution
          for (let dy = 0; dy < d.areaHeight; dy++) {
             for (let dx = 0; dx < d.areaWidth; dx++) {
                const cx = d.x + dx;
                const cy = d.y + dy;
                if (cy >= 0 && cy < BOARD_HEIGHT && cx >= 0 && cx < BOARD_WIDTH) {
                   finalBoard[cy][cx] = { ...finalBoard[cy][cx], immuneToPollution: true };
                }
             }
          }
          return false;
       }
       return true;
    });

    const modalUpdate = completedDisaster ? {
       activeModal: {
          type: 'SCIENCE' as const,
          title: completedDisaster.successTitle || '生态告捷！',
          content: completedDisaster.successScienceText || '你成功恢复了这里区域的生态系统。',
          images: completedDisaster.successImageUrl ? [completedDisaster.successImageUrl] : undefined
       }
    } : {};

    return {
      board: finalBoard,
      inventory: newInventory,
      placedEntities: newPlacedEntities,
      selectedInventoryItem: null,
      activeDisasters: remainingDisasters,
      resolvedDisasters: newResolvedDisasters,
      funds: state.funds + addedFunds,
      gameStatus: checkGameStatus(finalBoard, state, newResolvedDisasters.length),
      ...modalUpdate
    };
  })
}));
