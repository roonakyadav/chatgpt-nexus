/**
 * Night Sky Scene
 * Layered ambient scene with 5 independent layers
 * NOT a particle effect - a premium ambient desktop environment
 */

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  minBrightness: number;
  maxBrightness: number;
  rotation: number;
  rotationSpeed: number;
  layer: 'background' | 'medium' | 'hero';
  spriteIndex: number;
}

interface ShootingStar {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
  trail: Array<{ x: number; y: number }>;
  active: boolean;
}

interface SpriteCache {
  [key: string]: HTMLCanvasElement;
}

export class NightSkyScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private width: number;
  private height: number;
  
  // Layer data
  private backgroundStars: Star[] = [];
  private mediumStars: Star[] = [];
  private heroStars: Star[] = [];
  private shootingStar: ShootingStar | null = null;
  
  // Sprite cache
  private spriteCache: SpriteCache = {};
  
  // Shooting star timer
  private shootingStarTimer = 0;
  private shootingStarInterval = 1500 + Math.random() * 2100; // 25-60 seconds at 60fps
  
  // Cluster centers for natural distribution
  private clusterCenters: Array<{ x: number; y: number }> = [];
  
  // Atmospheric glow gradients (cached)
  private glowGradients: CanvasGradient[] = [];
  
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.initializeSprites();
    this.initializeStars();
    this.initializeAtmosphericGlow();
  }
  
  private initializeAtmosphericGlow(): void {
    // Create cached gradients for atmospheric glow
    const gradient1 = this.ctx.createRadialGradient(
      this.width * 0.3, this.height * 0.4, 0,
      this.width * 0.3, this.height * 0.4, this.width * 0.6
    );
    gradient1.addColorStop(0, 'rgba(10, 15, 40, 0.08)'); // Very dark navy
    gradient1.addColorStop(0.5, 'rgba(15, 20, 50, 0.05)');
    gradient1.addColorStop(1, 'transparent');
    
    const gradient2 = this.ctx.createRadialGradient(
      this.width * 0.7, this.height * 0.6, 0,
      this.width * 0.7, this.height * 0.6, this.width * 0.5
    );
    gradient2.addColorStop(0, 'rgba(20, 25, 60, 0.06)'); // Very dark indigo
    gradient2.addColorStop(0.5, 'rgba(25, 30, 65, 0.04)');
    gradient2.addColorStop(1, 'transparent');
    
    this.glowGradients = [gradient1, gradient2];
    
    // Generate cluster centers for natural distribution
    this.clusterCenters = [];
    for (let i = 0; i < 6; i++) {
      this.clusterCenters.push({
        x: 100 + Math.random() * (this.width - 200),
        y: 100 + Math.random() * (this.height - 200),
      });
    }
  }
  
  private getClusteredPosition(): { x: number; y: number } {
    // 65% chance to be near a cluster, 35% random
    if (Math.random() < 0.65 && this.clusterCenters.length > 0) {
      const cluster = this.clusterCenters[Math.floor(Math.random() * this.clusterCenters.length)];
      const spread = 120 + Math.random() * 80; // Spread around cluster
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spread;
      let x = cluster.x + Math.cos(angle) * distance;
      let y = cluster.y + Math.sin(angle) * distance;
      
      // Keep within bounds
      x = Math.max(20, Math.min(this.width - 20, x));
      y = Math.max(20, Math.min(this.height - 20, y));
      return { x, y };
    }
    
    // Random position for remaining stars
    return {
      x: 20 + Math.random() * (this.width - 40),
      y: 20 + Math.random() * (this.height - 40),
    };
  }
  
  start(): void {
    if (this.animationId !== null) return;
    this.animate();
  }
  
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Reinitialize stars for new dimensions
    this.backgroundStars = [];
    this.mediumStars = [];
    this.heroStars = [];
    this.initializeStars();
    this.initializeAtmosphericGlow();
  }
  
  getParticleCount(): number {
    return this.backgroundStars.length + this.mediumStars.length + this.heroStars.length;
  }
  
  private initializeSprites(): void {
    // Create handcrafted sparkle sprites for hero stars (3 variants)
    this.spriteCache['sparkle_0'] = this.createSparkleSprite(0);
    this.spriteCache['sparkle_1'] = this.createSparkleSprite(1);
    this.spriteCache['sparkle_2'] = this.createSparkleSprite(2);
    
    // Create simple circle sprites for background and medium stars
    this.spriteCache['circle_small'] = this.createCircleSprite(1.5);
    this.spriteCache['circle_medium'] = this.createCircleSprite(3);
  }
  
  private createSparkleSprite(variant: number): HTMLCanvasElement {
    const size = 50;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Premium soft glow - primary visual feature
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle inner sparkle - NOT a cross shape
    // Just a small bright center with very subtle rays
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Very subtle hint of sparkle (tiny rays, not cross)
    const rayLength = 4 + variant * 1.5; // 4, 5.5, 7
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - rayLength, centerY);
    ctx.lineTo(centerX + rayLength, centerY);
    ctx.moveTo(centerX, centerY - rayLength);
    ctx.lineTo(centerX, centerY + rayLength);
    ctx.stroke();
    
    return canvas;
  }
  
  private createCircleSprite(radius: number): HTMLCanvasElement {
    const size = radius * 4;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
  }
  
  private initializeStars(): void {
    // Layer 2: Background stars (250-350, tiny, dim, no glow)
    const bgCount = 250 + Math.floor(Math.random() * 100);
    for (let i = 0; i < bgCount; i++) {
      const pos = this.getClusteredPosition();
      this.backgroundStars.push({
        x: pos.x,
        y: pos.y,
        size: 1 + Math.random() * 0.5,
        opacity: 0.2 + Math.random() * 0.15,
        baseOpacity: 0.2 + Math.random() * 0.15,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.003 + Math.random() * 0.005, // Increased for visible twinkle
        minBrightness: 0.15,
        maxBrightness: 0.35,
        rotation: 0,
        rotationSpeed: 0,
        layer: 'background',
        spriteIndex: 0,
      });
    }
    
    // Layer 3: Medium stars (80-120, 2-4px, gentle twinkle, small bloom)
    const medCount = 80 + Math.floor(Math.random() * 40);
    for (let i = 0; i < medCount; i++) {
      const pos = this.getClusteredPosition();
      this.mediumStars.push({
        x: pos.x,
        y: pos.y,
        size: 2 + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.2,
        baseOpacity: 0.4 + Math.random() * 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.008 + Math.random() * 0.015,
        minBrightness: 0.3,
        maxBrightness: 0.65,
        rotation: 0,
        rotationSpeed: 0,
        layer: 'medium',
        spriteIndex: 1,
      });
    }
    
    // Layer 4: Hero stars (15-20, sparkle sprites, rotation, independent twinkle)
    const heroCount = 15 + Math.floor(Math.random() * 5);
    for (let i = 0; i < heroCount; i++) {
      const pos = this.getClusteredPosition();
      this.heroStars.push({
        x: pos.x,
        y: pos.y,
        size: 4 + Math.random() * 2, // Reduced to 4-6px
        opacity: 0.7 + Math.random() * 0.2,
        baseOpacity: 0.7 + Math.random() * 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.015 + Math.random() * 0.025,
        minBrightness: 0.55,
        maxBrightness: 0.95,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005, // Slower rotation
        layer: 'hero',
        spriteIndex: Math.floor(Math.random() * 3),
      });
    }
  }
  
  private animate = (): void => {
    this.render();
    this.update();
    this.animationId = requestAnimationFrame(this.animate);
  };
  
  private update(): void {
    // Update background stars (almost no twinkle)
    for (const star of this.backgroundStars) {
      star.twinklePhase += star.twinkleSpeed;
      const pulse = (Math.sin(star.twinklePhase) + 1) / 2;
      star.opacity = star.minBrightness + pulse * (star.maxBrightness - star.minBrightness);
    }
    
    // Update medium stars (gentle twinkle)
    for (const star of this.mediumStars) {
      star.twinklePhase += star.twinkleSpeed;
      const pulse = (Math.sin(star.twinklePhase) + 1) / 2;
      star.opacity = star.minBrightness + pulse * (star.maxBrightness - star.minBrightness);
    }
    
    // Update hero stars (clearly visible twinkle + rotation)
    for (const star of this.heroStars) {
      star.twinklePhase += star.twinkleSpeed;
      star.rotation += star.rotationSpeed;
      const pulse = (Math.sin(star.twinklePhase) + 1) / 2;
      star.opacity = star.minBrightness + pulse * (star.maxBrightness - star.minBrightness);
    }
    
    // Update shooting star
    this.updateShootingStar();
  }
  
  private updateShootingStar(): void {
    this.shootingStarTimer++;
    
    // Spawn shooting star
    if (this.shootingStarTimer >= this.shootingStarInterval && !this.shootingStar?.active) {
      this.shootingStarTimer = 0;
      this.shootingStarInterval = 1500 + Math.random() * 2100; // Reset interval
      
      const startEdge = Math.floor(Math.random() * 4);
      const speed = 12 + Math.random() * 6;
      
      let startX, startY, speedX, speedY;
      switch (startEdge) {
        case 0: // Top
          startX = Math.random() * this.width;
          startY = 0;
          speedX = speed * (0.7 + Math.random() * 0.6);
          speedY = speed * (0.5 + Math.random() * 0.4);
          break;
        case 1: // Right
          startX = this.width;
          startY = Math.random() * this.height;
          speedX = -speed * (0.7 + Math.random() * 0.6);
          speedY = speed * (0.5 + Math.random() * 0.4);
          break;
        case 2: // Bottom
          startX = Math.random() * this.width;
          startY = this.height;
          speedX = speed * (0.7 + Math.random() * 0.6);
          speedY = -speed * (0.5 + Math.random() * 0.4);
          break;
        case 3: // Left
          startX = 0;
          startY = Math.random() * this.height;
          speedX = speed * (0.7 + Math.random() * 0.6);
          speedY = speed * (0.5 + Math.random() * 0.4);
          break;
        default:
          startX = 0;
          startY = 0;
          speedX = speed;
          speedY = speed;
      }
      
      const duration = 42 + Math.random() * 30; // 0.7-1.2 seconds at 60fps
      
      this.shootingStar = {
        x: startX,
        y: startY,
        speedX,
        speedY,
        life: duration,
        maxLife: duration,
        trail: [],
        active: true,
      };
    }
    
    // Update active shooting star
    if (this.shootingStar?.active) {
      this.shootingStar.life--;
      this.shootingStar.x += this.shootingStar.speedX;
      this.shootingStar.y += this.shootingStar.speedY;
      
      this.shootingStar.trail.push({ x: this.shootingStar.x, y: this.shootingStar.y });
      if (this.shootingStar.trail.length > 30) {
        this.shootingStar.trail.shift();
      }
      
      if (this.shootingStar.life <= 0) {
        this.shootingStar.active = false;
      }
    }
  }
  
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Layer 1: Atmospheric glow
    this.renderAtmosphericGlow();
    
    // Layer 2: Background stars
    this.renderBackgroundStars();
    
    // Layer 3: Medium stars
    this.renderMediumStars();
    
    // Layer 4: Hero stars
    this.renderHeroStars();
    
    // Layer 5: Shooting star
    this.renderShootingStar();
  }
  
  private renderAtmosphericGlow(): void {
    for (const gradient of this.glowGradients) {
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }
  
  private renderBackgroundStars(): void {
    const sprite = this.spriteCache['circle_small'];
    if (!sprite) return;
    
    for (const star of this.backgroundStars) {
      this.ctx.globalAlpha = star.opacity;
      this.ctx.drawImage(
        sprite,
        star.x - sprite.width / 2,
        star.y - sprite.height / 2,
        sprite.width * star.size / 1.5,
        sprite.height * star.size / 1.5
      );
    }
    this.ctx.globalAlpha = 1;
  }
  
  private renderMediumStars(): void {
    const sprite = this.spriteCache['circle_medium'];
    if (!sprite) return;
    
    for (const star of this.mediumStars) {
      this.ctx.globalAlpha = star.opacity;
      this.ctx.drawImage(
        sprite,
        star.x - sprite.width / 2,
        star.y - sprite.height / 2,
        sprite.width * star.size / 3,
        sprite.height * star.size / 3
      );
    }
    this.ctx.globalAlpha = 1;
  }
  
  private renderHeroStars(): void {
    for (const star of this.heroStars) {
      const sprite = this.spriteCache[`sparkle_${star.spriteIndex}`];
      if (!sprite) continue;
      
      this.ctx.save();
      this.ctx.translate(star.x, star.y);
      this.ctx.rotate(star.rotation);
      this.ctx.globalAlpha = star.opacity;
      this.ctx.drawImage(
        sprite,
        -sprite.width / 2,
        -sprite.height / 2,
        sprite.width * star.size / 5, // Adjusted for 4-6px size
        sprite.height * star.size / 5
      );
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }
  
  private renderShootingStar(): void {
    if (!this.shootingStar?.active) return;
    
    // Draw trail
    if (this.shootingStar.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.shootingStar.trail[0].x, this.shootingStar.trail[0].y);
      
      for (let i = 1; i < this.shootingStar.trail.length; i++) {
        const point = this.shootingStar.trail[i];
        this.ctx.lineTo(point.x, point.y);
      }
      
      const progress = this.shootingStar.life / this.shootingStar.maxLife;
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${progress * 0.6})`;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
    
    // Draw head
    this.ctx.beginPath();
    this.ctx.arc(this.shootingStar.x, this.shootingStar.y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${this.shootingStar.life / this.shootingStar.maxLife})`;
    this.ctx.fill();
    
    // Head glow
    const gradient = this.ctx.createRadialGradient(
      this.shootingStar.x, this.shootingStar.y, 0,
      this.shootingStar.x, this.shootingStar.y, 15
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.shootingStar.life / this.shootingStar.maxLife * 0.4})`);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.shootingStar.x, this.shootingStar.y, 15, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
