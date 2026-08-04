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
  color: string;
}

const PARTICLE_COUNT = 80;
const PALETTE = [
  '#FFB7C5', // Pale pink
  '#FFC0CB', // Pink
  '#FFD1DC', // Light pink
  '#FFE4E9', // Very light pink
  '#FFA5B9', // Slightly deeper pink
];

export class SakuraScene {
  private petals: Petal[] = [];
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.initParticles();
  }

  private initParticles(): void {
    this.petals = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.petals.push(this.createPetal(true));
    }
  }

  private createPetal(randomY: boolean = false): Petal {
    const canvas = this.canvas;
    if (!canvas) {
      throw new Error('Canvas not initialized');
    }

    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -20,
      size: 8 + Math.random() * 12, // 8-20px
      speedY: 0.5 + Math.random() * 1.5, // 0.5-2.0 pixels per frame
      speedX: (Math.random() - 0.5) * 1.5, // -0.75 to 0.75 drift
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05, // -0.025 to 0.025 radians per frame
      opacity: 0.4 + Math.random() * 0.4, // 0.4-0.8
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    };
  }

  private drawPetal(petal: Petal): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.rotation);
    ctx.globalAlpha = petal.opacity;
    ctx.fillStyle = petal.color;

    // Draw cherry blossom petal shape using quadratic curves
    ctx.beginPath();
    ctx.moveTo(0, -petal.size / 2);
    ctx.quadraticCurveTo(petal.size / 2, -petal.size / 4, petal.size / 2, 0);
    ctx.quadraticCurveTo(petal.size / 2, petal.size / 4, 0, petal.size / 2);
    ctx.quadraticCurveTo(-petal.size / 2, petal.size / 4, -petal.size / 2, 0);
    ctx.quadraticCurveTo(-petal.size / 2, -petal.size / 4, 0, -petal.size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private updateParticles(): void {
    const canvas = this.canvas;
    if (!canvas) return;

    for (const petal of this.petals) {
      // Update position
      petal.y += petal.speedY;
      petal.x += petal.speedX;
      petal.rotation += petal.rotationSpeed;

      // Add gentle horizontal oscillation
      petal.x += Math.sin(petal.y * 0.01) * 0.3;

      // Recycle if off screen
      if (petal.y > canvas.height + 20) {
        petal.y = -20;
        petal.x = Math.random() * canvas.width;
      }

      // Wrap horizontally
      if (petal.x > canvas.width + 20) {
        petal.x = -20;
      } else if (petal.x < -20) {
        petal.x = canvas.width + 20;
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
