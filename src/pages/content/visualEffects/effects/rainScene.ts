/**
 * Rain Scene
 * Handles particle simulation and rendering for raindrops
 * Uses the generic ParticleSystem with Rain-specific configuration
 */

import { ParticleSystem } from '../particleEngine/ParticleSystem';
import { SpriteCache } from '../particleEngine/SpriteCache';
import { rainConfig } from './rainConfig';

const SPRITE_CACHE = new SpriteCache();

export class RainScene {
  private particleSystem: ParticleSystem | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.particleSystem = new ParticleSystem(canvas, ctx, rainConfig, SPRITE_CACHE);
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
