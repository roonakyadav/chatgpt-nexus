/**
 * Visual Effects Content Script
 * Entry point for visual effects in content script
 * This module is completely passive - it only initializes when Sakura is enabled
 * 
 * IMPORTANT: This module should NOT be imported in the main content script.
 * It should only be loaded dynamically when Sakura is enabled.
 */

import browser from 'webextension-polyfill';
import { StorageKeys } from '@/core/types/common';
import { VisualEffectsManager } from './manager';
import { VisualEffectsRegistry } from './registry';
import { sakuraEffect } from './effects/sakura';

let managerInstance: VisualEffectsManager | null = null;
let registryInstance: VisualEffectsRegistry | null = null;
let storageListener: ((changes: Record<string, unknown>, areaName: string) => void) | null = null;
let isInitialized = false;

/**
 * Initialize the full visual effects system
 * Called only when Sakura is enabled
 */
async function initializeFullSystem(): Promise<void> {
  if (isInitialized) return;

  try {
    // Create registry and register effects
    if (!registryInstance) {
      registryInstance = new VisualEffectsRegistry();
      registryInstance.register(sakuraEffect);
    }

    // Create and initialize manager
    if (!managerInstance) {
      managerInstance = new VisualEffectsManager(registryInstance);
      await managerInstance.initialize();
    }

    isInitialized = true;
  } catch (error) {
    console.error('[VisualEffects] Initialization failed:', error);
  }
}

/**
 * Destroy the full visual effects system
 */
function destroyFullSystem(): void {
  if (managerInstance) {
    managerInstance.destroy();
    managerInstance = null;
  }
  registryInstance = null;
  isInitialized = false;
}

/**
 * Setup storage listener for Sakura changes
 */
function setupStorageListener(): void {
  if (storageListener) return; // Already setup

  storageListener = (changes: Record<string, unknown>, areaName: string) => {
    if (areaName !== 'sync') return;

    const change = changes[StorageKeys.GV_VISUAL_EFFECT] as { newValue?: unknown; oldValue?: unknown } | undefined;
    if (!change) return;

    const newValue = change.newValue as string | undefined;
    const oldValue = change.oldValue as string | undefined;

    // If Sakura is being enabled, initialize the full system
    if (newValue === 'sakura' && oldValue !== 'sakura') {
      void initializeFullSystem();
    }

    // If Sakura is being disabled and system is initialized, destroy it
    if (newValue !== 'sakura' && oldValue === 'sakura' && managerInstance) {
      destroyFullSystem();
    }
  };

  browser.storage.onChanged.addListener(storageListener);
}

/**
 * Check if Sakura is currently enabled
 */
async function isSakuraEnabled(): Promise<boolean> {
  try {
    const result = await browser.storage.sync.get(StorageKeys.GV_VISUAL_EFFECT);
    const value = result[StorageKeys.GV_VISUAL_EFFECT] as string;
    return value === 'sakura';
  } catch {
    return false;
  }
}

/**
 * Initialize visual effects
 * This is called when the module is first loaded
 */
export async function initializeVisualEffects(): Promise<void> {
  // Setup storage listener
  setupStorageListener();

  // If Sakura is already enabled, initialize immediately
  if (await isSakuraEnabled()) {
    await initializeFullSystem();
  }
}

/**
 * Cleanup visual effects
 */
export function destroyVisualEffects(): void {
  // Remove storage listener
  if (storageListener) {
    browser.storage.onChanged.removeListener(storageListener);
    storageListener = null;
  }

  // Destroy full system if it was initialized
  destroyFullSystem();
}
