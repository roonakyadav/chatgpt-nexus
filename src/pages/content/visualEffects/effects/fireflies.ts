/**
 * Fireflies Visual Effect
 * Firefly animation using particle simulation
 */

import { canvasManager } from '../canvasManager';
import { FirefliesScene } from './firefliesScene';
import type { VisualEffect } from '../types';

class FirefliesEffect implements VisualEffect {
  id = 'fireflies';
  private isEnabled = false;
  private scene: FirefliesScene | null = null;
  private resizeListener: (() => void) | null = null;

  enable(): void {
    if (this.isEnabled) {
      return;
    }

    try {
      // Create canvas
      const canvas = canvasManager.createCanvas();
      const ctx = canvasManager.getContext();

      if (!ctx) {
        console.error('[FirefliesEffect] Failed to get canvas context');
        return;
      }

      // Create scene
      this.scene = new FirefliesScene(canvas, ctx);
      this.scene.start();

      // Setup resize listener
      this.resizeListener = () => {
        if (this.isEnabled && canvasManager.hasCanvas() && this.scene) {
          const resizedCanvas = canvasManager.createCanvas();
          const resizedCtx = canvasManager.getContext();
          if (resizedCtx) {
            this.scene.resize(resizedCanvas.width, resizedCanvas.height);
          }
        }
      };
      window.addEventListener('resize', this.resizeListener);

      this.isEnabled = true;
    } catch (error) {
      console.error('[FirefliesEffect] Failed to enable:', error);
    }
  }

  disable(): void {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Stop animation
      if (this.scene) {
        this.scene.stop();
        this.scene = null;
      }

      // Remove resize listener
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
        this.resizeListener = null;
      }

      // Destroy canvas
      canvasManager.destroyCanvas();

      this.isEnabled = false;
    } catch (error) {
      console.error('[FirefliesEffect] Failed to disable:', error);
    }
  }
}

export const firefliesEffect = new FirefliesEffect();
