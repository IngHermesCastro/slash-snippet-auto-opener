/**
 * Keystroke detector with pure logic
 * Separates detection logic from DOM operations for testability
 * @module content/detector
 */

import { logger } from '../utils/logger.js';
import type { KeyboardEventData } from '../types/index.js';

export class KeystrokeDetector {
  /**
   * Detects if the keystroke should trigger the snippet button click
   * @param eventData - Keyboard event data
   * @param triggerKey - The key that should trigger the action
   * @returns true if should trigger, false otherwise
   */
  static shouldTrigger(eventData: KeyboardEventData, triggerKey: string): boolean {
    // Only trigger on the exact key
    if (eventData.key !== triggerKey) {
      return false;
    }

    // Don't trigger if modifier keys are pressed (Ctrl, Cmd)
    if (eventData.ctrlKey || eventData.metaKey) {
      logger.debug('Modifier key detected, skipping trigger');
      return false;
    }

    logger.debug('Trigger condition met');
    return true;
  }

  /**
   * Validates if the event target is appropriate for triggering
   * @param target - Event target
   * @param excludedTags - HTML tags where trigger should be ignored
   * @returns true if valid target, false otherwise
   */
  static isValidTarget(target: EventTarget | null, excludedTags = ['input', 'textarea']): boolean {
    if (!target) {
      return false;
    }

    if (!(target instanceof Element)) {
      return false;
    }

    const tagName = (target as Element).tagName.toLowerCase();
    return !excludedTags.includes(tagName);
  }
}
