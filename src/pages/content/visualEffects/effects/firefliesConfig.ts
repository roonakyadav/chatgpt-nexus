/**
 * Fireflies Configuration
 * Configuration for Fireflies particle effect using the generic particle engine
 * Completely redesigned for insect-like destination-based movement
 */

import type { ParticleConfig, Particle } from '../particleEngine/types';

const PALETTE = [
  '#FFFDE7', // Core - pale cream
  '#FFF59D', // Inner glow - soft yellow
  '#FFE66D', // Outer glow - golden yellow
  '#FFFFFF', // Occasional brighter - pure white
];

const LAYERS = ['background', 'middle', 'foreground'];

// Helper function to choose a random destination nearby
function chooseNearbyDestination(
  currentX: number,
  currentY: number,
  canvasWidth: number,
  canvasHeight: number,
  range: number
): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * range;
  let newX = currentX + Math.cos(angle) * distance;
  let newY = currentY + Math.sin(angle) * distance;

  // Keep within bounds with margin
  const margin = 50;
  newX = Math.max(margin, Math.min(canvasWidth - margin, newX));
  newY = Math.max(margin, Math.min(canvasHeight - margin, newY));

  return { x: newX, y: newY };
}

export const firefliesConfig: ParticleConfig = {
  particleCount: 65,
  palette: PALETTE,
  spriteVariants: 4,
  layers: LAYERS,
  spriteSize: 80,
  useAdditiveBlending: true,
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, randomY: boolean): Particle => {
    let size, baseOpacity, flightSpeed, colorIndex;

    switch (layer) {
      case 'background':
        size = 3 + Math.random() * 2; // 3-5px core
        baseOpacity = 0.3 + Math.random() * 0.15; // 0.3-0.45 (dim)
        flightSpeed = 0.3 + Math.random() * 0.3; // Very slow
        colorIndex = Math.random() < 0.2 ? 3 : 0; // Occasional brighter
        break;
      case 'middle':
        size = 4 + Math.random() * 2; // 4-6px core
        baseOpacity = 0.45 + Math.random() * 0.2; // 0.45-0.65
        flightSpeed = 0.4 + Math.random() * 0.4;
        colorIndex = Math.random() < 0.15 ? 3 : Math.floor(Math.random() * 3);
        break;
      case 'foreground':
        size = 5 + Math.random() * 2; // 5-7px core
        baseOpacity = 0.6 + Math.random() * 0.25; // 0.6-0.85 (bright)
        flightSpeed = 0.5 + Math.random() * 0.4; // Slightly faster
        colorIndex = Math.random() < 0.2 ? 3 : Math.floor(Math.random() * 3);
        break;
      default:
        size = 4 + Math.random() * 2;
        baseOpacity = 0.45 + Math.random() * 0.2;
        flightSpeed = 0.4 + Math.random() * 0.4;
        colorIndex = Math.floor(Math.random() * 3);
    }

    const startX = Math.random() * canvasWidth;
    const startY = randomY ? Math.random() * canvasHeight : Math.random() * canvasHeight;
    
    // Choose initial destination
    const initialDest = chooseNearbyDestination(startX, startY, canvasWidth, canvasHeight, 80);
    
    // Twinkling parameters
    const pulsePhase = Math.random() * Math.PI * 2;
    const pulseSpeed = 0.02 + Math.random() * 0.025; // Smooth breathing

    return {
      x: startX,
      y: startY,
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
      destX: initialDest.x,
      destY: initialDest.y,
      flightSpeed,
      arrivalThreshold: 5 + Math.random() * 5, // 5-10px arrival threshold
      pauseTimer: 30 + Math.random() * 60, // Initial pause (0.5-1.5s at 60fps)
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, _splashes: any[]): void => {
    // Handle pause timer
    if (particle.pauseTimer !== undefined && particle.pauseTimer > 0) {
      particle.pauseTimer--;
      
      // When pause ends, choose new destination
      if (particle.pauseTimer <= 0) {
        const newDest = chooseNearbyDestination(
          particle.x,
          particle.y,
          canvasWidth,
          canvasHeight,
          60 + Math.random() * 60 // 60-120px range
        );
        particle.destX = newDest.x;
        particle.destY = newDest.y;
      }
      return; // Paused, don't move
    }

    // Check if we've reached the destination
    if (particle.destX !== undefined && particle.destY !== undefined && particle.arrivalThreshold !== undefined) {
      const dx = particle.destX - particle.x;
      const dy = particle.destY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < particle.arrivalThreshold) {
        // Arrived - pause for 0.5-2 seconds (30-120 frames at 60fps)
        particle.pauseTimer = 30 + Math.random() * 90;
        return;
      }

      // Fly toward destination with natural deceleration
      if (particle.flightSpeed !== undefined) {
        // Calculate direction
        const angle = Math.atan2(dy, dx);
        
        // Decelerate as we approach destination
        const speedFactor = Math.min(1, distance / 50); // Slow down when within 50px
        const currentSpeed = particle.flightSpeed * speedFactor;

        particle.x += Math.cos(angle) * currentSpeed;
        particle.y += Math.sin(angle) * currentSpeed;
      }
    }

    // Twinkling - smooth breathing from 40% to 100% to 40%
    if (particle.pulsePhase !== undefined && particle.pulseSpeed !== undefined && particle.baseOpacity !== undefined) {
      particle.pulsePhase += particle.pulseSpeed;
      // Use sine wave mapped to 0.4-1.0 range
      const pulse = (Math.sin(particle.pulsePhase) + 1) / 2; // 0 to 1
      particle.opacity = particle.baseOpacity * (0.4 + pulse * 0.6); // 40% to 100% of base
      
      // Clamp opacity
      particle.opacity = Math.max(0.2, Math.min(1, particle.opacity));
    }
  },

  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D): void => {
    // Create large glow sprite with rich radial gradient
    const size = 80; // Large canvas for extended glow
    const centerX = size / 2;
    const centerY = size / 2;

    // Create multi-layer radial gradient for premium glow effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    
    // Bright core - 3-5px equivalent
    gradient.addColorStop(0, color);
    
    // Inner glow - soft halo
    gradient.addColorStop(0.08, color);
    
    // Mid glow - extended soft area
    gradient.addColorStop(0.25, color + 'EE');
    
    // Outer glow - very soft fade
    gradient.addColorStop(0.5, color + '88');
    
    // Far outer glow - subtle presence
    gradient.addColorStop(0.75, color + '33');
    
    // Edge fade to transparent
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
  },
};
