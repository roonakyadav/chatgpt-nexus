/**
 * Effect Lifecycle
 * Handles visibility and reduced-motion for particle effects
 */

export class EffectLifecycle {
  private isPaused = false;
  private isReducedMotion = false;
  private visibilityListener: (() => void) | null = null;
  private reducedMotionListener: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onResumeCallback: (() => void) | null = null;

  constructor(
    onPause?: () => void,
    onResume?: () => void
  ) {
    this.onPauseCallback = onPause || null;
    this.onResumeCallback = onResume || null;
    this.checkReducedMotion();
    this.setupVisibilityListener();
  }

  private checkReducedMotion(): void {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.reducedMotionListener = () => {
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.isReducedMotion) {
        this.pause();
      } else if (!this.isPaused) {
        this.resume();
      }
    };
    
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', this.reducedMotionListener);
  }

  private setupVisibilityListener(): void {
    this.visibilityListener = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      if (this.onPauseCallback) {
        this.onPauseCallback();
      }
    }
  }

  resume(): void {
    if (this.isPaused && !this.isReducedMotion) {
      this.isPaused = false;
      if (this.onResumeCallback) {
        this.onResumeCallback();
      }
    }
  }

  shouldRun(): boolean {
    return !this.isPaused && !this.isReducedMotion;
  }

  cleanup(): void {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
    
    if (this.reducedMotionListener) {
      window.matchMedia('(prefers-reduced-motion: reduce)').removeEventListener('change', this.reducedMotionListener);
      this.reducedMotionListener = null;
    }
  }
}
