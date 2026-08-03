/**
 * Sakura Visual Effect (Placeholder)
 * Placeholder implementation that draws a pink circle to verify rendering pipeline
 */

import { canvasManager } from '../canvasManager';
import type { VisualEffect } from '../types';

class SakuraEffect implements VisualEffect {
  id = 'sakura';
  private isEnabled = false;
  private resizeListener: (() => void) | null = null;

  enable(): void {
    if (this.isEnabled) {
      console.warn('[SakuraEffect] Already enabled, ignoring duplicate call');
      return;
    }

    try {
      // Create canvas
      const canvas = canvasManager.createCanvas();
      const ctx = canvasManager.getContext();

      if (!ctx) {
        console.error('[SakuraEffect] Failed to get canvas context');
        return;
      }

      // Draw pink circle in center
      this.drawCircle(ctx, canvas);

      // Setup resize listener to redraw on resize
      this.resizeListener = () => {
        if (this.isEnabled && canvasManager.hasCanvas()) {
          const resizedCanvas = canvasManager.createCanvas();
          const resizedCtx = canvasManager.getContext();
          if (resizedCtx) {
            this.drawCircle(resizedCtx, resizedCanvas);
          }
        }
      };
      window.addEventListener('resize', this.resizeListener);

      this.isEnabled = true;
      console.warn('[SakuraEffect] Sakura enabled - pink circle drawn');
    } catch (error) {
      console.error('[SakuraEffect] Failed to enable:', error);
    }
  }

  disable(): void {
    if (!this.isEnabled) {
      console.warn('[SakuraEffect] Already disabled, ignoring duplicate call');
      return;
    }

    try {
      // Remove resize listener
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
        this.resizeListener = null;
      }

      // Destroy canvas
      canvasManager.destroyCanvas();

      this.isEnabled = false;
      console.warn('[SakuraEffect] Sakura disabled - canvas removed');
    } catch (error) {
      console.error('[SakuraEffect] Failed to disable:', error);
    }
  }

  private drawCircle(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pink circle in center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 4;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB7C5'; // Pink color
    ctx.fill();
  }
}

export const sakuraEffect = new SakuraEffect();
