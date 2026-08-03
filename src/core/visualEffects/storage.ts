/**
 * Visual Effects Storage
 * Handles chrome.storage.sync operations for visual effects
 */

import browser from 'webextension-polyfill';
import { StorageKeys } from '@/core/types/common';
import type { VisualEffect } from './types';

const DEFAULT_VISUAL_EFFECT: VisualEffect = 'off';

/**
 * Get the current visual effect from storage
 */
export async function getCurrentVisualEffect(): Promise<VisualEffect> {
  try {
    const result = await browser.storage.sync.get(StorageKeys.GV_VISUAL_EFFECT);
    const value = result[StorageKeys.GV_VISUAL_EFFECT];
    return value === 'off' || value === 'sakura' ? value : DEFAULT_VISUAL_EFFECT;
  } catch (error) {
    console.warn('[VisualEffects] Failed to get current effect:', error);
    return DEFAULT_VISUAL_EFFECT;
  }
}

/**
 * Set the current visual effect in storage
 */
export async function setCurrentVisualEffect(effect: VisualEffect): Promise<void> {
  try {
    await browser.storage.sync.set({ [StorageKeys.GV_VISUAL_EFFECT]: effect });
  } catch (error) {
    console.warn('[VisualEffects] Failed to set current effect:', error);
    throw error;
  }
}

/**
 * Subscribe to visual effect changes
 * Returns a function to unsubscribe
 */
export function subscribeToVisualEffectChanges(
  callback: (effect: VisualEffect) => void,
): () => void {
  const listener = (
    changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
    areaName: string,
  ) => {
    if (areaName === 'sync' && StorageKeys.GV_VISUAL_EFFECT in changes) {
      const newValue = changes[StorageKeys.GV_VISUAL_EFFECT].newValue;
      if (newValue === 'off' || newValue === 'sakura') {
        callback(newValue);
      }
    }
  };

  browser.storage.onChanged.addListener(listener);

  return () => {
    browser.storage.onChanged.removeListener(listener);
  };
}
