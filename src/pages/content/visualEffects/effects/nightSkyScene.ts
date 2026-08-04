/**
 * Night Sky Scene
 * Handles particle simulation and rendering for night sky stars
 * Uses the generic ParticleSystem with Night Sky-specific configuration
 */

import { ParticleSystem } from '../particleEngine/ParticleSystem';
import { SpriteCache } from '../particleEngine/SpriteCache';
import { nightSkyConfig } from './nightSkyConfig';

const SPRITE_CACHE = new SpriteCache();

export class NightSkyScene {
  private particleSystem: ParticleSystem | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.particleSystem = new ParticleSystem(canvas, ctx, nightSkyConfig, SPRITE_CACHE);
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
