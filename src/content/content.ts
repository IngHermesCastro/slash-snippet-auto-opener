/**
 * Main content script
 * Orchestrates keystroke detection and snippet button interaction
 * @module content/content
 */

import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { DOMHelper } from './dom-helper.js';
import { KeystrokeDetector } from './detector.js';
import { DEBOUNCE_DELAY, SEARCH_FIELD_SELECTORS } from '../utils/constants.js';

class SlashSnippetExtension {
  private lastTriggerTime = 0;
  private isInitialized = false;
  private readonly keydownHandler = this.handleKeydown.bind(this);

  /**
   * Initializes the extension
   * Attaches event listeners and sets up logging
   */
  init(): void {
    if (this.isInitialized) {
      logger.warn('Extension already initialized');
      return;
    }

    logger.info('Initializing Slash Snippet Extension');
    
    // Set debug mode from config
    if (config.isDebugMode()) {
      logger.debug('Debug mode enabled');
    }

    // Attach keydown listener to document
    document.addEventListener('keydown', this.keydownHandler, true);

    this.isInitialized = true;
    logger.info('Extension initialized successfully');
  }

  /**
   * Handles keydown events
   * Applies debouncing to prevent multiple triggers from rapid keypresses
   * @param event - KeyboardEvent
   */
  private handleKeydown(event: KeyboardEvent): void {
    // Apply debouncing
    const now = Date.now();
    if (now - this.lastTriggerTime < DEBOUNCE_DELAY) {
      return;
    }

    const triggerKey = config.getTriggerKey();
    const eventData = {
      key: event.key,
      target: event.target,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    };

    // Check if keystroke should trigger
    if (!KeystrokeDetector.shouldTrigger(eventData, triggerKey)) {
      return;
    }

    logger.debug('Keystroke triggered', {
      targetTag: (event.target as Element)?.tagName,
      targetClass: (event.target as Element)?.className,
    });

    void this.handleTrigger(event, now);
  }

  /**
   * Continues the trigger flow asynchronously so we can cancel the original '/'
   * only when there is a matching snippet UI to interact with.
   */
  private async handleTrigger(event: KeyboardEvent, triggerTime: number): Promise<void> {
    const existingField = this.findSearchField();
    if (existingField) {
      this.cancelTriggerEvent(event);
      const focusSuccess = this.focusSearchField(existingField);
      if (focusSuccess) {
        this.lastTriggerTime = triggerTime;
      }
      return;
    }

    const buttonSelectors = config.getButtonSelectors();
    const button = DOMHelper.findSnippetButton(buttonSelectors);

    if (!button) {
      logger.warn('Could not find snippet button');
      return;
    }

    this.cancelTriggerEvent(event);
    logger.debug('Proceeding to trigger snippet button');

    const triggerSuccess = await this.triggerSnippetButton(button);
    if (triggerSuccess) {
      this.lastTriggerTime = triggerTime;
    }
  }

  /**
   * Main logic: finds and clicks the snippet button
   */
  private async triggerSnippetButton(button?: HTMLElement): Promise<boolean> {
    logger.debug('Triggering snippet button');

    const targetButton = button ?? DOMHelper.findSnippetButton(config.getButtonSelectors());

    if (!targetButton) {
      logger.warn('Could not find snippet button');
      return false;
    }

    // Focus on element context if needed
    DOMHelper.focusElement(targetButton);

    // Simulate the click
    const clickSuccess = DOMHelper.simulateClick(targetButton);

    if (clickSuccess) {
      logger.info('Snippet button clicked successfully');

      const searchField = await this.waitForSearchField(1500);
      if (searchField) {
        return this.focusSearchField(searchField);
      }

      logger.warn('Search field not found after clicking snippet button');
      this.logDropdownStructure();
      return false;
    } else {
      logger.error('Failed to click snippet button');
      return false;
    }
  }

  /**
   * Cancels the original slash key so it does not leak into the current editor.
   */
  private cancelTriggerEvent(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  /**
   * Finds the search field in the snippet panel using multiple selector strategies.
   */
  private findSearchField(): HTMLElement | null {
    for (const selector of SEARCH_FIELD_SELECTORS) {
      try {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) {
          continue;
        }

        if (!DOMHelper.isVisible(element)) {
          continue;
        }

        if (
          (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
          (element.disabled || element.readOnly)
        ) {
          continue;
        }

        return element;
      } catch (error) {
        logger.warn('Invalid search field selector', { selector, error: String(error) });
      }
    }

    return null;
  }

  /**
   * Waits for the snippet search field to appear after opening the panel.
   */
  private async waitForSearchField(timeout: number): Promise<HTMLElement | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const field = this.findSearchField();
      if (field) {
        return field;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return null;
  }

  /**
   * Focuses the snippet search field and verifies that focus landed there.
   */
  private focusSearchField(field: HTMLElement): boolean {
    try {
      field.focus({ preventScroll: true });
      field.click();

      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.select();
      }

      const focused =
        document.activeElement === field ||
        field.matches(':focus') ||
        field.contains(document.activeElement);

      logger.info('Search field focus attempt completed', {
        focused,
        tagName: field.tagName,
        placeholder: field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
          ? field.placeholder
          : null,
        ariaLabel: field.getAttribute('aria-label'),
      });

      return focused;
    } catch (error) {
      logger.error('Failed to focus search field', { error: String(error) });
      return false;
    }
  }

  /**
   * Logs all dropdown-related elements for debugging
   */
  private logDropdownStructure(): void {
    const dropdown = document.querySelector<HTMLElement>(
      '#snippets-dropdown, [id*="snippet" i], [data-testid*="snippet" i], [role="dialog"]'
    );
    if (!dropdown) {
      logger.warn('Dropdown element not found');
      return;
    }

    logger.warn('Dropdown structure:');

    // Log all inputs in dropdown
    const inputs = dropdown.querySelectorAll('input');
    logger.warn(`Found ${inputs.length} input(s) in dropdown`);
    inputs.forEach((input, i) => {
      logger.warn(`Input ${i}: placeholder="${input.placeholder}", type="${input.type}", class="${input.className}"`);
    });

    // Log all divs with role button or class containing 'search'
    const searchDivs = dropdown.querySelectorAll(
      'div[class*="search"], div[class*="input"], div[role="button"]'
    );
    logger.warn(`Found ${searchDivs.length} potential search containers`);
    searchDivs.forEach((div, i) => {
      logger.warn(`Div ${i}: class="${div.className}"`);
    });
  }

  /**
   * Cleanup method for when extension needs to be disabled
   */
  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler, true);
    this.isInitialized = false;
    logger.info('Extension destroyed');
  }
}

// Initialize when DOM is interactive or immediately if already loaded
const extension = new SlashSnippetExtension();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extension.init();
  });
} else {
  extension.init();
}

// Also try to initialize at document_start using a timeout
setTimeout(() => {
  if (!extension['isInitialized']) {
    extension.init();
  }
}, 100);

logger.debug('Content script loaded');
