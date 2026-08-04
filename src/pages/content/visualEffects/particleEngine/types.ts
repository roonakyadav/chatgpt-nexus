/**
 * Particle Engine Types
 * Shared types and interfaces for particle effects
 */

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  layer: string;
  spriteIndex: number;
  // Optional rain-specific properties
  length?: number;
  isLine?: boolean;
  splashActive?: boolean;
  splashLife?: number;
  splashRadius?: number;
}

export interface Splash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export interface ParticleConfig {
  particleCount: number;
  palette: string[];
  spriteVariants: number;
  layers: string[];
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean) => Particle;
  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, splashes: Splash[]) => void;
  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D) => void;
  renderBehavior?: (ctx: CanvasRenderingContext2D, particle: Particle, color: string) => void;
  useLineRendering?: boolean;
}

export interface SpriteCache {
  get(key: string): HTMLCanvasElement | undefined;
  set(key: string, sprite: HTMLCanvasElement): void;
  has(key: string): boolean;
  size(): number;
}
