"use strict";
(() => {
  // src/utils/constants.ts
  var TRIGGER_KEY = "/";
  var BUTTON_SELECTORS = [
    // Most specific: exact Tailwind classes from the insert snippet button
    "div.text-gray-500.h-8.w-8.flex.justify-center.items-center.cursor-pointer.rounded-full",
    "div.text-gray-500.h-8.w-8.flex.justify-center.cursor-pointer",
    // Alternative Tailwind patterns for insert snippet
    'div.cursor-pointer.items-center[class*="text-gray"]',
    "div.flex.justify-center.items-center.cursor-pointer.h-8.w-8",
    // Try to match 'Insert Snippet' text or aria-label (button elements)
    'button[aria-label*="Snippet"]',
    'button[data-testid="insert-snippet"]',
    'button[class*="snippet"]',
    'button[aria-label="Insert Snippet"]',
    // DIV-based buttons with role
    'div[role="button"][aria-label*="Snippet"]',
    'div[role="button"][class*="flex"]',
    // Generic fallback patterns
    'div[class*="flex"][class*="cursor-pointer"]'
  ];
  var SEARCH_FIELD_SELECTORS = [
    '#snippets-dropdown input:not([type="hidden"]):not([disabled])',
    "#snippets-dropdown textarea:not([disabled])",
    '#snippets-dropdown [contenteditable="true"]',
    '#snippets-dropdown [role="textbox"]',
    '#snippets-dropdown [role="combobox"]',
    '[id*="snippet" i] input:not([type="hidden"]):not([disabled])',
    '[id*="snippet" i] textarea:not([disabled])',
    '[id*="snippet" i] [contenteditable="true"]',
    '[data-testid*="snippet" i] input:not([type="hidden"]):not([disabled])',
    '[data-testid*="snippet" i] [role="textbox"]',
    '[role="dialog"] input[placeholder*="Search" i]:not([type="hidden"]):not([disabled])',
    '[role="dialog"] input[aria-label*="Search" i]:not([type="hidden"]):not([disabled])',
    '[role="dialog"] input:not([type="hidden"]):not([disabled])',
    '[role="dialog"] textarea:not([disabled])',
    '[role="dialog"] [contenteditable="true"]',
    'input[placeholder*="Snippet" i]:not([type="hidden"]):not([disabled])',
    'input[aria-label*="Snippet" i]:not([type="hidden"]):not([disabled])',
    'input[placeholder*="Search" i]:not([type="hidden"]):not([disabled])',
    'input[type="search"]:not([disabled])'
  ];
  var DEBOUNCE_DELAY = 100;
  var OPERATION_TIMEOUT = {
    FIND_BUTTON: 500,
    SIMULATE_CLICK: 200
  };
  var DEBUG_MODE = true;
  var EXTENSION_NS = "data-slash-ext";

  // src/utils/logger.ts
  var Logger = class {
    constructor() {
      this.logs = [];
      this.isDebugMode = DEBUG_MODE;
      this.MAX_LOGS = 1e3;
    }
    setDebugMode(enabled) {
      this.isDebugMode = enabled;
    }
    createEntry(level, message, data) {
      return {
        level,
        message,
        timestamp: Date.now(),
        data
      };
    }
    formatLog(entry) {
      const timestamp = new Date(entry.timestamp).toISOString();
      const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
      return `[${timestamp}] [${entry.level}] ${entry.message}${dataStr}`;
    }
    addLog(entry) {
      this.logs.push(entry);
      if (this.logs.length > this.MAX_LOGS) {
        this.logs.shift();
      }
    }
    output(entry) {
      const formatted = this.formatLog(entry);
      switch (entry.level) {
        case "DEBUG" /* DEBUG */:
          if (this.isDebugMode)
            console.debug(formatted);
          break;
        case "INFO" /* INFO */:
          console.info(formatted);
          break;
        case "WARN" /* WARN */:
          console.warn(formatted);
          break;
        case "ERROR" /* ERROR */:
          console.error(formatted);
          break;
      }
    }
    debug(message, data) {
      const entry = this.createEntry("DEBUG" /* DEBUG */, message, data);
      this.addLog(entry);
      this.output(entry);
    }
    info(message, data) {
      const entry = this.createEntry("INFO" /* INFO */, message, data);
      this.addLog(entry);
      this.output(entry);
    }
    warn(message, data) {
      const entry = this.createEntry("WARN" /* WARN */, message, data);
      this.addLog(entry);
      this.output(entry);
    }
    error(message, data) {
      const entry = this.createEntry("ERROR" /* ERROR */, message, data);
      this.addLog(entry);
      this.output(entry);
    }
    getLogs() {
      return [...this.logs];
    }
    clearLogs() {
      this.logs = [];
    }
  };
  var logger = new Logger();

  // src/utils/config.ts
  var Config = class {
    constructor(customConfig) {
      this.config = {
        triggerKey: customConfig?.triggerKey ?? TRIGGER_KEY,
        buttonSelectors: customConfig?.buttonSelectors ?? [...BUTTON_SELECTORS],
        debugMode: customConfig?.debugMode ?? DEBUG_MODE
      };
    }
    getTriggerKey() {
      return this.config.triggerKey;
    }
    getButtonSelectors() {
      return [...this.config.buttonSelectors];
    }
    isDebugMode() {
      return this.config.debugMode;
    }
    setTriggerKey(key) {
      if (key.length === 1) {
        this.config.triggerKey = key;
      }
    }
    setButtonSelectors(selectors) {
      if (selectors.length > 0) {
        this.config.buttonSelectors = selectors;
      }
    }
    setDebugMode(enabled) {
      this.config.debugMode = enabled;
    }
    getConfig() {
      return Object.freeze({ ...this.config });
    }
  };
  var config = new Config();

  // src/content/dom-helper.ts
  var DOMHelper = class {
    /**
     * Finds the snippet button using multiple selector strategies
     * @param selectors - Array of selectors to try
     * @returns HTMLElement if found, null otherwise
     */
    static findSnippetButton(selectors) {
      logger.debug("Searching for snippet button", { selectorsCount: selectors.length });
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (!element)
            continue;
          const targetElement = element.closest(
            'button, [role="button"], [tabindex], div.cursor-pointer'
          ) ?? (element.tagName.toLowerCase() === "svg" ? element.parentElement : element);
          if (targetElement && this.isVisible(targetElement)) {
            logger.info("Found snippet button", { selector, elementTag: targetElement.tagName });
            return targetElement;
          }
        } catch (error) {
          logger.warn("Invalid selector", { selector, error: String(error) });
        }
      }
      const buttons = document.querySelectorAll("button");
      for (const button of Array.from(buttons)) {
        if (button.textContent?.toLowerCase().includes("snippet") && this.isVisible(button)) {
          logger.info("Found snippet button by text content");
          return button;
        }
      }
      logger.warn("Snippet button not found");
      return null;
    }
    /**
     * Checks if an element is actually visible in the viewport
     * @param element - Element to check
     * @returns true if visible, false otherwise
     */
    static isVisible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && !element.hasAttribute("hidden") && rect.width > 0 && rect.height > 0;
    }
    /**
     * Simulates a natural click on the element
     * Uses multiple strategies to ensure the click is detected
     * @param element - Element to click
     * @returns true if click was successful
     */
    static simulateClick(element) {
      try {
        element.focus();
        logger.debug("Element focused");
        this.dispatchPointerEvents(element);
        this.dispatchMouseEvents(element);
        element.click();
        logger.debug("Click simulated via element.click()");
        element.setAttribute(EXTENSION_NS + "-triggered", "true");
        return true;
      } catch (error) {
        logger.error("Failed to simulate click", { error: String(error) });
        return false;
      }
    }
    /**
     * Dispatches pointer events (for Vue 3 and modern frameworks)
     * @param element - Target element
     */
    static dispatchPointerEvents(element) {
      const pointerEvents = ["pointerdown", "pointerup"];
      for (const eventType of pointerEvents) {
        const event = new PointerEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true
        });
        element.dispatchEvent(event);
      }
      logger.debug("Pointer events dispatched");
    }
    /**
     * Dispatches mouse events to simulate a natural click
     * @param element - Target element
     */
    static dispatchMouseEvents(element) {
      const events = ["mousedown", "mouseup"];
      for (const eventType of events) {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          buttons: eventType === "mousedown" ? 1 : 0
        });
        element.dispatchEvent(event);
      }
      logger.debug("Mouse down/up events dispatched");
    }
    /**
     * Waits for an element to appear in the DOM
     * Useful for waiting for UI updates after click
     * @param selector - CSS selector
     * @param timeout - Timeout in ms
     * @returns Promise resolving to element or null
     */
    static async waitForElement(selector, timeout = OPERATION_TIMEOUT.FIND_BUTTON) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      logger.warn("Element not found within timeout", { selector, timeout });
      return null;
    }
    /**
     * Checks if element is within a text input or contenteditable
     * Prevents triggering snippet when user is typing in an input
     * @param target - Target element from event
     * @returns true if inside input/textarea/contenteditable
     */
    static isInsideInput(target) {
      if (!(target instanceof Element)) {
        return false;
      }
      const element = target;
      const tagName = element.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") {
        return true;
      }
      if (element.contentEditable === "true" || element.isContentEditable) {
        return true;
      }
      let parent = element.parentElement;
      while (parent) {
        if (parent.contentEditable === "true" || parent.tagName.toLowerCase() === "input") {
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
    static focusElement(element) {
      try {
        element.focus({ preventScroll: true });
        logger.debug("Element focused");
      } catch (error) {
        logger.warn("Failed to focus element", { error: String(error) });
      }
    }
  };

  // src/content/detector.ts
  var KeystrokeDetector = class {
    /**
     * Detects if the keystroke should trigger the snippet button click
     * @param eventData - Keyboard event data
     * @param triggerKey - The key that should trigger the action
     * @returns true if should trigger, false otherwise
     */
    static shouldTrigger(eventData, triggerKey) {
      if (eventData.key !== triggerKey) {
        return false;
      }
      if (eventData.ctrlKey || eventData.metaKey) {
        logger.debug("Modifier key detected, skipping trigger");
        return false;
      }
      logger.debug("Trigger condition met");
      return true;
    }
    /**
     * Validates if the event target is appropriate for triggering
     * @param target - Event target
     * @param excludedTags - HTML tags where trigger should be ignored
     * @returns true if valid target, false otherwise
     */
    static isValidTarget(target, excludedTags = ["input", "textarea"]) {
      if (!target) {
        return false;
      }
      if (!(target instanceof Element)) {
        return false;
      }
      const tagName = target.tagName.toLowerCase();
      return !excludedTags.includes(tagName);
    }
  };

  // src/content/content.ts
  var SlashSnippetExtension = class {
    constructor() {
      this.lastTriggerTime = 0;
      this.isInitialized = false;
      this.keydownHandler = this.handleKeydown.bind(this);
    }
    /**
     * Initializes the extension
     * Attaches event listeners and sets up logging
     */
    init() {
      if (this.isInitialized) {
        logger.warn("Extension already initialized");
        return;
      }
      logger.info("Initializing Slash Snippet Extension");
      if (config.isDebugMode()) {
        logger.debug("Debug mode enabled");
      }
      document.addEventListener("keydown", this.keydownHandler, true);
      this.isInitialized = true;
      logger.info("Extension initialized successfully");
    }
    /**
     * Handles keydown events
     * Applies debouncing to prevent multiple triggers from rapid keypresses
     * @param event - KeyboardEvent
     */
    handleKeydown(event) {
      const now = Date.now();
      if (now - this.lastTriggerTime < DEBOUNCE_DELAY) {
        return;
      }
      const triggerKey = config.getTriggerKey();
      const eventData = {
        key: event.key,
        target: event.target,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey
      };
      if (!KeystrokeDetector.shouldTrigger(eventData, triggerKey)) {
        return;
      }
      logger.debug("Keystroke triggered", {
        targetTag: event.target?.tagName,
        targetClass: event.target?.className
      });
      void this.handleTrigger(event, now);
    }
    /**
     * Continues the trigger flow asynchronously so we can cancel the original '/'
     * only when there is a matching snippet UI to interact with.
     */
    async handleTrigger(event, triggerTime) {
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
        logger.warn("Could not find snippet button");
        return;
      }
      this.cancelTriggerEvent(event);
      logger.debug("Proceeding to trigger snippet button");
      const triggerSuccess = await this.triggerSnippetButton(button);
      if (triggerSuccess) {
        this.lastTriggerTime = triggerTime;
      }
    }
    /**
     * Main logic: finds and clicks the snippet button
     */
    async triggerSnippetButton(button) {
      logger.debug("Triggering snippet button");
      const targetButton = button ?? DOMHelper.findSnippetButton(config.getButtonSelectors());
      if (!targetButton) {
        logger.warn("Could not find snippet button");
        return false;
      }
      DOMHelper.focusElement(targetButton);
      const clickSuccess = DOMHelper.simulateClick(targetButton);
      if (clickSuccess) {
        logger.info("Snippet button clicked successfully");
        const searchField = await this.waitForSearchField(1500);
        if (searchField) {
          return this.focusSearchField(searchField);
        }
        logger.warn("Search field not found after clicking snippet button");
        this.logDropdownStructure();
        return false;
      } else {
        logger.error("Failed to click snippet button");
        return false;
      }
    }
    /**
     * Cancels the original slash key so it does not leak into the current editor.
     */
    cancelTriggerEvent(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    /**
     * Finds the search field in the snippet panel using multiple selector strategies.
     */
    findSearchField() {
      for (const selector of SEARCH_FIELD_SELECTORS) {
        try {
          const element = document.querySelector(selector);
          if (!element) {
            continue;
          }
          if (!DOMHelper.isVisible(element)) {
            continue;
          }
          if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && (element.disabled || element.readOnly)) {
            continue;
          }
          return element;
        } catch (error) {
          logger.warn("Invalid search field selector", { selector, error: String(error) });
        }
      }
      return null;
    }
    /**
     * Waits for the snippet search field to appear after opening the panel.
     */
    async waitForSearchField(timeout) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const field = this.findSearchField();
        if (field) {
          return field;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return null;
    }
    /**
     * Focuses the snippet search field and verifies that focus landed there.
     */
    focusSearchField(field) {
      try {
        field.focus({ preventScroll: true });
        field.click();
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          field.select();
        }
        const focused = document.activeElement === field || field.matches(":focus") || field.contains(document.activeElement);
        logger.info("Search field focus attempt completed", {
          focused,
          tagName: field.tagName,
          placeholder: field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field.placeholder : null,
          ariaLabel: field.getAttribute("aria-label")
        });
        return focused;
      } catch (error) {
        logger.error("Failed to focus search field", { error: String(error) });
        return false;
      }
    }
    /**
     * Logs all dropdown-related elements for debugging
     */
    logDropdownStructure() {
      const dropdown = document.querySelector(
        '#snippets-dropdown, [id*="snippet" i], [data-testid*="snippet" i], [role="dialog"]'
      );
      if (!dropdown) {
        logger.warn("Dropdown element not found");
        return;
      }
      logger.warn("Dropdown structure:");
      const inputs = dropdown.querySelectorAll("input");
      logger.warn(`Found ${inputs.length} input(s) in dropdown`);
      inputs.forEach((input, i) => {
        logger.warn(`Input ${i}: placeholder="${input.placeholder}", type="${input.type}", class="${input.className}"`);
      });
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
    destroy() {
      document.removeEventListener("keydown", this.keydownHandler, true);
      this.isInitialized = false;
      logger.info("Extension destroyed");
    }
  };
  var extension = new SlashSnippetExtension();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      extension.init();
    });
  } else {
    extension.init();
  }
  setTimeout(() => {
    if (!extension["isInitialized"]) {
      extension.init();
    }
  }, 100);
  logger.debug("Content script loaded");
})();
