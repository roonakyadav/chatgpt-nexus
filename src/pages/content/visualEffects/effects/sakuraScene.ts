/**
 * Sakura Scene
 * Handles particle simulation and rendering for cherry blossom petals
 * Uses the generic ParticleSystem with Sakura-specific configuration
 */

import { ParticleSystem } from '../particleEngine/ParticleSystem';
import { SpriteCache } from '../particleEngine/SpriteCache';
import { sakuraConfig } from './sakuraConfig';

const SPRITE_CACHE = new SpriteCache();

export class SakuraScene {
  private particleSystem: ParticleSystem | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.particleSystem = new ParticleSystem(canvas, ctx, sakuraConfig, SPRITE_CACHE);
  }

  start(): void {
    if (this.particleSystem) {
      this.particleSystem.start();
    }
  }

  stop(): void {
    if (this.particleSystem) {
      this.particleSystem.stop();
    }
  }

  resize(width: number, height: number): void {
    if (this.particleSystem) {
      this.particleSystem.resize(width, height);
    }
  }

  getParticleCount(): number {
    if (this.particleSystem) {
      return this.particleSystem.getParticleCount();
    }
    return 0;
  }
}
