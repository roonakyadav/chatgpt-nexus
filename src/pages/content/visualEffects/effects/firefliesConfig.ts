/**
 * Fireflies Configuration
 * Configuration for Fireflies particle effect using the generic particle engine
 */

import type { ParticleConfig, Particle } from '../particleEngine/types';

const PALETTE = [
  '#FFF8B0', // Warm yellow
  '#FFE66D', // Golden yellow
  '#FFD54A', // Amber
];

const LAYERS = ['background', 'middle', 'foreground'];

export const firefliesConfig: ParticleConfig = {
  particleCount: 45,
  palette: PALETTE,
  spriteVariants: 3,
  layers: LAYERS,
  useAdditiveBlending: true,
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean): Particle => {
    let size, baseOpacity, wanderSpeed;

    switch (layer) {
      case 'background':
        size = 3 + Math.random() * 2; // 3-5px (small)
        baseOpacity = 0.3 + Math.random() * 0.15; // 0.3-0.45 (faint)
        wanderSpeed = 0.2 + Math.random() * 0.3; // Slow
        break;
      case 'middle':
        size = 5 + Math.random() * 3; // 5-8px (normal)
        baseOpacity = 0.5 + Math.random() * 0.2; // 0.5-0.7
        wanderSpeed = 0.3 + Math.random() * 0.4;
        break;
      case 'foreground':
        size = 7 + Math.random() * 4; // 7-11px (slightly larger)
        baseOpacity = 0.6 + Math.random() * 0.25; // 0.6-0.85
        wanderSpeed = 0.4 + Math.random() * 0.5;
        break;
      default:
        size = 5 + Math.random() * 3;
        baseOpacity = 0.5 + Math.random() * 0.2;
        wanderSpeed = 0.3 + Math.random() * 0.4;
    }

    const wanderAngle = Math.random() * Math.PI * 2;
    const pulsePhase = Math.random() * Math.PI * 2;
    const pulseSpeed = 0.02 + Math.random() * 0.03;

    return {
      x: Math.random() * canvasWidth,
      y: randomY ? Math.random() * canvasHeight : Math.random() * canvasHeight,
      size,
      speedY: 0,
      speedX: 0,
      rotation: 0,
      rotationSpeed: 0,
      opacity: baseOpacity,
      layer,
      spriteIndex: Math.floor(Math.random() * 3),
      pulsePhase,
      pulseSpeed,
      baseOpacity,
      wanderAngle,
      wanderSpeed,
      pauseTimer: Math.random() * 60, // Random pause start time
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, _splashes: any[]): void => {
    // Handle pause timer
    if (particle.pauseTimer !== undefined && particle.pauseTimer > 0) {
      particle.pauseTimer--;
      return; // Paused, don't move
    }

    // Occasionally pause (every 120-240 frames)
    if (Math.random() < 0.01) {
      particle.pauseTimer = 60 + Math.random() * 60;
      return;
    }

    // Wandering motion - slowly change direction
    if (particle.wanderAngle !== undefined) {
      particle.wanderAngle += (Math.random() - 0.5) * 0.1;
      
      // Occasionally change direction more significantly
      if (Math.random() < 0.02) {
        particle.wanderAngle += (Math.random() - 0.5) * 0.5;
      }
    }

    // Move based on wander angle and speed
    if (particle.wanderSpeed !== undefined && particle.wanderAngle !== undefined) {
      particle.x += Math.cos(particle.wanderAngle) * particle.wanderSpeed;
      particle.y += Math.sin(particle.wanderAngle) * particle.wanderSpeed;
    }

    // Occasionally rise or descend
    if (Math.random() < 0.01) {
      particle.y += (Math.random() - 0.5) * 2;
    }

    // Wrap around screen
    if (particle.x < -20) particle.x = canvasWidth + 20;
    if (particle.x > canvasWidth + 20) particle.x = -20;
    if (particle.y < -20) particle.y = canvasHeight + 20;
    if (particle.y > canvasHeight + 20) particle.y = -20;

    // Twinkling - pulse opacity
    if (particle.pulsePhase !== undefined && particle.pulseSpeed !== undefined && particle.baseOpacity !== undefined) {
      particle.pulsePhase += particle.pulseSpeed;
      const pulse = Math.sin(particle.pulsePhase) * 0.3; // Pulse amplitude
      particle.opacity = particle.baseOpacity + pulse;
      
      // Clamp opacity
      particle.opacity = Math.max(0.1, Math.min(1, particle.opacity));
    }
  },

  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D): void => {
    // Create glow sprite with radial gradient
    const size = 24;
    const centerX = size / 2;
    const centerY = size / 2;

    // Create radial gradient for soft glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, color); // Center - bright
    gradient.addColorStop(0.3, color); // Inner glow
    gradient.addColorStop(0.6, color + '80'); // Mid glow with transparency
    gradient.addColorStop(1, 'transparent'); // Outer fade

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
  },
};
