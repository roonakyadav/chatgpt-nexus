/**
 * Visual Effects Types
 * Scalable architecture for adding new visual effects
 */

export type VisualEffect = 'off' | 'sakura' | 'snow';

export const VISUAL_EFFECTS: readonly VisualEffect[] = ['off', 'sakura', 'snow'] as const;

export type PerformanceCost = 'low' | 'medium' | 'high';

export interface VisualEffectConfig {
  id: VisualEffect;
  name: string;
  description: string;
  emoji: string;
  performanceCost: PerformanceCost;
  supportsLightTheme: boolean;
  supportsDarkTheme: boolean;
  thumbnail?: string; // Optional thumbnail image
}

export const VISUAL_EFFECT_CONFIGS: Record<VisualEffect, VisualEffectConfig> = {
  off: {
    id: 'off',
    name: 'Off',
    description: 'No visual effects',
    emoji: '⬜',
    performanceCost: 'low',
    supportsLightTheme: true,
    supportsDarkTheme: true,
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    description: 'Soft drifting cherry blossom petals',
    emoji: '🌸',
    performanceCost: 'low',
    supportsLightTheme: true,
    supportsDarkTheme: true,
  },
  snow: {
    id: 'snow',
    name: 'Snow',
    description: 'Gentle falling snowflakes',
    emoji: '❄',
    performanceCost: 'low',
    supportsLightTheme: true,
    supportsDarkTheme: true,
  },
};

// Future effects (coming soon)
export interface ComingSoonEffect {
  id: string;
  name: string;
  emoji: string;
}

export const COMING_SOON_EFFECTS: ComingSoonEffect[] = [
  { id: 'rain', name: 'Rain', emoji: '🌧' },
  { id: 'fireflies', name: 'Fireflies', emoji: '✨' },
  { id: 'autumn-leaves', name: 'Autumn Leaves', emoji: '🍂' },
];
