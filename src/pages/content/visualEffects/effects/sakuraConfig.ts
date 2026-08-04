/**
 * Sakura Configuration
 * Configuration for Sakura particle effect using the generic particle engine
 */

import type { ParticleConfig, Particle } from '../particleEngine/types';

const PALETTE = [
  '#FFB7C5', // Pale pink
  '#FFC0CB', // Pink
  '#FFD1DC', // Light pink
  '#FFE4E9', // Very light pink
  '#FFA5B9', // Slightly deeper pink
];

const LAYERS = ['background', 'middle', 'foreground'];

export const sakuraConfig: ParticleConfig = {
  particleCount: 80,
  palette: PALETTE,
  spriteVariants: 5,
  layers: LAYERS,
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean): Particle => {
    let size, speedY, opacity, speedX;

    switch (layer) {
      case 'background':
        size = 6 + Math.random() * 6; // 6-12px
        speedY = 0.2 + Math.random() * 0.35; // 0.2-0.55
        opacity = 0.2 + Math.random() * 0.2; // 0.2-0.4
        speedX = (Math.random() - 0.5) * 0.7; // -0.35 to 0.35
        break;
      case 'middle':
        size = 10 + Math.random() * 8; // 10-18px
        speedY = 0.4 + Math.random() * 0.55; // 0.4-0.95
        opacity = 0.4 + Math.random() * 0.3; // 0.4-0.7
        speedX = (Math.random() - 0.5) * 1; // -0.5 to 0.5
        break;
      case 'foreground':
        size = 16 + Math.random() * 10; // 16-26px
        speedY = 0.6 + Math.random() * 0.75; // 0.6-1.35
        opacity = 0.6 + Math.random() * 0.3; // 0.6-0.9
        speedX = (Math.random() - 0.5) * 1.4; // -0.7 to 0.7
        break;
      default:
        size = 10 + Math.random() * 8;
        speedY = 0.4 + Math.random() * 0.55;
        opacity = 0.4 + Math.random() * 0.3;
        speedX = (Math.random() - 0.5) * 1;
    }

    return {
      x: Math.random() * canvasWidth,
      y: randomY ? Math.random() * canvasHeight : -30,
      size,
      speedY,
      speedX,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      opacity,
      layer,
      spriteIndex: Math.floor(Math.random() * 5),
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, _splashes: any[]): void => {
    // Update position
    particle.y += particle.speedY;

    // Gentle horizontal wind (single component)
    particle.x += particle.speedX + Math.sin(particle.y * 0.01) * 0.2;

    // Slow rotation only
    particle.rotation += particle.rotationSpeed;

    // Recycle if off screen
    if (particle.y > canvasHeight + 30) {
      const newParticle = sakuraConfig.spawnBehavior(particle.layer, canvasWidth, canvasHeight, false);
      particle.x = newParticle.x;
      particle.y = newParticle.y;
      particle.size = newParticle.size;
      particle.speedY = newParticle.speedY;
      particle.speedX = newParticle.speedX;
      particle.rotation = newParticle.rotation;
      particle.rotationSpeed = newParticle.rotationSpeed;
      particle.opacity = newParticle.opacity;
      particle.spriteIndex = newParticle.spriteIndex;
    }

    // Wrap horizontally
    if (particle.x > canvasWidth + 30) {
      particle.x = -30;
    } else if (particle.x < -30) {
      particle.x = canvasWidth + 30;
    }
  },

  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D): void => {
    ctx.fillStyle = color;

    // Create 5 different petal silhouettes
    ctx.beginPath();
    switch (index) {
      case 0: // Narrow
        ctx.moveTo(0, -12);
        ctx.quadraticCurveTo(6, -6, 6, 0);
        ctx.quadraticCurveTo(6, 6, 0, 12);
        ctx.quadraticCurveTo(-6, 6, -6, 0);
        ctx.quadraticCurveTo(-6, -6, 0, -12);
        break;
      case 1: // Wide
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(12, -4, 12, 0);
        ctx.quadraticCurveTo(12, 4, 0, 8);
        ctx.quadraticCurveTo(-12, 4, -12, 0);
        ctx.quadraticCurveTo(-12, -4, 0, -8);
        break;
      case 2: // Slightly curved
        ctx.moveTo(0, -10);
        ctx.bezierCurveTo(8, -8, 10, 0, 8, 4);
        ctx.quadraticCurveTo(4, 8, 0, 10);
        ctx.bezierCurveTo(-8, 8, -10, 0, -8, -4);
        ctx.quadraticCurveTo(-4, -8, 0, -10);
        break;
      case 3: // Rounded
        ctx.moveTo(0, -9);
        ctx.quadraticCurveTo(9, -5, 9, 0);
        ctx.quadraticCurveTo(9, 5, 0, 9);
        ctx.quadraticCurveTo(-9, 5, -9, 0);
        ctx.quadraticCurveTo(-9, -5, 0, -9);
        break;
      case 4: // Elongated
        ctx.moveTo(0, -14);
        ctx.quadraticCurveTo(5, -7, 5, 0);
        ctx.quadraticCurveTo(5, 7, 0, 14);
        ctx.quadraticCurveTo(-5, 7, -5, 0);
        ctx.quadraticCurveTo(-5, -7, 0, -14);
        break;
    }
    ctx.closePath();
    ctx.fill();
  },
};
