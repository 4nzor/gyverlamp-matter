import { LampMode } from '../types';

export const LAMP_MODES: LampMode[] = [
  {
    id: 'fire',
    name: 'Огонь',
    category: 'classic',
    icon: 'Flame',
    defaultSpeed: 140,
    defaultScale: 85,
    description: 'Органический эффект языков пламени с реалистичным градиентом жара и искрами.',
    paletteColors: ['#ff1a00', '#ff6a00', '#ffcc00', '#330000']
  },
  {
    id: 'matrix',
    name: 'Матрица',
    category: 'classic',
    icon: 'Terminal',
    defaultSpeed: 110,
    defaultScale: 60,
    description: 'Цифровой зелёный дождь в стиле киберпанка с мерцающими ведущими символами.',
    paletteColors: ['#00ff66', '#009933', '#003311', '#c8ffc8']
  },
  {
    id: 'rainbow',
    name: 'Радуга 3D',
    category: 'classic',
    icon: 'Rainbow',
    defaultSpeed: 80,
    defaultScale: 120,
    description: 'Плавный переливающийся спектральный градиент по цилиндру лампы.',
    paletteColors: ['#ff0055', '#ffaa00', '#00ff88', '#00aaff', '#aa00ff']
  },
  {
    id: 'aurora',
    name: 'Северное сияние',
    category: 'ambient',
    icon: 'Sparkles',
    defaultSpeed: 60,
    defaultScale: 90,
    description: 'Мягкие космические волны изумрудных, лавандовых и бирюзовых оттенков.',
    paletteColors: ['#00ffb7', '#2575fc', '#6a11cb', '#00d2ff']
  },
  {
    id: 'candle',
    name: 'Свеча',
    category: 'ambient',
    icon: 'Zap',
    defaultSpeed: 95,
    defaultScale: 50,
    description: 'Тёплый трепет фитиля свечи с естественными микроколебаниями воздуха.',
    paletteColors: ['#ff9900', '#ff5500', '#ffe680', '#4a1500']
  },
  {
    id: 'lava',
    name: 'Лава-лампа',
    category: 'ambient',
    icon: 'Droplets',
    defaultSpeed: 70,
    defaultScale: 110,
    description: 'Плавающие капли нагретой лавы, сливающиеся и перетекающие по высоте лампы.',
    paletteColors: ['#ff007f', '#7928ca', '#ff4b1f', '#1f1c2c']
  },
  {
    id: 'starfall',
    name: 'Звездопад',
    category: 'classic',
    icon: 'Star',
    defaultSpeed: 130,
    defaultScale: 75,
    description: 'Мерцающее звёздное небо с периодически падающими яркими метеорами.',
    paletteColors: ['#ffffff', '#a0c4ff', '#bdb2ff', '#1a1b35']
  },
  {
    id: 'whirlpool',
    name: 'Водоворот',
    category: 'dynamic',
    icon: 'RotateCw',
    defaultSpeed: 150,
    defaultScale: 100,
    description: 'Спиральное вихревое вращение неоновых волн вокруг оси лампы.',
    paletteColors: ['#00f2fe', '#4facfe', '#000c40', '#667eea']
  },
  {
    id: 'confetti',
    name: 'Конфетти',
    category: 'dynamic',
    icon: 'PartyPopper',
    defaultSpeed: 120,
    defaultScale: 70,
    description: 'Вспыхивающие и медленно угасающие разноцветные брызги праздничных искр.',
    paletteColors: ['#ff007f', '#00f2fe', '#f9d423', '#7000ff']
  },
  {
    id: 'pulse',
    name: 'Неоновый пульс',
    category: 'dynamic',
    icon: 'Activity',
    defaultSpeed: 160,
    defaultScale: 130,
    description: 'Энергичные концентрические волны светового ритма от центра к краям.',
    paletteColors: ['#f80759', '#bc4e9c', '#61045f', '#1a0525']
  },
  {
    id: 'warm_white',
    name: 'Тёплый свет',
    category: 'lighting',
    icon: 'Sun',
    defaultSpeed: 20,
    defaultScale: 50,
    description: 'Комфортное белое освещение 2700K для чтения и вечернего отдыха.',
    paletteColors: ['#ffdfa9', '#ffcc70', '#ffe5b4']
  },
  {
    id: 'breathing',
    name: 'Дыхание',
    category: 'lighting',
    icon: 'Heart',
    defaultSpeed: 50,
    defaultScale: 60,
    description: 'Гармоничное медитативное дыхание света с мягким повышением и спадом яркости.',
    paletteColors: ['#ff80bf', '#a370f7', '#ffd3e2']
  }
];

export const CATEGORIES = [
  { id: 'all', name: 'Все эффекты' },
  { id: 'classic', name: 'Классика' },
  { id: 'ambient', name: 'Атмосфера' },
  { id: 'dynamic', name: 'Динамика' },
  { id: 'lighting', name: 'Освещение' },
] as const;
