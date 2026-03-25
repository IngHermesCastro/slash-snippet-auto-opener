/**
 * DOM Helper utilities for safe and efficient DOM operations
 * @module content/dom-helper
 */

import { logger } from '../utils/logger.js';
import { OPERATION_TIMEOUT, EXTENSION_NS } from '../utils/constants.js';

export class DOMHelper {
  /**
   * Finds the snippet button using multiple selector strategies
   * @param selectors - Array of selectors to try
   * @returns HTMLElement if found, null otherwise
   */
  static findSnippetButton(selectors: string[]): HTMLElement | null {
    logger.debug('Searching for snippet button', { selectorsCount: selectors.length });

    for (const selector of selectors) {
      try {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) continue;

        // If we found an SVG, use its parent (likely the clickable container)
        const targetElement = element.closest<HTMLElement>(
          'button, [role="button"], [tabindex], div.cursor-pointer'
        ) ?? (element.tagName.toLowerCase() === 'svg' ? element.parentElement : element);

        if (targetElement && this.isVisible(targetElement)) {
          logger.info('Found snippet button', { selector, elementTag: targetElement.tagName });
          return targetElement;
        }
      } catch (error) {
        logger.warn('Invalid selector', { selector, error: String(error) });
      }
    }

    // Fallback: search by text content in buttons
    const buttons = document.querySelectorAll<HTMLButtonElement>('button');
    for (const button of Array.from(buttons)) {
      if (
        button.textContent?.toLowerCase().includes('snippet') &&
        this.isVisible(button)
      ) {
        logger.info('Found snippet button by text content');
        return button;
      }
    }

    logger.warn('Snippet button not found');
    return null;
  }

  /**
   * Checks if an element is actually visible in the viewport
   * @param element - Element to check
   * @returns true if visible, false otherwise
   */
  static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      !element.hasAttribute('hidden') &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Simulates a natural click on the element
   * Uses multiple strategies to ensure the click is detected
   * @param element - Element to click
   * @returns true if click was successful
   */
  static simulateClick(element: HTMLElement): boolean {
    try {
      // Ensure element is focused first
      element.focus();
      logger.debug('Element focused');

      // Strategy 1: Dispatch all pointer events (for modern frameworks)
      this.dispatchPointerEvents(element);

      // Strategy 2: Dispatch mouse events for compatibility
      this.dispatchMouseEvents(element);

      // Strategy 3: Direct HTMLElement.click()
      element.click();
      logger.debug('Click simulated via element.click()');

      // Mark element as having been triggered by this extension
      element.setAttribute(EXTENSION_NS + '-triggered', 'true');

      return true;
    } catch (error) {
      logger.error('Failed to simulate click', { error: String(error) });
      return false;
    }
  }

  /**
   * Dispatches pointer events (for Vue 3 and modern frameworks)
   * @param element - Target element
   */
  private static dispatchPointerEvents(element: HTMLElement): void {
    const pointerEvents = ['pointerdown', 'pointerup'];

    for (const eventType of pointerEvents) {
      const event = new PointerEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      });

      element.dispatchEvent(event);
    }

    logger.debug('Pointer events dispatched');
  }

  /**
   * Dispatches mouse events to simulate a natural click
   * @param element - Target element
   */
  private static dispatchMouseEvents(element: HTMLElement): void {
    const events = ['mousedown', 'mouseup'];

    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        buttons: eventType === 'mousedown' ? 1 : 0,
      });

      element.dispatchEvent(event);
    }

    logger.debug('Mouse down/up events dispatched');
  }

  /**
   * Waits for an element to appear in the DOM
   * Useful for waiting for UI updates after click
   * @param selector - CSS selector
   * @param timeout - Timeout in ms
   * @returns Promise resolving to element or null
   */
  static async waitForElement(
    selector: string,
    timeout = OPERATION_TIMEOUT.FIND_BUTTON
  ): Promise<HTMLElement | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    logger.warn('Element not found within timeout', { selector, timeout });
    return null;
  }

  /**
   * Checks if element is within a text input or contenteditable
   * Prevents triggering snippet when user is typing in an input
   * @param target - Target element from event
   * @returns true if inside input/textarea/contenteditable
   */
  static isInsideInput(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    const element = target as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'input' || tagName === 'textarea') {
      return true;
    }

    // Check if inside contenteditable
    if (element.contentEditable === 'true' || element.isContentEditable) {
      return true;
    }

    // Check parents
    let parent = element.parentElement;
    while (parent) {
      if (parent.contentEditable === 'true' || parent.tagName.toLowerCase() === 'input') {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  /**
   * Focuses on the element to ensure proper context
   * @param element - Element to focus
   */
  static focusElement(element: HTMLElement): void {
    try {
      element.focus({ preventScroll: true });
      logger.debug('Element focused');
    } catch (error) {
      logger.warn('Failed to focus element', { error: String(error) });
    }
  }
}
