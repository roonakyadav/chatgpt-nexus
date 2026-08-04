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
  scaleX: number;
  wobblePhase: number;
  wobbleSpeed: number;
  windPhase: number;
  windSpeed: number;
  flutterPhase: number;
  flutterSpeed: number;
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
  private time = 0;

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
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -10);
      spriteCtx.quadraticCurveTo(10, -5, 10, 0);
      spriteCtx.quadraticCurveTo(10, 5, 0, 10);
      spriteCtx.quadraticCurveTo(-10, 5, -10, 0);
      spriteCtx.quadraticCurveTo(-10, -5, 0, -10);
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
        speedY = 0.3 + Math.random() * 0.5; // 0.3-0.8
        opacity = 0.2 + Math.random() * 0.2; // 0.2-0.4
        speedX = (Math.random() - 0.5) * 1; // -0.5 to 0.5
        break;
      case 'middle':
        size = 10 + Math.random() * 8; // 10-18px
        speedY = 0.6 + Math.random() * 0.8; // 0.6-1.4
        opacity = 0.4 + Math.random() * 0.3; // 0.4-0.7
        speedX = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
        break;
      case 'foreground':
        size = 16 + Math.random() * 10; // 16-26px
        speedY = 0.9 + Math.random() * 1.1; // 0.9-2.0
        opacity = 0.6 + Math.random() * 0.3; // 0.6-0.9
        speedX = (Math.random() - 0.5) * 2; // -1 to 1
        break;
    }

    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -30,
      size,
      speedY,
      speedX,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      opacity,
      scaleX: 0.8 + Math.random() * 0.4, // 0.8-1.2
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      windPhase: Math.random() * Math.PI * 2,
      windSpeed: 0.005 + Math.random() * 0.01,
      flutterPhase: Math.random() * Math.PI * 2,
      flutterSpeed: 0.1 + Math.random() * 0.15,
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
    ctx.scale(petal.scaleX, 1);
    ctx.globalAlpha = petal.opacity;

    // Draw cached sprite centered
    ctx.drawImage(sprite, -petal.size / 2, -petal.size / 2, petal.size, petal.size);

    ctx.restore();
  }

  private updateParticles(): void {
    const canvas = this.canvas;
    if (!canvas) return;

    this.time += 1;

    for (const petal of this.petals) {
      // Update position
      petal.y += petal.speedY;

      // Complex wind system: long-period wind + individual drift + flutter
      const longWind = Math.sin(this.time * petal.windSpeed + petal.windPhase) * 0.5;
      const flutter = Math.sin(this.time * petal.flutterSpeed + petal.flutterPhase) * 0.3;
      petal.x += petal.speedX + longWind + flutter;

      // Rotation with wobble
      petal.rotation += petal.rotationSpeed;
      const wobble = Math.sin(this.time * petal.wobbleSpeed + petal.wobblePhase) * 0.02;
      petal.rotation += wobble;

      // X-scale flipping to simulate 3D rotation
      const flipPhase = Math.sin(this.time * petal.wobbleSpeed * 0.5 + petal.wobblePhase);
      petal.scaleX = 0.8 + flipPhase * 0.4;

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
        petal.scaleX = newPetal.scaleX;
        petal.wobblePhase = newPetal.wobblePhase;
        petal.wobbleSpeed = newPetal.wobbleSpeed;
        petal.windPhase = newPetal.windPhase;
        petal.windSpeed = newPetal.windSpeed;
        petal.flutterPhase = newPetal.flutterPhase;
        petal.flutterSpeed = newPetal.flutterSpeed;
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

  private animate = (): void => {
    this.render();
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  start(): void {
    if (this.animationFrameId !== null) {
      console.warn('[SakuraScene] Animation already running');
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
