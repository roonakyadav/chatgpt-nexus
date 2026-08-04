/**
 * Sprite Cache
 * Manages cached canvas sprites for particle effects
 */

import type { SpriteCache as ISpriteCache } from './types';

export class SpriteCache implements ISpriteCache {
  private cache = new Map<string, HTMLCanvasElement>();

  get(key: string): HTMLCanvasElement | undefined {
    return this.cache.get(key);
  }

  set(key: string, sprite: HTMLCanvasElement): void {
    this.cache.set(key, sprite);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}
