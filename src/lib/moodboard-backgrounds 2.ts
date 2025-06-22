// Strategic visual backgrounds for moodboards
// Each pattern is designed to evoke different aesthetic moods

export interface MoodboardBackground {
  id: string;
  name: string;
  description: string;
  colors: string[];
  pattern: string;
  overlay?: string;
}

export const MOODBOARD_BACKGROUNDS: MoodboardBackground[] = [
  {
    id: 'minimalist-grid',
    name: 'Minimalist Grid',
    description: 'Clean lines and geometric precision',
    colors: ['#f8f9fa', '#e9ecef', '#dee2e6'],
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dee2e6' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='1' height='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'editorial-dots',
    name: 'Editorial Dots',
    description: 'Magazine-inspired dot matrix',
    colors: ['#fefefe', '#f1f3f4', '#e8eaed'],
    pattern: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e8eaed' fill-opacity='0.15'%3E%3Ccircle cx='3' cy='3' r='0.5'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'organic-texture',
    name: 'Organic Texture',
    description: 'Natural, hand-drawn aesthetic',
    colors: ['#faf9f7', '#f5f4f2', '#ede8e0'],
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ede8e0' fill-opacity='0.08'%3E%3Cpath d='M5 5c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'luxury-weave',
    name: 'Luxury Weave',
    description: 'Sophisticated textile pattern',
    colors: ['#fcfcfc', '#f7f7f7', '#f0f0f0'],
    pattern: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.12'%3E%3Crect x='0' y='0' width='15' height='1'/%3E%3Crect x='0' y='15' width='15' height='1'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'studio-lines',
    name: 'Studio Lines',
    description: 'Creative workspace vibes',
    colors: ['#fdfdfd', '#f8f8f8', '#eeeeee'],
    pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23eeeeee' fill-opacity='0.06'%3E%3Cpath d='M0 50h100M50 0v100' stroke='%23eeeeee' stroke-width='0.5'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'gallery-paper',
    name: 'Gallery Paper',
    description: 'Museum-quality backdrop',
    colors: ['#fefefe', '#fafafa', '#f5f5f5'],
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5f5f5' fill-opacity='0.05'%3E%3Crect x='0' y='0' width='40' height='40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'fashion-sketch',
    name: 'Fashion Sketch',
    description: 'Designer sketchbook feel',
    colors: ['#fdfcfa', '#f9f8f6', '#f2f0ec'],
    pattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f2f0ec' fill-opacity='0.08'%3E%3Cpath d='M0 25h50M25 0v50' stroke='%23f2f0ec' stroke-width='0.3' stroke-dasharray='2,8'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: 'modern-grain',
    name: 'Modern Grain',
    description: 'Contemporary texture',
    colors: ['#ffffff', '#fbfbfb', '#f6f6f6'],
    pattern: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f6f6f6' fill-opacity='0.1'%3E%3Cpath d='M0 0h12v12H0zM12 12h12v12H12z'/%3E%3C/g%3E%3C/svg%3E")`,
  }
];

// Generate a consistent background for a moodboard based on its ID
export function getMoodboardBackground(moodboardId: string): MoodboardBackground {
  // Use a simple hash function to consistently map IDs to backgrounds
  let hash = 0;
  for (let i = 0; i < moodboardId.length; i++) {
    const char = moodboardId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % MOODBOARD_BACKGROUNDS.length;
  return MOODBOARD_BACKGROUNDS[index];
}

// Generate dynamic accent elements for moodboard cards
export function getMoodboardAccents(moodboardId: string) {
  const background = getMoodboardBackground(moodboardId);
  
  // Generate deterministic but varied accent positions
  let hash = 0;
  for (let i = 0; i < moodboardId.length; i++) {
    hash = ((hash << 5) - hash) + moodboardId.charCodeAt(i);
  }
  
  const accents = [];
  const accentCount = 2 + (Math.abs(hash) % 3); // 2-4 accents
  
  for (let i = 0; i < accentCount; i++) {
    const seedHash = hash + i * 1234;
    accents.push({
      type: ['circle', 'line', 'square'][Math.abs(seedHash) % 3],
      x: (Math.abs(seedHash * 17) % 80) + 10, // 10-90%
      y: (Math.abs(seedHash * 31) % 80) + 10, // 10-90%
      rotation: Math.abs(seedHash * 43) % 360,
      opacity: 0.03 + (Math.abs(seedHash * 23) % 7) * 0.01, // 0.03-0.09
      size: 20 + (Math.abs(seedHash * 53) % 40), // 20-60px
    });
  }
  
  return {
    background,
    accents,
  };
}