/**
 * Canvas Manager
 * Reusable canvas manager for visual effects
 */

class CanvasManager {
  private canvas: HTMLCanvasElement | null = null;
  private resizeListener: (() => void) | null = null;
  private canvasId = 'gpt-nexus-visual-effects-canvas';

  /**
   * Create the fullscreen canvas
   */
  createCanvas(): HTMLCanvasElement {
    // Check if canvas already exists
    if (this.canvas) {
      return this.canvas;
    }

    // Check if canvas exists in DOM (survived route change)
    const existingCanvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
    if (existingCanvas) {
      this.canvas = existingCanvas;
      this.setupResizeListener();
      return this.canvas;
    }

    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.id = this.canvasId;
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0'; // Low z-index to place behind content
    canvas.style.background = 'transparent';

    // Insert canvas at the beginning of body to place it behind other content
    // This ensures it's above the body background but behind ChatGPT's main content
    if (document.body.firstChild) {
      document.body.insertBefore(canvas, document.body.firstChild);
    } else {
      document.body.appendChild(canvas);
    }

    this.canvas = canvas;

    // Set canvas size to match window
    this.resizeCanvas();

    // Setup resize listener
    this.setupResizeListener();

    return canvas;
  }

  /**
   * Destroy the canvas
   */
  destroyCanvas(): void {
    if (!this.canvas) {
      return;
    }

    // Remove resize listener
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }

    // Remove canvas from DOM
    this.canvas.remove();
    this.canvas = null;
  }

  /**
   * Resize the canvas to match window size
   */
  resizeCanvas(): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Get the 2D context
   */
  getContext(): CanvasRenderingContext2D | null {
    if (!this.canvas) {
      return null;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      console.error('[CanvasManager] Failed to get 2D context');
      return null;
    }

    return ctx;
  }

  /**
   * Check if canvas exists
   */
  hasCanvas(): boolean {
    return this.canvas !== null;
  }

  /**
   * Setup resize listener
   */
  private setupResizeListener(): void {
    if (this.resizeListener) {
      return; // Already setup
    }

    this.resizeListener = () => {
      this.resizeCanvas();
    };

    window.addEventListener('resize', this.resizeListener);
  }
}

export const canvasManager = new CanvasManager();
