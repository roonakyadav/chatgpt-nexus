/**
 * Fireflies Configuration
 * Configuration for Fireflies particle effect using the generic particle engine
 * Redesigned for a peaceful summer evening atmosphere
 */

import type { ParticleConfig, Particle } from '../particleEngine/types';

const PALETTE = [
  '#FFF7AE', // Core - warm pale yellow
  '#FFE66D', // Glow - golden yellow
  '#FFD54A', // Outer glow - amber
  '#FFFDE7', // Occasional brighter - pale cream
];

const LAYERS = ['background', 'middle', 'foreground'];

export const firefliesConfig: ParticleConfig = {
  particleCount: 45,
  palette: PALETTE,
  spriteVariants: 4,
  layers: LAYERS,
  spriteSize: 48,
  useAdditiveBlending: true,
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean): Particle => {
    let size, baseOpacity, wanderSpeed, colorIndex;

    switch (layer) {
      case 'background':
        size = 6 + Math.random() * 3; // 6-9px (small but visible)
        baseOpacity = 0.25 + Math.random() * 0.15; // 0.25-0.4 (dim)
        wanderSpeed = 0.15 + Math.random() * 0.2; // Very slow
        colorIndex = Math.random() < 0.3 ? 3 : 0; // Occasional brighter
        break;
      case 'middle':
        size = 8 + Math.random() * 3; // 8-11px (normal)
        baseOpacity = 0.4 + Math.random() * 0.2; // 0.4-0.6
        wanderSpeed = 0.25 + Math.random() * 0.25;
        colorIndex = Math.random() < 0.2 ? 3 : Math.floor(Math.random() * 3);
        break;
      case 'foreground':
        size = 10 + Math.random() * 3; // 10-13px (larger)
        baseOpacity = 0.55 + Math.random() * 0.25; // 0.55-0.8 (bright)
        wanderSpeed = 0.35 + Math.random() * 0.3; // Slightly faster
        colorIndex = Math.random() < 0.25 ? 3 : Math.floor(Math.random() * 3);
        break;
      default:
        size = 8 + Math.random() * 3;
        baseOpacity = 0.4 + Math.random() * 0.2;
        wanderSpeed = 0.25 + Math.random() * 0.25;
        colorIndex = Math.floor(Math.random() * 3);
    }

    // Curved path movement parameters
    const wanderAngle = Math.random() * Math.PI * 2;
    const curveAmplitude = 0.5 + Math.random() * 0.5;
    const curveFrequency = 0.01 + Math.random() * 0.02;
    const curvePhase = Math.random() * Math.PI * 2;
    const verticalDrift = (Math.random() - 0.5) * 0.3; // Gentle rise/descend tendency
    
    const pulsePhase = Math.random() * Math.PI * 2;
    const pulseSpeed = 0.015 + Math.random() * 0.02; // Slower, smoother pulse

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
      spriteIndex: colorIndex,
      pulsePhase,
      pulseSpeed,
      baseOpacity,
      wanderAngle,
      wanderSpeed,
      curveAmplitude,
      curveFrequency,
      curvePhase,
      verticalDrift,
      pauseTimer: Math.random() * 120, // Random pause start time (longer)
      pauseDuration: 60 + Math.random() * 90, // Pause duration
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, _splashes: any[]): void => {
    // Handle pause timer
    if (particle.pauseTimer !== undefined && particle.pauseTimer > 0) {
      particle.pauseTimer--;
      return; // Paused, don't move
    }

    // Occasionally pause (less frequent, longer pauses for calm feel)
    if (Math.random() < 0.005) {
      particle.pauseTimer = particle.pauseDuration || 90;
      return;
    }

    // Curved path movement - smooth organic wandering
    if (particle.wanderAngle !== undefined && particle.curveAmplitude !== undefined && 
        particle.curveFrequency !== undefined && particle.curvePhase !== undefined) {
      
      // Update curve phase for smooth oscillation
      particle.curvePhase += particle.curveFrequency;
      
      // Calculate curved movement
      const curveOffset = Math.sin(particle.curvePhase) * particle.curveAmplitude;
      const currentAngle = particle.wanderAngle + curveOffset * 0.5;
      
      // Very slowly change base wander angle
      particle.wanderAngle += (Math.random() - 0.5) * 0.02;
      
      // Move based on curved angle
      if (particle.wanderSpeed !== undefined) {
        particle.x += Math.cos(currentAngle) * particle.wanderSpeed;
        particle.y += Math.sin(currentAngle) * particle.wanderSpeed;
      }
      
      // Add gentle vertical drift (rise/descend tendency)
      if (particle.verticalDrift !== undefined) {
        particle.y += particle.verticalDrift;
      }
    }

    // Wrap around screen with larger margin for glow
    const margin = 50;
    if (particle.x < -margin) particle.x = canvasWidth + margin;
    if (particle.x > canvasWidth + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = canvasHeight + margin;
    if (particle.y > canvasHeight + margin) particle.y = -margin;

    // Smooth twinkling - pulse opacity with different phases
    if (particle.pulsePhase !== undefined && particle.pulseSpeed !== undefined && particle.baseOpacity !== undefined) {
      particle.pulsePhase += particle.pulseSpeed;
      // Use cosine for smoother pulse, reduced amplitude for gentler effect
      const pulse = Math.cos(particle.pulsePhase) * 0.2;
      particle.opacity = particle.baseOpacity + pulse;
      
      // Clamp opacity to maintain visibility
      particle.opacity = Math.max(0.15, Math.min(1, particle.opacity));
    }
  },

  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D): void => {
    // Create larger glow sprite with multiple gradient layers
    const size = 48; // Much larger for extended glow
    const centerX = size / 2;
    const centerY = size / 2;

    // Create multi-layer radial gradient for rich glow effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    
    // Core - bright warm center
    gradient.addColorStop(0, color);
    
    // Inner glow - soft halo
    gradient.addColorStop(0.15, color);
    
    // Mid glow - extended soft glow
    gradient.addColorStop(0.4, color + 'CC');
    
    // Outer glow - very soft fade
    gradient.addColorStop(0.7, color + '66');
    
    // Edge fade to transparent
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
  },
};
