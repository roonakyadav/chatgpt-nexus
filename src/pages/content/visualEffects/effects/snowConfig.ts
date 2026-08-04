/**
 * Snow Configuration
 * Configuration for Snow particle effect using the generic particle engine
 */

import type { ParticleConfig, Particle } from '../particleEngine/types';

const PALETTE = [
  '#FFFFFF', // Pure white
  '#F8FAFC', // Very light gray (slate-50)
  '#F1F5F9', // Light gray (slate-100)
  '#E2E8F0', // Light gray-blue (slate-200)
  '#CBD5E1', // Gray-blue (slate-300)
];

const LAYERS = ['background', 'middle', 'foreground'];

export const snowConfig: ParticleConfig = {
  particleCount: 140,
  palette: PALETTE,
  spriteVariants: 5,
  layers: LAYERS,
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean): Particle => {
    let size, speedY, opacity, speedX, rotationSpeed;

    switch (layer) {
      case 'background':
        size = 2 + Math.random() * 3; // 2-5px (tiny)
        speedY = 0.3 + Math.random() * 0.4; // 0.3-0.7 (slow)
        opacity = 0.3 + Math.random() * 0.2; // 0.3-0.5 (faint)
        speedX = (Math.random() - 0.5) * 0.5; // -0.25 to 0.25
        rotationSpeed = 0; // No rotation for small flakes
        break;
      case 'middle':
        size = 4 + Math.random() * 4; // 4-8px (medium)
        speedY = 0.5 + Math.random() * 0.5; // 0.5-1.0
        opacity = 0.5 + Math.random() * 0.2; // 0.5-0.7
        speedX = (Math.random() - 0.5) * 0.7; // -0.35 to 0.35
        rotationSpeed = (Math.random() - 0.5) * 0.005; // Very slow rotation
        break;
      case 'foreground':
        size = 6 + Math.random() * 5; // 6-11px (larger)
        speedY = 0.7 + Math.random() * 0.6; // 0.7-1.3 (slightly faster)
        opacity = 0.6 + Math.random() * 0.25; // 0.6-0.85
        speedX = (Math.random() - 0.5) * 0.9; // -0.45 to 0.45
        rotationSpeed = (Math.random() - 0.5) * 0.01; // Slow rotation
        break;
      default:
        size = 4 + Math.random() * 4;
        speedY = 0.5 + Math.random() * 0.5;
        opacity = 0.5 + Math.random() * 0.2;
        speedX = (Math.random() - 0.5) * 0.7;
        rotationSpeed = (Math.random() - 0.5) * 0.005;
    }

    return {
      x: Math.random() * canvasWidth,
      y: randomY ? Math.random() * canvasHeight : -20,
      size,
      speedY,
      speedX,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed,
      opacity,
      layer,
      spriteIndex: Math.floor(Math.random() * 5),
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, _splashes: any[]): void => {
    // Update position
    particle.y += particle.speedY;

    // Gentle horizontal drift
    particle.x += particle.speedX + Math.sin(particle.y * 0.005) * 0.15;

    // Rotation (only for larger flakes)
    particle.rotation += particle.rotationSpeed;

    // Recycle if off screen
    if (particle.y > canvasHeight + 20) {
      const newParticle = snowConfig.spawnBehavior(particle.layer, canvasWidth, canvasHeight, false);
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
    if (particle.x > canvasWidth + 20) {
      particle.x = -20;
    } else if (particle.x < -20) {
      particle.x = canvasWidth + 20;
    }
  },

  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D): void => {
    ctx.fillStyle = color;

    // Create 5 different snowflake shapes
    ctx.beginPath();
    switch (index) {
      case 0: // Simple circle
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        break;
      case 1: // Slightly larger circle
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        break;
      case 2: // Crystal-like (6-pointed star)
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle + Math.PI / 6) * 4, Math.sin(angle + Math.PI / 6) * 4);
        }
        break;
      case 3: // Small circle
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        break;
      case 4: // Medium circle with slight variation
        ctx.ellipse(0, 0, 7, 6, 0, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
  },
};
