/**
 * Particle System
 * Generic particle animation system for visual effects
 */

import type { Particle, ParticleConfig, SpriteCache, Splash } from './types';
import { EffectLifecycle } from './EffectLifecycle';

export class ParticleSystem {
  private particles: Particle[] = [];
  private splashes: Splash[] = [];
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

    // Use custom render behavior if provided (for line rendering)
    if (this.config.renderBehavior && particle.isLine) {
      const color = this.config.palette[particle.spriteIndex % this.config.palette.length];
      this.config.renderBehavior(this.ctx, particle, color);
      return;
    }

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

  private drawSplash(splash: Splash): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = splash.opacity;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private updateSplashes(): void {
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const splash = this.splashes[i];
      splash.life--;
      splash.radius += 0.3;
      splash.opacity = splash.life / splash.maxLife;

      if (splash.life <= 0) {
        this.splashes.splice(i, 1);
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set additive blending if configured
    if (this.config.useAdditiveBlending) {
      this.ctx.globalCompositeOperation = 'lighter';
    }

    this.updateSplashes();

    for (const particle of this.particles) {
      this.config.updateBehavior(particle, this.canvas.width, this.canvas.height, this.splashes);
      this.drawParticle(particle);
    }

    for (const splash of this.splashes) {
      this.drawSplash(splash);
    }

    // Reset composite operation
    if (this.config.useAdditiveBlending) {
      this.ctx.globalCompositeOperation = 'source-over';
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
