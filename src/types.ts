export type GamePhase = 'EVENT' | 'SETTLEMENT' | 'DRAW' | 'ACTION' | 'SPREAD';

export type CardType = 'INVESTIGATION' | 'BUILDING' | 'EVENT' | 'SPECIAL_EVENT' | 'ECONOMY';

export type GameStatus = 'PLAYING' | 'VICTORY' | 'DEFEAT';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  scienceText: string;
  imageUrl?: string;
  exhaust?: boolean;
  effects: {
    grantsGrids?: { gridId: string; count: number }[];
    unlocksCard?: string;
    spawnsBuilding?: string;
    globalEffect?: 'CLEAR_POLLUTION' | 'ADD_POLLUTION' | 'CLEAR_POLLUTION_AMOUNT' | 'GAIN_FUNDS' | 'CREATE_TOURISM_ZONE' | 'PRODUCE_RANDOM_BIO';
    count?: number;
  };
}

export interface BuildingEntity {
  cardId: string;
  name: string;
  durationLeft: number;
  production: { gridIds: string[] };
}

export type CellType = 'EMPTY' | 'POLLUTION' | 'BIO' | 'TOURISM';

export interface Cell {
  x: number;
  y: number;
  zoneId: string;
  type: CellType;
  entityId: string | null;
  pollutionLevel: number;
  isTourism?: boolean;
  immuneToPollution?: boolean;
  pollutionAge?: number;
  spreadTarget?: { x: number, y: number };
}

export interface PlacedEntity {
  id: string;
  gridDefId: string;
  speciesType: string;
  originX: number;
  originY: number;
  width: number;
  height: number;
  health: number;
}

// 待放置的生物格子
export interface BioGrid {
  id: string;
  gridDefId: string; // 如图鉴ID: 'grid_mangrove'
  speciesType: string;
  width: number;
  height: number;
}

export interface Zone {
  id: string;
  name: string;
  colorClass: string; // 用于渲染不同区域的底色或边框
}

export interface Disaster {
  id: string; // instance string
  disasterId: string;
  name: string;
  zoneId: string;
  targetSpecies: string;
  validGridDefIds: string[];
  requirements?: { gridDefId: string; minCount: number; name: string }[];
  areaWidth: number;
  areaHeight: number;
  x: number;
  y: number;
  pollutionCount: number;
  relatedInvestigation: string;
  scienceText: string;
  successTitle?: string;
  successScienceText?: string;
  successImageUrl?: string;
  filledCells: number;
  isCompleted?: boolean;
}

export interface GameState {
  turn: number;
  phase: GamePhase;
  funds: number;
  tourismCost: number;
  gameStatus: GameStatus;
  
  hand: Card[];
  deck: Card[];
  discardPile: Card[];
  buildingSlots: (BuildingEntity | null)[];
  inventory: BioGrid[];
  unlockedCards: string[];
  pendingCardsToHand: Card[];
  
  board: Cell[][]; 
  zones: Record<string, Zone>;
  activeDisasters: Disaster[];
  spawnedDisasters: string[];
  resolvedDisasters: Disaster[];
  placedEntities: Record<string, PlacedEntity>;
  selectedInventoryItem: string | null;
  activeModal: { title: string; content: string; type: 'EVENT' | 'SCIENCE'; images?: string[] } | null;

  // Actions
  nextPhase: () => void;
  drawCards: (count: number) => void;
  playCard: (cardId: string) => void;
  selectInventoryItem: (id: string | null) => void;
  placeEntity: (x: number, y: number) => void;
  openModal: (title: string, content: string, type: 'EVENT' | 'SCIENCE', images?: string[]) => void;
  closeModal: () => void;
}


