/**
 * Visual Effects Types
 * Plugin interface for visual effects
 */

export interface VisualEffect {
  /**
   * Unique identifier for the effect
   */
  id: string;

  /**
   * Enable the effect
   * Called when the effect is activated
   */
  enable(): void;

  /**
   * Disable the effect
   * Called when the effect is deactivated or before switching to another effect
   */
  disable(): void;
}
