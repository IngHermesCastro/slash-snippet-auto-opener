/**
 * Configuration manager for the extension
 * @module utils/config
 */

import { TRIGGER_KEY, BUTTON_SELECTORS, DEBOUNCE_DELAY, DEBUG_MODE } from './constants.js';
import type { DetectorConfig } from '../types/index.js';

export class Config {
  private config: DetectorConfig;

  constructor(customConfig?: Partial<DetectorConfig>) {
    this.config = {
      triggerKey: customConfig?.triggerKey ?? TRIGGER_KEY,
      buttonSelectors: customConfig?.buttonSelectors ?? [...BUTTON_SELECTORS],
      debugMode: customConfig?.debugMode ?? DEBUG_MODE,
    };
  }

  getTriggerKey(): string {
    return this.config.triggerKey;
  }

  getButtonSelectors(): string[] {
    return [...this.config.buttonSelectors];
  }

  isDebugMode(): boolean {
    return this.config.debugMode;
  }

  setTriggerKey(key: string): void {
    if (key.length === 1) {
      this.config.triggerKey = key;
    }
  }

  setButtonSelectors(selectors: string[]): void {
    if (selectors.length > 0) {
      this.config.buttonSelectors = selectors;
    }
  }

  setDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
  }

  getConfig(): Readonly<DetectorConfig> {
    return Object.freeze({ ...this.config });
  }
}

export const config = new Config();
