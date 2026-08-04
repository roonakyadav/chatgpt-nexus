/**
 * Fireflies Scene
 * Handles particle simulation and rendering for fireflies
 * Uses the generic ParticleSystem with Fireflies-specific configuration
 */

import { ParticleSystem } from '../particleEngine/ParticleSystem';
import { SpriteCache } from '../particleEngine/SpriteCache';
import { firefliesConfig } from './firefliesConfig';

const SPRITE_CACHE = new SpriteCache();

export class FirefliesScene {
  private particleSystem: ParticleSystem | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.particleSystem = new ParticleSystem(canvas, ctx, firefliesConfig, SPRITE_CACHE);
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
