/**
 * Main content script
 * Orchestrates keystroke detection and snippet button interaction
 * @module content/content
 */

import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { DOMHelper } from './dom-helper.js';
import { KeystrokeDetector } from './detector.js';
import {
  DEBOUNCE_DELAY,
  DROPDOWN_CONTAINER_SELECTORS,
  SEARCH_FIELD_KEYWORDS,
  SEARCH_FIELD_SELECTORS,
} from '../utils/constants.js';

type SearchFieldContext = {
  button?: HTMLElement;
  ignoreElement?: HTMLElement | null;
  container?: HTMLElement | null;
  requireDropdown?: boolean;
};

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
    const buttonSelectors = config.getButtonSelectors();
    const button = DOMHelper.findSnippetButton(buttonSelectors);

    if (!button) {
      logger.warn('Could not find snippet button');
      return;
    }

    const existingDropdown = this.findOpenSnippetDropdown(button);
    const existingField = this.findSearchField({
      button,
      container: existingDropdown,
      requireDropdown: true,
    });
    if (existingField) {
      this.cancelTriggerEvent(event);
      const focusSuccess = this.focusSearchField(existingField);
      if (focusSuccess) {
        this.lastTriggerTime = triggerTime;
      }
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

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const clickTargets = this.getSnippetClickTargets(targetButton);
    const stopTrace = this.startSnippetInteractionTrace(targetButton, clickTargets);

    try {
      for (const [index, clickTarget] of clickTargets.entries()) {
        this.logActiveElement('Before snippet click', clickTarget);

        const clickSuccess = DOMHelper.simulateClick(clickTarget);
        if (!clickSuccess) {
          continue;
        }

        logger.info('Snippet button clicked successfully', {
          attempt: index + 1,
          target: this.describeElement(clickTarget),
        });

        this.logActiveElement('After snippet click', clickTarget);

        const dropdown = await this.waitForSnippetDropdown(500, targetButton);
        if (dropdown) {
          logger.info('Snippet dropdown detected', {
            attempt: index + 1,
            dropdown: this.describeElement(dropdown),
          });
        }

        const searchField = await this.waitForSearchField(1000, {
          button: targetButton,
          ignoreElement: previouslyFocusedElement,
          container: dropdown,
          requireDropdown: true,
        });
        if (searchField) {
          return this.focusSearchField(searchField);
        }
      }
    } finally {
      stopTrace();
    }

    logger.warn('Search field not found after clicking snippet button');
    this.logDropdownStructure(targetButton, previouslyFocusedElement);
    return false;
  }

  /**
   * Builds a short list of click targets around the fragments icon.
   */
  private getSnippetClickTargets(button: HTMLElement): Element[] {
    const svgTargets = Array.from(button.querySelectorAll('svg.cursor-pointer, svg'));
    const explicitClickables = Array.from(
      button.querySelectorAll<HTMLElement>('.cursor-pointer, [role="button"], [tabindex]')
    );
    const orderedTargets: Element[] = [];
    const seen = new Set<Element>();

    const addTarget = (target: Element | null): void => {
      if (!target || seen.has(target) || !DOMHelper.isVisible(target)) {
        return;
      }
      seen.add(target);
      orderedTargets.push(target);
    };

    svgTargets.forEach(target => addTarget(target));
    explicitClickables.forEach(target => addTarget(target));
    addTarget(button);
    addTarget(button.parentElement);

    return orderedTargets;
  }

  /**
   * Records DOM events and mutations around the snippet interaction for debugging.
   */
  private startSnippetInteractionTrace(
    button: HTMLElement,
    clickTargets: Element[]
  ): () => void {
    logger.info('Snippet interaction trace started', {
      button: this.describeElement(button),
      clickTargets: clickTargets.map(target => this.describeElement(target)),
    });

    const eventTypes = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'focusin'] as const;
    const listeners: Array<{ target: EventTarget; type: string; handler: EventListener }> = [];

    const attach = (target: EventTarget, type: string, label: string): void => {
      const handler: EventListener = event => {
        const targetElement = event.target instanceof Element ? event.target : null;
        const currentTargetElement = event.currentTarget instanceof Element ? event.currentTarget : null;

        logger.info('Trace event', {
          label,
          type,
          target: this.describeElement(targetElement),
          currentTarget: this.describeElement(currentTargetElement),
          activeElement: this.describeElement(
            document.activeElement instanceof HTMLElement ? document.activeElement : null
          ),
        });
      };

      target.addEventListener(type, handler, true);
      listeners.push({ target, type, handler });
    };

    for (const type of eventTypes) {
      attach(document, type, 'document');
      clickTargets.forEach((target, index) => {
        attach(target, type, `clickTarget:${index + 1}`);
      });
    }

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement) || !DOMHelper.isVisible(node)) {
            return;
          }

          if (!this.isPotentialSnippetOverlayNode(node)) {
            return;
          }

          logger.info('Trace mutation added', {
            node: this.describeElement(node),
            textPreview: (node.textContent || '').trim().slice(0, 200),
          });
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const timeoutId = window.setTimeout(() => {
      stop();
    }, 2500);

    const stop = (): void => {
      window.clearTimeout(timeoutId);
      observer.disconnect();

      listeners.forEach(({ target, type, handler }) => {
        target.removeEventListener(type, handler, true);
      });

      logger.info('Snippet interaction trace finished');
    };

    return stop;
  }

  /**
   * Waits for a fragment dropdown that looks real, not just an empty wrapper.
   */
  private async waitForSnippetDropdown(
    timeout: number,
    button?: HTMLElement
  ): Promise<HTMLElement | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const dropdown = this.findOpenSnippetDropdown(button);
      if (dropdown) {
        return dropdown;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return null;
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
  private findSearchField(context: SearchFieldContext = {}): HTMLElement | null {
    const containers = context.container
      ? [context.container]
      : context.requireDropdown
        ? this.findDropdownCandidates(context.button)
        : [];

    if (context.requireDropdown) {
      for (const container of containers) {
        const field = this.findSearchFieldInContainer(container, context);
        if (field) {
          return field;
        }
      }

      return null;
    }

    return this.findBestFallbackSearchField(context);
  }

  /**
   * Searches for the fragment search field strictly inside a candidate dropdown container.
   */
  private findSearchFieldInContainer(
    container: HTMLElement,
    context: SearchFieldContext
  ): HTMLElement | null {
    for (const selector of SEARCH_FIELD_SELECTORS) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        for (const element of Array.from(elements)) {
          if (!container.contains(element)) {
            continue;
          }

          if (this.isEligibleSearchField(element, context)) {
            return element;
          }
        }
      } catch (error) {
        logger.warn('Invalid search field selector', { selector, error: String(error) });
      }
    }

    return this.findBestFallbackSearchField({ ...context, container });
  }

  /**
   * Determines whether an element can receive search text for the snippets panel.
   */
  private isEligibleSearchField(
    element: HTMLElement | null,
    context: SearchFieldContext = {}
  ): element is HTMLElement {
    if (!element || !this.isTextEntryElement(element)) {
      return false;
    }

    if (!DOMHelper.isVisible(element)) {
      return false;
    }

    if (element.closest('#conv-composer-toolbar')) {
      return false;
    }

    if (context.container && !context.container.contains(element)) {
      return false;
    }

    if (
      context.ignoreElement &&
      (element === context.ignoreElement ||
        element.contains(context.ignoreElement) ||
        context.ignoreElement.contains(element))
    ) {
      return false;
    }

    if (
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
      (element.disabled || element.readOnly)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Restricts fallback matching to text-entry widgets.
   */
  private isTextEntryElement(element: HTMLElement): boolean {
    if (element instanceof HTMLInputElement) {
      const type = (element.type || 'text').toLowerCase();
      return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(type);
    }

    if (element instanceof HTMLTextAreaElement) {
      return true;
    }

    if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
      return true;
    }

    const role = (element.getAttribute('role') || '').toLowerCase();
    return ['textbox', 'combobox', 'searchbox'].includes(role);
  }

  /**
   * Looks for the most likely text-entry field when static selectors are no longer enough.
   */
  private findBestFallbackSearchField(context: SearchFieldContext): HTMLElement | null {
    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const candidates = new Set<HTMLElement>();

    if (
      activeElement &&
      (!context.container || context.container.contains(activeElement))
    ) {
      candidates.add(activeElement);
    }

    const scope = context.container ?? document;
    const textEntryCandidates = scope.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
    );
    textEntryCandidates.forEach(candidate => candidates.add(candidate));

    let bestCandidate: HTMLElement | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.scoreSearchFieldCandidate(candidate, context);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Scores fallback candidates using label keywords, overlay context, focus and distance.
   */
  private scoreSearchFieldCandidate(
    element: HTMLElement | null,
    context: SearchFieldContext
  ): number {
    if (!this.isEligibleSearchField(element, context)) {
      return 0;
    }

    let score = 10;
    const metadata = this.getFieldMetadata(element);
    const role = (element.getAttribute('role') || '').toLowerCase();

    if (SEARCH_FIELD_KEYWORDS.some(keyword => metadata.includes(keyword))) {
      score += 80;
    }

    if (element instanceof HTMLInputElement && element.type.toLowerCase() === 'search') {
      score += 60;
    }

    if (role === 'searchbox') {
      score += 60;
    } else if (role === 'combobox') {
      score += 45;
    } else if (role === 'textbox') {
      score += 25;
    }

    if (this.isInsideDropdownContainer(element)) {
      score += 30;
    }

    if (
      document.activeElement === element ||
      element.matches(':focus') ||
      element.contains(document.activeElement)
    ) {
      score += 25;
    }

    if (context.button) {
      const distance = this.getElementDistance(context.button, element);
      if (distance < 240) {
        score += 25;
      } else if (distance < 420) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Extracts searchable metadata from a field-like element.
   */
  private getFieldMetadata(element: HTMLElement): string {
    const attributeValues = [
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
      element.getAttribute('data-placeholder'),
      element.getAttribute('data-testid'),
      element.getAttribute('role'),
      element.id,
      element.className,
    ];

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      attributeValues.push(element.placeholder);
      attributeValues.push(element.type);
    }

    return attributeValues
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();
  }

  /**
   * Returns the most likely open fragment dropdown anchored to the composer button.
   */
  private findOpenSnippetDropdown(button?: HTMLElement): HTMLElement | null {
    const candidates = this.findDropdownCandidates(button);
    for (const candidate of candidates) {
      if (this.isLikelySnippetDropdown(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Checks whether the candidate lives inside a visible overlay-like container.
   */
  private isInsideDropdownContainer(element: HTMLElement): boolean {
    for (const selector of DROPDOWN_CONTAINER_SELECTORS) {
      try {
        const container = element.closest<HTMLElement>(selector);
        if (container && DOMHelper.isVisible(container)) {
          return true;
        }
      } catch (error) {
        logger.warn('Invalid dropdown selector', { selector, error: String(error) });
      }
    }

    return false;
  }

  /**
   * Scores dropdown candidates so the popover nearest to the Fragmentos button wins.
   */
  private scoreDropdownCandidate(container: HTMLElement, button?: HTMLElement): number {
    let score = 0;
    const metadata = this.getContainerMetadata(container);
    const rect = container.getBoundingClientRect();
    const style = window.getComputedStyle(container);
    const textEntries = container.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
    );

    if (metadata.includes('popover') || metadata.includes('follower')) {
      score += 40;
    }

    if (metadata.includes('fragment') || metadata.includes('snippet')) {
      score += 120;
    }

    if (textEntries.length > 0) {
      score += 35;
    }

    for (const entry of Array.from(textEntries)) {
      const entryMetadata = this.getFieldMetadata(entry);
      if (entryMetadata.includes('fragment')) {
        score += 220;
        break;
      }
      if (entryMetadata.includes('snippet')) {
        score += 160;
        break;
      }
    }

    if (
      container.querySelector('.overflow-y-auto, .list-none, [role="listbox"], [role="option"], li')
    ) {
      score += 20;
    }

    if (style.position === 'absolute' || style.position === 'fixed') {
      score += 15;
    }

    if (Number.parseInt(style.zIndex || '0', 10) >= 1000) {
      score += 10;
    }

    if (rect.width >= 250 && rect.height >= 80) {
      score += 10;
    }

    if (button) {
      const distance = this.getElementDistance(button, container);
      if (distance < 220) {
        score += 50;
      } else if (distance < 360) {
        score += 30;
      } else if (distance < 520) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Rejects generic empty followers and keeps only dropdowns that resemble Fragmentos.
   */
  private isLikelySnippetDropdown(container: HTMLElement): boolean {
    const metadata = this.getContainerMetadata(container);
    const textEntries = container.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
    );

    if (metadata.includes('fragment') || metadata.includes('snippet')) {
      return true;
    }

    if (textEntries.length === 0) {
      return false;
    }

    for (const textEntry of Array.from(textEntries)) {
      const entryMetadata = this.getFieldMetadata(textEntry);
      if (SEARCH_FIELD_KEYWORDS.some(keyword => entryMetadata.includes(keyword))) {
        return true;
      }
    }

    return Boolean(
      container.querySelector('.hr-popover__content, .overflow-y-auto, .list-none, [role="listbox"], li')
    );
  }

  /**
   * Extracts searchable metadata from a candidate dropdown container.
   */
  private getContainerMetadata(container: HTMLElement): string {
    return [
      container.id,
      container.className,
      container.getAttribute('role'),
      container.getAttribute('data-testid'),
      container.textContent?.slice(0, 400),
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();
  }

  /**
   * Measures the distance between the centers of two elements.
   */
  private getElementDistance(source: HTMLElement, target: HTMLElement): number {
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    return Math.hypot(sourceX - targetX, sourceY - targetY);
  }

  /**
   * Waits for the snippet search field to appear after opening the panel.
   */
  private async waitForSearchField(
    timeout: number,
    context: SearchFieldContext = {}
  ): Promise<HTMLElement | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const field = this.findSearchField(context);
      if (field) {
        return this.resolveFocusableSearchField(field, context.container) ?? field;
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
      const targetField = this.resolveFocusableSearchField(field) ?? field;

      targetField.focus({ preventScroll: true });
      targetField.click();

      if (targetField instanceof HTMLInputElement || targetField instanceof HTMLTextAreaElement) {
        targetField.select();
        if (typeof targetField.setSelectionRange === 'function') {
          targetField.setSelectionRange(0, targetField.value.length);
        }
      }

      const focused =
        document.activeElement === targetField ||
        targetField.matches(':focus') ||
        targetField.contains(document.activeElement);

      logger.info('Search field focus attempt completed', {
        focused,
        tagName: targetField.tagName,
        placeholder: targetField instanceof HTMLInputElement || targetField instanceof HTMLTextAreaElement
          ? targetField.placeholder
          : null,
        ariaLabel: targetField.getAttribute('aria-label'),
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
  private logDropdownStructure(button?: HTMLElement, ignoreElement?: HTMLElement | null): void {
    const dropdowns = this.findDropdownCandidates(button);
    if (!dropdowns.length) {
      logger.warn('Dropdown element not found');
      return;
    }

    logger.warn(`Dropdown candidates found: ${dropdowns.length}`);

    dropdowns.slice(0, 3).forEach((dropdown, index) => {
      const inputs = dropdown.querySelectorAll('input');
      const textFields = dropdown.querySelectorAll(
        'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
      );
      logger.warn(`Dropdown ${index}: tag="${dropdown.tagName}" id="${dropdown.id}" role="${dropdown.getAttribute('role')}" class="${dropdown.className}"`);
      logger.warn(`Dropdown ${index}: ${inputs.length} input(s), ${textFields.length} text-entry candidate(s)`);
    });

    const fallbackCandidates = this.findFallbackDebugCandidates({ button, ignoreElement });
    logger.warn(`Global fallback candidates: ${fallbackCandidates.length}`);
    fallbackCandidates.slice(0, 5).forEach(({ candidate, score }, index) => {
      logger.warn(
        `Candidate ${index}: tag="${candidate.tagName}" role="${candidate.getAttribute('role')}" score=${score} metadata="${this.getFieldMetadata(candidate)}"`
      );
    });
  }

  /**
   * Collects visible overlay candidates and ranks them by proximity to the clicked button.
   */
  private findDropdownCandidates(button?: HTMLElement): HTMLElement[] {
    const candidates = new Set<HTMLElement>();

    for (const selector of DROPDOWN_CONTAINER_SELECTORS) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        elements.forEach(element => {
          if (DOMHelper.isVisible(element)) {
            candidates.add(element);
          }
        });
      } catch (error) {
        logger.warn('Invalid dropdown selector', { selector, error: String(error) });
      }
    }

    return Array.from(candidates)
      .map(container => ({
        container,
        score: this.scoreDropdownCandidate(container, button),
      }))
      .filter(({ score }) => score >= 40)
      .sort((left, right) => right.score - left.score)
      .map(({ container }) => container);
  }

  /**
   * Builds a short ranked list of global text-entry candidates for debug output.
   */
  private findFallbackDebugCandidates(context: SearchFieldContext): Array<{ candidate: HTMLElement; score: number }> {
    const candidates = new Set<HTMLElement>();
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (activeElement) {
      candidates.add(activeElement);
    }

    document
      .querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
      )
      .forEach(candidate => candidates.add(candidate));

    return Array.from(candidates)
      .map(candidate => ({
        candidate,
        score: this.scoreSearchFieldCandidate(candidate, context),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score);
  }

  /**
   * Resolves wrapper elements like #snippets-search down to the actual input to focus.
   */
  private resolveFocusableSearchField(
    field: HTMLElement,
    container?: HTMLElement | null
  ): HTMLElement | null {
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field.isContentEditable ||
      ['textbox', 'combobox', 'searchbox'].includes((field.getAttribute('role') || '').toLowerCase())
    ) {
      return field;
    }

    const scopes = [field, container].filter((scope): scope is HTMLElement => Boolean(scope));
    for (const scope of scopes) {
      const nestedField = scope.querySelector<HTMLElement>(
        '#snippets-search input.hr-input__input:not([type="hidden"]):not([disabled]), ' +
          '#snippets-search input:not([type="hidden"]):not([disabled]), ' +
          'input.hr-input__input:not([type="hidden"]):not([disabled]), ' +
          'input[placeholder*="fragmento/carpeta" i]:not([type="hidden"]):not([disabled]), ' +
          'input:not([type="hidden"]):not([disabled]), ' +
          'textarea:not([disabled]), ' +
          '[contenteditable="true"], ' +
          '[role="textbox"], ' +
          '[role="combobox"], ' +
          '[role="searchbox"]'
      );

      if (nestedField && this.isEligibleSearchField(nestedField, { container })) {
        return nestedField;
      }
    }

    return null;
  }

  /**
   * Emits the current active element to correlate focus changes with click attempts.
   */
  private logActiveElement(message: string, reference?: Element): void {
    logger.info(message, {
      reference: this.describeElement(reference ?? null),
      activeElement: this.describeElement(
        document.activeElement instanceof Element ? document.activeElement : null
      ),
    });
  }

  /**
   * Produces a compact element descriptor for debug logs.
   */
  private describeElement(element: Element | null): Record<string, string | null> | null {
    if (!element) {
      return null;
    }

    const htmlElement = element instanceof HTMLElement ? element : null;
    const inputElement =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
        ? element
        : null;

    return {
      tag: element.tagName,
      id: htmlElement?.id || null,
      role: element.getAttribute('role'),
      className:
        htmlElement?.className ||
        (element instanceof SVGElement ? element.getAttribute('class') : null),
      ariaLabel: element.getAttribute('aria-label'),
      placeholder: inputElement?.placeholder || null,
      text: (element.textContent || '').trim().slice(0, 80) || null,
    };
  }

  /**
   * Filters mutation logs to overlays and popovers relevant to the snippet flow.
   */
  private isPotentialSnippetOverlayNode(node: HTMLElement): boolean {
    const metadata = [
      node.className,
      node.id,
      node.getAttribute('role'),
      node.getAttribute('data-testid'),
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();

    if (
      metadata.includes('popover') ||
      metadata.includes('dropdown') ||
      metadata.includes('follower') ||
      metadata.includes('fragment') ||
      metadata.includes('snippet')
    ) {
      return true;
    }

    return Boolean(
      node.querySelector(
        '.hr-popover, .hr-dropdown__trigger-wrapper, .v-binder-follower-content, [role="dialog"], [role="listbox"]'
      )
    );
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
