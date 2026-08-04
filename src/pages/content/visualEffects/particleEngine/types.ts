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
}

export interface ParticleConfig {
  particleCount: number;
  palette: string[];
  spriteVariants: number;
  layers: string[];
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean) => Particle;
  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number) => void;
  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D) => void;
}

export interface SpriteCache {
  get(key: string): HTMLCanvasElement | undefined;
  set(key: string, sprite: HTMLCanvasElement): void;
  has(key: string): boolean;
  size(): number;
}
