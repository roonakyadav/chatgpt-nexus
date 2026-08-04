/**
 * Rain Configuration
 * Configuration for Rain particle effect using the generic particle engine
 */

import type { ParticleConfig, Particle, Splash } from '../particleEngine/types';

const PALETTE = [
  '#94a3b8', // Slate-400 (blue-gray)
  '#64748b', // Slate-500
  '#475569', // Slate-600
  '#cbd5e1', // Slate-300 (lighter)
  '#334155', // Slate-700 (darker)
];

const LAYERS = ['background', 'middle', 'foreground'];

// Constant wind angle (10-15 degrees from vertical)
const WIND_ANGLE = 12 * (Math.PI / 180); // 12 degrees in radians
const WIND_X = Math.sin(WIND_ANGLE) * 0.5; // Horizontal wind component
const WIND_Y = Math.cos(WIND_ANGLE); // Vertical component

export const rainConfig: ParticleConfig = {
  particleCount: 200,
  palette: PALETTE,
  spriteVariants: 5,
  layers: LAYERS,
  useLineRendering: true,
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean): Particle => {
    let length, speedY, opacity, speedX;

    switch (layer) {
      case 'background':
        length = 8 + Math.random() * 6; // 8-14px (thinner)
        speedY = 4 + Math.random() * 2; // 4-6 (slower)
        opacity = 0.15 + Math.random() * 0.1; // 0.15-0.25 (more transparent)
        speedX = WIND_X * 0.8;
        break;
      case 'middle':
        length = 12 + Math.random() * 8; // 12-20px (standard)
        speedY = 6 + Math.random() * 3; // 6-9
        opacity = 0.25 + Math.random() * 0.15; // 0.25-0.4
        speedX = WIND_X;
        break;
      case 'foreground':
        length = 16 + Math.random() * 10; // 16-26px (thicker)
        speedY = 8 + Math.random() * 4; // 8-12 (faster)
        opacity = 0.35 + Math.random() * 0.2; // 0.35-0.55 (brighter)
        speedX = WIND_X * 1.2;
        break;
      default:
        length = 12 + Math.random() * 8;
        speedY = 6 + Math.random() * 3;
        opacity = 0.25 + Math.random() * 0.15;
        speedX = WIND_X;
    }

    return {
      x: Math.random() * canvasWidth,
      y: randomY ? Math.random() * canvasHeight : -30,
      size: length,
      speedY: speedY * WIND_Y,
      speedX,
      rotation: 0,
      rotationSpeed: 0,
      opacity,
      layer,
      spriteIndex: Math.floor(Math.random() * 5),
      length,
      isLine: true,
      splashActive: false,
      splashLife: 0,
      splashRadius: 0,
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, splashes: Splash[]): void => {
    // Update position with diagonal motion
    particle.y += particle.speedY;
    particle.x += particle.speedX;

    // Recycle if off screen (bottom)
    if (particle.y > canvasHeight + 30) {
      // Create splash
      if (!particle.splashActive) {
        splashes.push({
          x: particle.x,
          y: canvasHeight - 5,
          life: 12, // ~200ms at 60fps
          maxLife: 12,
          radius: 2,
          maxRadius: 8,
          opacity: particle.opacity,
        });
        particle.splashActive = true;
      }

      // Recycle particle
      const newParticle = rainConfig.spawnBehavior(particle.layer, canvasWidth, canvasHeight, false);
      particle.x = newParticle.x;
      particle.y = newParticle.y;
      particle.size = newParticle.size;
      particle.speedY = newParticle.speedY;
      particle.speedX = newParticle.speedX;
      particle.length = newParticle.length;
      particle.opacity = newParticle.opacity;
      particle.spriteIndex = newParticle.spriteIndex;
      particle.splashActive = false;
    }

    // Wrap horizontally
    if (particle.x > canvasWidth + 30) {
      particle.x = -30;
    } else if (particle.x < -30) {
      particle.x = canvasWidth + 30;
    }
  },

  spriteGenerator: (_index: number, _color: string, _ctx: CanvasRenderingContext2D): void => {
    // Rain uses line rendering, not sprites
  },

  renderBehavior: (ctx: CanvasRenderingContext2D, particle: Particle, color: string): void => {
    if (!particle.length || !particle.isLine) return;

    ctx.save();
    ctx.globalAlpha = particle.opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = particle.size / 8; // Thin line based on length
    ctx.lineCap = 'round';

    // Draw diagonal line (raindrop)
    const angle = Math.atan2(particle.speedX, particle.speedY);
    const length = particle.length;
    
    ctx.translate(particle.x, particle.y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, length);
    ctx.stroke();

    ctx.restore();
  },
};
