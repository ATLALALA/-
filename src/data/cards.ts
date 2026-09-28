import { Card } from '../types';

export const CARD_DATABASE: Record<string, Card> = {
  'basic_tourism': {
    id: 'basic_tourism',
    name: '[建设] 生态观光',
    type: 'ECONOMY',
    cost: 0,
    description: '在版图上划定 1 个空的格子为【旅游区】。之后只要该格子内有生物填充，每回合结算时都会为你提供 1 💰额外收入。每次使用后费用在整局游戏中永久+1（最高为6）。',
    scienceText: '保护海洋并非完全禁止人类活动，玉环推行生态旅游发展，让部分渔民洗脚上岸经营观光项目，实现生态与经济双重发展。',
    effects: {
      globalEffect: 'CREATE_TOURISM_ZONE'
    }
  },
  'basic_conservation': {
    id: 'basic_conservation',
    name: '[支援] 物种保育',
    type: 'SPECIAL_EVENT',
    cost: 2,
    description: '申请下发物种保育资源，随机获得 1 个基础生物格子。',
    scienceText: '通过建立海洋保护区和开展人工繁育，能够有效提升海洋生物多样性。',
    effects: {
      globalEffect: 'PRODUCE_RANDOM_BIO'
    }
  },
  'basic_cleanup': {
    id: 'basic_cleanup',
    name: '[行动] 组织志愿者净滩',
    type: 'SPECIAL_EVENT',
    cost: 2,
    description: '组织队伍清除版图上最多 1 个污染格子。',
    scienceText: '定期的净滩活动能有效减缓海岸线污染扩散。',
    effects: {
      globalEffect: 'CLEAR_POLLUTION_AMOUNT',
      count: 1
    }
  },
  'adv_cleanup': {
    id: 'adv_cleanup',
    name: '[行动] 重型环保船清污',
    type: 'SPECIAL_EVENT',
    cost: 3,
    description: '派遣重型环保船消除海面上的较大规模污染，清除版图上最多 2 个污染格子。',
    scienceText: '专业的现代化环保作业船能够应对突发性的大面积油污和赤潮爆发。',
    effects: {
      globalEffect: 'CLEAR_POLLUTION_AMOUNT',
      count: 2
    }
  },
  'inv_oil_boom': {
    id: 'inv_oil_boom',
    name: '[设备] 环保拦污栅',
    type: 'INVESTIGATION',
    cost: 2,
    exhaust: true,
    description: '获得 2 个【拦污港栅】格子（非生物，每个具备 2 点生命值，可用于阻挡污染蔓延）。',
    scienceText: '物理拦截是海洋污染应急处置的第一道防线，常用于漏油、赤潮或固体垃圾圈围拦截。',
    effects: {
      grantsGrids: [{ gridId: 'grid_oil_boom', count: 2 }]
    }
  },
  'inv_wetland': {
    id: 'inv_wetland',
    name: '[调查] 湿地候鸟监测',
    type: 'INVESTIGATION',
    cost: 2,
    exhaust: true,
    description: '获得1个【黑脸琵鹭】格子。解锁【秋茄育苗实验室】。',
    scienceText: '候鸟是检验滩涂湿地健康状态的最灵敏“晴雨表”。',
    imageUrl: '/img/investigation_tools_clipboard.jpg',
    effects: {
      grantsGrids: [{ gridId: 'grid_spoonbill', count: 1 }],
      unlocksCard: 'bld_mangrove'
    }
  },
  'bld_mangrove': {
    id: 'bld_mangrove',
    name: '[建筑] 秋茄育苗室',
    type: 'BUILDING',
    cost: 4,
    exhaust: true,
    description: '持续3轮回，每轮产出1个【秋茄】(2x2)与1个【黑脸琵鹭】(1x1)。',
    scienceText: '秋茄采用“胎生”繁衍，为鸟类筑起海上森林，从而吸引黑脸琵鹭等珍稀鸟类在此栖息觅食。',
    imageUrl: '/img/mangrove_nursery_greenhouse.jpg',
    effects: {
      spawnsBuilding: 'bld_mangrove'
    }
  },
  'inv_seabed': {
    id: 'inv_seabed',
    name: '[调查] 披山海域调查',
    type: 'INVESTIGATION',
    cost: 2,
    exhaust: true,
    description: '获得1个【大黄鱼】(2x1)。解锁【人工鱼礁】。',
    scienceText: '摸清底栖生物数量底数，为划分保护区提供依据。',
    imageUrl: '/img/investigation_tools_clipboard.jpg',
    effects: {
      grantsGrids: [{ gridId: 'grid_croaker', count: 1 }],
      unlocksCard: 'bld_reef'
    }
  },
  'bld_reef': {
    id: 'bld_reef',
    name: '[建筑] 人工鱼礁放流站',
    type: 'BUILDING',
    cost: 4,
    exhaust: true,
    description: '持续3轮回，每轮产出1个【大黄鱼】群(2x1)与1个【疣荔枝螺】(1x1)。',
    scienceText: '人工鱼礁投入海底，为大黄鱼搭建安全的“海底公寓”，同时为荔枝螺等底栖生物提供附着基。',
    imageUrl: '/img/artificial_reef_deployment.jpg',
    effects: {
      spawnsBuilding: 'bld_reef'
    }
  },
  'inv_coast': {
    id: 'inv_coast',
    name: '[调查] 岸滩动力测绘',
    type: 'INVESTIGATION',
    cost: 2,
    exhaust: true,
    description: '进行地貌勘测，获得1个【牡蛎礁】。解锁【生态海堤】（产出牡蛎礁与秋茄）。',
    scienceText: '勘测海滩动力波浪，为“退海还滩”建立数据模型。',
    imageUrl: '/img/investigation_tools_clipboard.jpg',
    effects: {
      grantsGrids: [{ gridId: 'grid_oyster', count: 1 }],
      unlocksCard: 'bld_seawall'
    }
  },
  'bld_seawall': {
    id: 'bld_seawall',
    name: '[建筑] 复合型生态海堤',
    type: 'BUILDING',
    cost: 4,
    exhaust: true,
    description: '持续3轮回，每轮产出1个【牡蛎礁】消波防线(2x2)与1个【秋茄】(2x2)构建红树林防线。',
    scienceText: '红树林与天然牡蛎礁相互嵌套，构建了强大的“生态海堤”。利用活体牡蛎壳有效消波减灾，厚实的礁体净化海区水质，秋茄的根系牢牢固岸促淤。',
    imageUrl: '/img/ecological_seawall_cross_section.jpg',
    effects: {
      spawnsBuilding: 'bld_seawall'
    }
  },
  'evt_bridge': {
    id: 'evt_bridge',
    name: '[事件] 撤坝建桥',
    type: 'SPECIAL_EVENT',
    cost: 4,
    description: '【全局保护】强大的水流净化了版图上最多 6 个污染格子。此卡牌消耗，单局只能使用一次。',
    scienceText: '拆除漩门大坝改建桥梁，海水交换能力大幅回升。',
    effects: {
      globalEffect: 'CLEAR_POLLUTION_AMOUNT',
      count: 6
    }
  }
};

export const DISASTERS = [
  {
    disasterId: 'evt_spartina',
    name: '互花米草入侵',
    zoneId: 'coastal',
    targetSpecies: '秋茄 与 黑脸琵鹭',
    validGridDefIds: ['grid_spoonbill', 'grid_mangrove'],
    requirements: [
       { gridDefId: 'grid_mangrove', minCount: 4, name: '秋茄' },
       { gridDefId: 'grid_spoonbill', minCount: 1, name: '黑脸琵鹭' }
    ],
    areaWidth: 3,
    areaHeight: 2,
    pollutionCount: 4,
    relatedInvestigation: 'inv_wetland',
    scienceText: '互花米草是强势的外来入侵物种。在玉环乐清湾，它们疯狂挤占本土植物的生存空间，导致滩涂板结、底栖生物窒息，远道而来的珍稀候鸟也因此失去了落脚与觅食的家园。',
    successTitle: '生态告捷！黑脸琵鹭归来',
    successScienceText: '互花米草被成功清除，秋茄红树林重新扎根！红树林繁茂的根系不仅能为黑脸琵鹭等珍稀候鸟提供丰富的底栖生物作为食物，更成为了它们南迁途中重要的避风港湾。玉环湿地的生态防线已初步重建！',
    successImageUrl: '/img/black_faced_spoonbill.jpg'
  },
  {
    disasterId: 'evt_fishing',
    name: '毁灭性敲罟捕捞',
    zoneId: 'shallow_sea',
    targetSpecies: '大黄鱼 与 疣荔枝螺',
    validGridDefIds: ['grid_croaker', 'grid_snail'],
    requirements: [
       { gridDefId: 'grid_croaker', minCount: 2, name: '大黄鱼' },
       { gridDefId: 'grid_snail', minCount: 1, name: '疣荔枝螺' }
    ],
    areaWidth: 2,
    areaHeight: 3,
    pollutionCount: 4,
    relatedInvestigation: 'inv_seabed',
    scienceText: '历史上的非理性捕捞——敲罟作业（敲击竹竿利用声波震昏鱼群），对海洋生态造成了毁灭性打击。大黄鱼野生种群曾因此濒临灭绝。',
    successTitle: '生态告捷！金鳞重现乐清湾',
    successScienceText: '破坏性的捕捞活动已被根绝，海洋牧场的生态多样性正在恢复！繁育的疣荔枝螺及其他底栖生物净化了水质，为大黄鱼幼鱼提供了绝佳的隐蔽和索饵场所。玉环海域重现了历史上渔汛期的勃勃生机！'
  },
  {
    disasterId: 'evt_typhoon',
    name: '强台风侵袭',
    zoneId: 'coastal',
    targetSpecies: '牡蛎礁 与 秋茄',
    validGridDefIds: ['grid_oyster', 'grid_mangrove'],
    requirements: [
       { gridDefId: 'grid_oyster', minCount: 4, name: '牡蛎礁' },
       { gridDefId: 'grid_mangrove', minCount: 4, name: '秋茄' }
    ],
    areaWidth: 4,
    areaHeight: 2,
    pollutionCount: 4,
    relatedInvestigation: 'inv_coast',
    scienceText: '高强度的台风海浪冲刷，会导致海岸线后撤，岸滩出现严重的退化与泥化。',
    successTitle: '生态告捷！御风而立的“活体长城”',
    successScienceText: '红树林与天然牡蛎礁相互嵌套，构建了强大的“生态海堤”。厚实的礁体有效消波减能，秋茄粗壮的根系牢牢固岸促淤。这道天然的活体长堤成功抵御了狂风巨浪的侵袭，守护了后方的万家灯火！'
  }
];

export const INITIAL_DECK = ['basic_tourism', 'basic_tourism', 'basic_conservation', 'basic_cleanup', 'basic_cleanup', 'basic_cleanup', 'adv_cleanup', 'adv_cleanup', 'evt_bridge', 'inv_oil_boom', 'inv_oil_boom', 'inv_oil_boom'];

export const BUILDING_PRODUCTIONS: Record<string, { gridIds: string[], maxDuration: number }> = {
  'bld_mangrove': { gridIds: ['grid_mangrove', 'grid_spoonbill'], maxDuration: 3 },
  'bld_reef': { gridIds: ['grid_croaker', 'grid_snail'], maxDuration: 3 },
  'bld_seawall': { gridIds: ['grid_oyster', 'grid_mangrove'], maxDuration: 3 }
};
