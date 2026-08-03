/**
 * Visual Effects Manager
 * Manages the lifecycle of visual effects
 */

import browser from 'webextension-polyfill';
import { StorageKeys } from '@/core/types/common';
import type { VisualEffectsRegistry } from './registry';

class VisualEffectsManager {
  private currentEffectId: string | null = null;
  private storageChangeListener: ((changes: Record<string, unknown>, areaName: string) => void) | null = null;

  constructor(private registry: VisualEffectsRegistry) {}

  /**
   * Initialize the manager
   * Reads current effect from storage and sets up listeners
   */
  async initialize(): Promise<void> {
    // Read current effect from storage
    const result = await browser.storage.sync.get(StorageKeys.GV_VISUAL_EFFECT);
    const effectId = result[StorageKeys.GV_VISUAL_EFFECT] as string;

    if (effectId && effectId !== 'off') {
      await this.enableEffect(effectId);
    }

    // Listen for storage changes
    this.setupStorageListener();
  }

  /**
   * Setup storage change listener
   */
  private setupStorageListener(): void {
    this.storageChangeListener = (
      changes: Record<string, unknown>,
      areaName: string,
    ) => {
      if (areaName !== 'sync') return;

      const change = changes[StorageKeys.GV_VISUAL_EFFECT] as { newValue?: unknown; oldValue?: unknown } | undefined;
      if (!change) return;

      const newValue = change.newValue as string | undefined;
      const oldValue = change.oldValue as string | undefined;

      // Ignore duplicate changes
      if (newValue === oldValue) return;

      void this.handleStorageChange(newValue, oldValue);
    };

    browser.storage.onChanged.addListener(this.storageChangeListener);
  }

  /**
   * Handle storage change for visual effect
   */
  private async handleStorageChange(newValue: string | undefined, oldValue: string | undefined): Promise<void> {
    // Disable old effect if it was set
    if (oldValue && oldValue !== 'off') {
      await this.disableEffect(oldValue);
    }

    // Enable new effect if it's set
    if (newValue && newValue !== 'off') {
      await this.enableEffect(newValue);
    }
  }

  /**
   * Enable a visual effect by id
   */
  private async enableEffect(effectId: string): Promise<void> {
    // Ignore if already enabled
    if (this.currentEffectId === effectId) {
      return;
    }

    const effect = this.registry.get(effectId);
    if (!effect) {
      console.warn(`[VisualEffectsManager] Effect "${effectId}" not found in registry.`);
      return;
    }

    // Disable current effect before enabling new one
    if (this.currentEffectId) {
      await this.disableEffect(this.currentEffectId);
    }

    // Enable the new effect
    try {
      effect.enable();
      this.currentEffectId = effectId;
    } catch (error) {
      console.error(`[VisualEffectsManager] Failed to enable effect "${effectId}":`, error);
    }
  }

  /**
   * Disable a visual effect by id
   */
  private async disableEffect(effectId: string): Promise<void> {
    // Ignore if not the current effect
    if (this.currentEffectId !== effectId) {
      return;
    }

    const effect = this.registry.get(effectId);
    if (!effect) {
      console.warn(`[VisualEffectsManager] Effect "${effectId}" not found in registry.`);
      return;
    }

    try {
      effect.disable();
      this.currentEffectId = null;
    } catch (error) {
      console.error(`[VisualEffectsManager] Failed to disable effect "${effectId}":`, error);
    }
  }

  /**
   * Cleanup on page unload
   */
  destroy(): void {
    // Disable current effect
    if (this.currentEffectId) {
      const effect = this.registry.get(this.currentEffectId);
      if (effect) {
        try {
          effect.disable();
        } catch (error) {
          console.error(`[VisualEffectsManager] Failed to disable effect during cleanup:`, error);
        }
      }
      this.currentEffectId = null;
    }

    // Remove storage listener
    if (this.storageChangeListener) {
      browser.storage.onChanged.removeListener(this.storageChangeListener);
      this.storageChangeListener = null;
    }
  }
}

export { VisualEffectsManager };
