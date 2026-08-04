/**
 * Sakura Scene
 * Handles particle simulation and rendering for cherry blossom petals
 */

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  layer: 'background' | 'middle' | 'foreground';
  spriteIndex: number;
}

const PARTICLE_COUNT = 80;
const PALETTE = [
  '#FFB7C5', // Pale pink
  '#FFC0CB', // Pink
  '#FFD1DC', // Light pink
  '#FFE4E9', // Very light pink
  '#FFA5B9', // Slightly deeper pink
];

const SPRITE_VARIANTS = 5;
const SPRITE_CACHE: Map<string, HTMLCanvasElement> = new Map();

export class SakuraScene {
  private petals: Petal[] = [];
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.generateSprites();
    this.initParticles();
  }

  private generateSprites(): void {
    if (SPRITE_CACHE.size > 0) return; // Already cached

    for (let i = 0; i < SPRITE_VARIANTS; i++) {
      const color = PALETTE[i % PALETTE.length];
      const sprite = document.createElement('canvas');
      sprite.width = 24;
      sprite.height = 24;
      const spriteCtx = sprite.getContext('2d');
      if (!spriteCtx) continue;

      // Draw petal shape centered on sprite
      spriteCtx.translate(12, 12);
      spriteCtx.fillStyle = color;

      // Create 5 different petal silhouettes
      spriteCtx.beginPath();
      switch (i) {
        case 0: // Narrow
          spriteCtx.moveTo(0, -12);
          spriteCtx.quadraticCurveTo(6, -6, 6, 0);
          spriteCtx.quadraticCurveTo(6, 6, 0, 12);
          spriteCtx.quadraticCurveTo(-6, 6, -6, 0);
          spriteCtx.quadraticCurveTo(-6, -6, 0, -12);
          break;
        case 1: // Wide
          spriteCtx.moveTo(0, -8);
          spriteCtx.quadraticCurveTo(12, -4, 12, 0);
          spriteCtx.quadraticCurveTo(12, 4, 0, 8);
          spriteCtx.quadraticCurveTo(-12, 4, -12, 0);
          spriteCtx.quadraticCurveTo(-12, -4, 0, -8);
          break;
        case 2: // Slightly curved
          spriteCtx.moveTo(0, -10);
          spriteCtx.bezierCurveTo(8, -8, 10, 0, 8, 4);
          spriteCtx.quadraticCurveTo(4, 8, 0, 10);
          spriteCtx.bezierCurveTo(-8, 8, -10, 0, -8, -4);
          spriteCtx.quadraticCurveTo(-4, -8, 0, -10);
          break;
        case 3: // Rounded
          spriteCtx.moveTo(0, -9);
          spriteCtx.quadraticCurveTo(9, -5, 9, 0);
          spriteCtx.quadraticCurveTo(9, 5, 0, 9);
          spriteCtx.quadraticCurveTo(-9, 5, -9, 0);
          spriteCtx.quadraticCurveTo(-9, -5, 0, -9);
          break;
        case 4: // Elongated
          spriteCtx.moveTo(0, -14);
          spriteCtx.quadraticCurveTo(5, -7, 5, 0);
          spriteCtx.quadraticCurveTo(5, 7, 0, 14);
          spriteCtx.quadraticCurveTo(-5, 7, -5, 0);
          spriteCtx.quadraticCurveTo(-5, -7, 0, -14);
          break;
      }
      spriteCtx.closePath();
      spriteCtx.fill();

      SPRITE_CACHE.set(`sprite_${i}`, sprite);
    }
  }

  private initParticles(): void {
    this.petals = [];
    const layers: ('background' | 'middle' | 'foreground')[] = ['background', 'middle', 'foreground'];
    const particlesPerLayer = Math.floor(PARTICLE_COUNT / 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const layerIndex = Math.floor(i / particlesPerLayer);
      const layer = layers[Math.min(layerIndex, 2)];
      this.petals.push(this.createPetal(layer, true));
    }

    // Sort by layer for proper rendering order
    this.petals.sort((a, b) => {
      const layerOrder = { background: 0, middle: 1, foreground: 2 };
      return layerOrder[a.layer] - layerOrder[b.layer];
    });
  }

  private createPetal(layer: 'background' | 'middle' | 'foreground', randomY: boolean = false): Petal {
    const canvas = this.canvas;
    if (!canvas) {
      throw new Error('Canvas not initialized');
    }

    let size, speedY, opacity, speedX;

    switch (layer) {
      case 'background':
        size = 6 + Math.random() * 6; // 6-12px
        speedY = 0.2 + Math.random() * 0.35; // 0.2-0.55 (reduced by ~30%)
        opacity = 0.2 + Math.random() * 0.2; // 0.2-0.4
        speedX = (Math.random() - 0.5) * 0.7; // -0.35 to 0.35
        break;
      case 'middle':
        size = 10 + Math.random() * 8; // 10-18px
        speedY = 0.4 + Math.random() * 0.55; // 0.4-0.95 (reduced by ~30%)
        opacity = 0.4 + Math.random() * 0.3; // 0.4-0.7
        speedX = (Math.random() - 0.5) * 1; // -0.5 to 0.5
        break;
      case 'foreground':
        size = 16 + Math.random() * 10; // 16-26px
        speedY = 0.6 + Math.random() * 0.75; // 0.6-1.35 (reduced by ~30%)
        opacity = 0.6 + Math.random() * 0.3; // 0.6-0.9
        speedX = (Math.random() - 0.5) * 1.4; // -0.7 to 0.7
        break;
    }

    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -30,
      size,
      speedY,
      speedX,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      opacity,
      layer,
      spriteIndex: Math.floor(Math.random() * SPRITE_VARIANTS),
    };
  }

  private drawPetal(petal: Petal): void {
    if (!this.ctx) return;

    const sprite = SPRITE_CACHE.get(`sprite_${petal.spriteIndex}`);
    if (!sprite) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.rotation);
    ctx.globalAlpha = petal.opacity;

    // Draw cached sprite centered
    ctx.drawImage(sprite, -petal.size / 2, -petal.size / 2, petal.size, petal.size);

    ctx.restore();
  }

  private updateParticles(): void {
    const canvas = this.canvas;
    if (!canvas) return;

    for (const petal of this.petals) {
      // Update position
      petal.y += petal.speedY;

      // Gentle horizontal wind (single component)
      petal.x += petal.speedX + Math.sin(petal.y * 0.01) * 0.2;

      // Slow rotation only
      petal.rotation += petal.rotationSpeed;

      // Recycle if off screen
      if (petal.y > canvas.height + 30) {
        const newPetal = this.createPetal(petal.layer, false);
        petal.x = newPetal.x;
        petal.y = newPetal.y;
        petal.size = newPetal.size;
        petal.speedY = newPetal.speedY;
        petal.speedX = newPetal.speedX;
        petal.rotation = newPetal.rotation;
        petal.rotationSpeed = newPetal.rotationSpeed;
        petal.opacity = newPetal.opacity;
        petal.spriteIndex = newPetal.spriteIndex;
      }

      // Wrap horizontally
      if (petal.x > canvas.width + 30) {
        petal.x = -30;
      } else if (petal.x < -30) {
        petal.x = canvas.width + 30;
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.updateParticles();
    for (const petal of this.petals) {
      this.drawPetal(petal);
    }
  }

  private animate(): void {
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  start(): void {
    if (this.animationFrameId !== null) {
      return;
    }
    this.animate();
  }

  stop(): void {
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
    // Re-initialize particles to cover new dimensions
    this.initParticles();
  }

  getParticleCount(): number {
    return this.petals.length;
  }
}
