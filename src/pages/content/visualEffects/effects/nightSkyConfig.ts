/**
 * Night Sky Configuration
 * Configuration for Night Sky particle effect using the generic particle engine
 * Premium UI aesthetics with sparkle shapes and natural clustering
 */

import type { ParticleConfig, Particle } from '../particleEngine/types';

const PALETTE = [
  '#FFFFFF', // Pure white
  '#FFF8F0', // Warm white
  '#F0F8FF', // Alice blue (slightly blue-white)
  '#FFEFD5', // Occasional golden (PapayaWhip)
];

const LAYERS = ['background', 'middle', 'foreground'];

// Cluster centers for natural distribution
const CLUSTER_COUNT = 5;

// Shooting star state
let shootingStarTimer = 0;
let shootingStarInterval = 1200 + Math.random() * 1800; // 20-50 seconds at 60fps

// Generate cluster centers for natural star distribution
function generateClusterCenters(canvasWidth: number, canvasHeight: number): Array<{ x: number; y: number }> {
  const clusters: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    clusters.push({
      x: 100 + Math.random() * (canvasWidth - 200),
      y: 100 + Math.random() * (canvasHeight - 200),
    });
  }
  return clusters;
}

// Get clustered position (stars tend to cluster around centers)
function getClusteredPosition(
  canvasWidth: number,
  canvasHeight: number,
  clusters: Array<{ x: number; y: number }>
): { x: number; y: number } {
  // 70% chance to be near a cluster, 30% random
  if (Math.random() < 0.7 && clusters.length > 0) {
    const cluster = clusters[Math.floor(Math.random() * clusters.length)];
    const spread = 150 + Math.random() * 100; // Spread around cluster
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * spread;
    let x = cluster.x + Math.cos(angle) * distance;
    let y = cluster.y + Math.sin(angle) * distance;
    
    // Keep within bounds
    x = Math.max(20, Math.min(canvasWidth - 20, x));
    y = Math.max(20, Math.min(canvasHeight - 20, y));
    return { x, y };
  }
  
  // Random position for remaining stars
  return {
    x: 20 + Math.random() * (canvasWidth - 40),
    y: 20 + Math.random() * (canvasHeight - 40),
  };
}

// Initialize clusters once
let clusterCenters: Array<{ x: number; y: number }> = [];

export const nightSkyConfig: ParticleConfig = {
  particleCount: 200,
  palette: PALETTE,
  spriteVariants: 4,
  layers: LAYERS,
  spriteSize: 90, // Large canvas for hero star glow
  useAdditiveBlending: true, // Use additive for premium glow effect
  
  spawnBehavior: (layer: string, canvasWidth: number, canvasHeight: number, _randomY: boolean): Particle => {
    // Initialize clusters on first spawn
    if (clusterCenters.length === 0) {
      clusterCenters = generateClusterCenters(canvasWidth, canvasHeight);
    }
    
    let size, baseOpacity, colorIndex, starClass, glowRadius;

    // Determine star class based on distribution
    const rand = Math.random();
    if (rand < 0.05) {
      // 5% hero stars (8-12px)
      starClass = 'hero';
      size = 8 + Math.random() * 4;
      baseOpacity = 0.9 + Math.random() * 0.1; // 0.9-1.0 (very bright)
      colorIndex = Math.random() < 0.1 ? 3 : 0; // 10% golden, rest pure white
      glowRadius = 25 + Math.random() * 20; // 25-45px glow
    } else if (rand < 0.30) {
      // 25% medium stars (4-6px)
      starClass = 'medium';
      size = 4 + Math.random() * 2;
      baseOpacity = 0.7 + Math.random() * 0.2; // 0.7-0.9
      colorIndex = Math.floor(Math.random() * 3);
      glowRadius = 8 + Math.random() * 7; // 8-15px glow
    } else {
      // 70% small stars (2-3px)
      starClass = 'small';
      size = 2 + Math.random() * 1;
      baseOpacity = 0.5 + Math.random() * 0.25; // 0.5-0.75
      colorIndex = Math.floor(Math.random() * 3);
      glowRadius = 0; // No glow
    }

    // Layer-specific adjustments
    switch (layer) {
      case 'background':
        baseOpacity *= 0.6; // Dimmer in background
        size *= 0.8;
        break;
      case 'middle':
        baseOpacity *= 0.8; // Normal in middle
        break;
      case 'foreground':
        baseOpacity *= 1.0; // Brighter in foreground
        size *= 1.1;
        break;
    }

    // Get clustered position
    const position = getClusteredPosition(canvasWidth, canvasHeight, clusterCenters);

    // Twinkling parameters - vary by star class
    const pulsePhase = Math.random() * Math.PI * 2;
    let pulseSpeed, minBrightness, maxBrightness;

    if (starClass === 'hero') {
      // Hero stars shimmer noticeably
      pulseSpeed = 0.02 + Math.random() * 0.03;
      minBrightness = 0.5 + Math.random() * 0.15; // 50-65%
      maxBrightness = 0.95 + Math.random() * 0.05; // 95-100%
    } else if (starClass === 'medium') {
      // Medium stars twinkle gently
      pulseSpeed = 0.015 + Math.random() * 0.02;
      minBrightness = 0.4 + Math.random() * 0.15; // 40-55%
      maxBrightness = 0.8 + Math.random() * 0.15; // 80-95%
    } else {
      // Small stars barely twinkle
      pulseSpeed = 0.005 + Math.random() * 0.01;
      minBrightness = 0.35 + Math.random() * 0.1; // 35-45%
      maxBrightness = 0.55 + Math.random() * 0.15; // 55-70%
    }

    return {
      x: position.x,
      y: position.y,
      size,
      speedY: 0, // Stationary
      speedX: 0,
      rotation: 0,
      rotationSpeed: 0,
      opacity: baseOpacity,
      layer,
      spriteIndex: starClass === 'hero' ? 0 : (starClass === 'medium' ? 1 : 2),
      pulsePhase,
      pulseSpeed,
      baseOpacity,
      minBrightness,
      maxBrightness,
      isHero: starClass === 'hero',
      glowRadius,
    };
  },

  updateBehavior: (particle: Particle, canvasWidth: number, canvasHeight: number, _splashes: any[]): void => {
    // Handle shooting star creation
    shootingStarTimer++;
    if (shootingStarTimer >= shootingStarInterval) {
      // Create shooting star
      shootingStarTimer = 0;
      shootingStarInterval = 1200 + Math.random() * 1800; // Reset interval (20-50 seconds)
      
      // Add shooting star as a special particle
      if (particle.isShootingStar === undefined) {
        particle.isShootingStar = true;
        particle.shootingStarLife = 50; // ~0.83 seconds at 60fps
        particle.shootingStarMaxLife = 50;
        
        // Start from random edge
        const startEdge = Math.floor(Math.random() * 4);
        switch (startEdge) {
          case 0: // Top
            particle.x = Math.random() * canvasWidth;
            particle.y = 0;
            particle.shootingStarSpeedX = 15 + Math.random() * 8;
            particle.shootingStarSpeedY = 8 + Math.random() * 5;
            break;
          case 1: // Right
            particle.x = canvasWidth;
            particle.y = Math.random() * canvasHeight;
            particle.shootingStarSpeedX = -(15 + Math.random() * 8);
            particle.shootingStarSpeedY = 8 + Math.random() * 5;
            break;
          case 2: // Bottom
            particle.x = Math.random() * canvasWidth;
            particle.y = canvasHeight;
            particle.shootingStarSpeedX = 15 + Math.random() * 8;
            particle.shootingStarSpeedY = -(8 + Math.random() * 5);
            break;
          case 3: // Left
            particle.x = 0;
            particle.y = Math.random() * canvasHeight;
            particle.shootingStarSpeedX = 15 + Math.random() * 8;
            particle.shootingStarSpeedY = 8 + Math.random() * 5;
            break;
        }
        
        particle.shootingStarTrail = [];
        particle.size = 5; // Larger shooting star
        particle.opacity = 1;
      }
    }

    // Handle shooting star movement
    if (particle.isShootingStar && particle.shootingStarLife !== undefined) {
      particle.shootingStarLife--;
      
      // Move shooting star
      if (particle.shootingStarSpeedX !== undefined && particle.shootingStarSpeedY !== undefined) {
        particle.x += particle.shootingStarSpeedX;
        particle.y += particle.shootingStarSpeedY;
      }
      
      // Update trail
      if (particle.shootingStarTrail !== undefined) {
        particle.shootingStarTrail.push({ x: particle.x, y: particle.y });
        if (particle.shootingStarTrail.length > 25) {
          particle.shootingStarTrail.shift();
        }
      }
      
      // Fade out near end
      if (particle.shootingStarLife < 15) {
        particle.opacity = particle.shootingStarLife / 15;
      }
      
      // Reset when done
      if (particle.shootingStarLife <= 0) {
        particle.isShootingStar = false;
        particle.x = Math.random() * canvasWidth;
        particle.y = Math.random() * canvasHeight;
        particle.opacity = particle.baseOpacity || 0.5;
      }
      
      return; // Skip twinkling for shooting star
    }

    // Regular star twinkling - smooth independent breathing
    if (particle.pulsePhase !== undefined && particle.pulseSpeed !== undefined && 
        particle.minBrightness !== undefined && particle.maxBrightness !== undefined) {
      particle.pulsePhase += particle.pulseSpeed;
      
      // Use sine wave for smooth oscillation between min and max brightness
      const pulse = (Math.sin(particle.pulsePhase) + 1) / 2; // 0 to 1
      const brightnessRange = particle.maxBrightness - particle.minBrightness;
      particle.opacity = particle.minBrightness + pulse * brightnessRange;
      
      // Hero stars shimmer more intensely
      if (particle.isHero) {
        particle.opacity = Math.min(1, particle.opacity * 1.15);
      }
      
      // Clamp opacity
      particle.opacity = Math.max(0.3, Math.min(1, particle.opacity));
    }
  },

  spriteGenerator: (index: number, color: string, ctx: CanvasRenderingContext2D): void => {
    const size = 90; // Large canvas for premium glow
    const centerX = size / 2;
    const centerY = size / 2;

    if (index === 0) {
      // Hero star - four-point sparkle with large glow
      // Create large radial glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
      glowGradient.addColorStop(0, color);
      glowGradient.addColorStop(0.1, color + 'EE');
      glowGradient.addColorStop(0.25, color + '88');
      glowGradient.addColorStop(0.5, color + '44');
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw four-point sparkle
      ctx.fillStyle = color;
      ctx.beginPath();
      // Horizontal beam
      ctx.moveTo(centerX - 12, centerY);
      ctx.lineTo(centerX + 12, centerY);
      // Vertical beam
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX, centerY + 12);
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      
      // Center bright point
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (index === 1) {
      // Medium star - small sparkle with moderate glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
      glowGradient.addColorStop(0, color);
      glowGradient.addColorStop(0.2, color + 'CC');
      glowGradient.addColorStop(0.5, color + '66');
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Small four-point sparkle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY);
      ctx.lineTo(centerX + 6, centerY);
      ctx.moveTo(centerX, centerY - 6);
      ctx.lineTo(centerX, centerY + 6);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      
      // Center point
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fill();
      
    } else {
      // Small star - simple circle, no glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.3, color + 'EE');
      gradient.addColorStop(0.7, color + '66');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

