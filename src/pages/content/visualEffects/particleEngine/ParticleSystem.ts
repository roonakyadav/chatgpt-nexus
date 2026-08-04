/**
 * Particle System
 * Generic particle animation system for visual effects
 */

import type { Particle, ParticleConfig, SpriteCache } from './types';
import { EffectLifecycle } from './EffectLifecycle';

export class ParticleSystem {
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private spriteCache: SpriteCache;
  private lifecycle: EffectLifecycle;
  private config: ParticleConfig;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: ParticleConfig,
    spriteCache: SpriteCache
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = config;
    this.spriteCache = spriteCache;
    this.lifecycle = new EffectLifecycle(
      () => this.onPause(),
      () => this.onResume()
    );
    
    this.generateSprites();
    this.initParticles();
  }

  private generateSprites(): void {
    if (this.spriteCache.size() > 0) return; // Already cached

    for (let i = 0; i < this.config.spriteVariants; i++) {
      const color = this.config.palette[i % this.config.palette.length];
      const sprite = document.createElement('canvas');
      sprite.width = 24;
      sprite.height = 24;
      const spriteCtx = sprite.getContext('2d');
      if (!spriteCtx) continue;

      spriteCtx.translate(12, 12);
      this.config.spriteGenerator(i, color, spriteCtx);

      this.spriteCache.set(`sprite_${i}`, sprite);
    }
  }

  private initParticles(): void {
    this.particles = [];
    const particlesPerLayer = Math.floor(this.config.particleCount / this.config.layers.length);

    for (let i = 0; i < this.config.particleCount; i++) {
      const layerIndex = Math.floor(i / particlesPerLayer);
      const layer = this.config.layers[Math.min(layerIndex, this.config.layers.length - 1)];
      this.particles.push(this.config.spawnBehavior(layer, this.canvas!.width, this.canvas!.height, true));
    }

    // Sort by layer for proper rendering order
    this.particles.sort((a, b) => {
      const layerOrder: Record<string, number> = {};
      this.config.layers.forEach((l, i) => layerOrder[l] = i);
      return layerOrder[a.layer] - layerOrder[b.layer];
    });
  }

  private drawParticle(particle: Particle): void {
    if (!this.ctx) return;

    const sprite = this.spriteCache.get(`sprite_${particle.spriteIndex}`);
    if (!sprite) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;

    ctx.drawImage(sprite, -particle.size / 2, -particle.size / 2, particle.size, particle.size);

    ctx.restore();
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const particle of this.particles) {
      this.config.updateBehavior(particle, this.canvas.width, this.canvas.height);
      this.drawParticle(particle);
    }
  }

  private animate(): void {
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private onPause(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private onResume(): void {
    if (this.animationFrameId === null) {
      this.animate();
    }
  }

  start(): void {
    if (!this.lifecycle.shouldRun()) {
      return;
    }
    if (this.animationFrameId !== null) {
      return;
    }
    this.animate();
  }

  stop(): void {
    this.lifecycle.cleanup();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.initParticles();
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
