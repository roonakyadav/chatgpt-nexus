/**
 * Visual Effects Types
 * Scalable architecture for adding new visual effects
 */

export type VisualEffect = 'off' | 'sakura';

export const VISUAL_EFFECTS: readonly VisualEffect[] = ['off', 'sakura'] as const;

export interface VisualEffectConfig {
  id: VisualEffect;
  name: string;
  description: string;
  emoji: string;
}

export const VISUAL_EFFECT_CONFIGS: Record<VisualEffect, VisualEffectConfig> = {
  off: {
    id: 'off',
    name: 'Off',
    description: 'No visual effects',
    emoji: '⬜',
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    description: 'Soft drifting cherry blossom petals',
    emoji: '🌸',
  },
};
