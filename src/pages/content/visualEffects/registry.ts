/**
 * Visual Effects Registry
 * Central registry for visual effect plugins
 */

import type { VisualEffect } from './types';

export class VisualEffectsRegistry {
  private effects = new Map<string, VisualEffect>();

  /**
   * Register a visual effect plugin
   */
  register(effect: VisualEffect): void {
    if (this.effects.has(effect.id)) {
      console.warn(`[VisualEffectsRegistry] Effect with id "${effect.id}" is already registered. Overwriting.`);
    }
    this.effects.set(effect.id, effect);
  }

  /**
   * Get a visual effect by id
   */
  get(id: string): VisualEffect | undefined {
    return this.effects.get(id);
  }

  /**
   * Check if an effect is registered
   */
  has(id: string): boolean {
    return this.effects.has(id);
  }

  /**
   * Get all registered effect ids
   */
  getAllIds(): string[] {
    return Array.from(this.effects.keys());
  }
}
