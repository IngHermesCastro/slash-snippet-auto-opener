"use strict";
(() => {
  // src/utils/constants.ts
  var TRIGGER_KEY = "/";
  var BUTTON_SELECTORS = [
    // Current "Fragments" icon inside the conversation composer toolbar
    '#conv-composer-toolbar .icon-wrapper svg path[d*="M16 13H8m8 4H8m2-8H8"]',
    '#conv-composer-toolbar .icon-wrapper svg path[d^="M14 2.276"]',
    '#conv-composer-toolbar .icon-wrapper [aria-label*="Fragment" i]',
    '#conv-composer-toolbar .icon-wrapper [title*="Fragment" i]',
    '#conv-composer-toolbar .icon-wrapper [data-tooltip-content*="Fragment" i]',
    '#conv-composer-toolbar .icon-wrapper [aria-label*="Snippet" i]',
    '#conv-composer-toolbar .icon-wrapper [title*="Snippet" i]',
    '#conv-composer-toolbar .icon-wrapper [data-tooltip-content*="Snippet" i]',
    // Most specific: exact Tailwind classes from the insert snippet button
    "div.text-gray-500.h-8.w-8.flex.justify-center.items-center.cursor-pointer.rounded-full",
    "div.text-gray-500.h-8.w-8.flex.justify-center.cursor-pointer",
    // Alternative Tailwind patterns for insert snippet
    'div.cursor-pointer.items-center[class*="text-gray"]',
    "div.flex.justify-center.items-center.cursor-pointer.h-8.w-8",
    // Try to match 'Insert Snippet' text or aria-label (button elements)
    'button[aria-label*="Fragment" i]',
    'button[aria-label*="Snippet"]',
    'button[data-testid="insert-snippet"]',
    'button[class*="snippet"]',
    'button[aria-label="Insert Snippet"]',
    // DIV-based buttons with role
    'div[role="button"][aria-label*="Fragment" i]',
    'div[role="button"][aria-label*="Snippet"]',
    '#conv-composer-toolbar div[role="button"][class*="flex"]',
    // Generic fallback patterns
    '#conv-composer-toolbar div[class*="flex"][class*="cursor-pointer"]'
  ];
  var SEARCH_FIELD_SELECTORS = [
    '#snippets-search input.hr-input__input:not([type="hidden"]):not([disabled])',
    '#snippets-search input:not([type="hidden"]):not([disabled])',
    '.hr-popover #snippets-search input.hr-input__input:not([type="hidden"]):not([disabled])',
    '.hr-popover input[placeholder*="fragmento/carpeta" i]:not([type="hidden"]):not([disabled])',
    '#snippets-dropdown input:not([type="hidden"]):not([disabled])',
    "#snippets-dropdown textarea:not([disabled])",
    '#snippets-dropdown [contenteditable="true"]',
    '#snippets-dropdown [role="textbox"]',
    '#snippets-dropdown [role="combobox"]',
    '#snippets-dropdown [role="searchbox"]',
    '[id*="snippet" i] input:not([type="hidden"]):not([disabled])',
    '[id*="snippet" i] textarea:not([disabled])',
    '[id*="snippet" i] [contenteditable="true"]',
    '[data-testid*="snippet" i] input:not([type="hidden"]):not([disabled])',
    '[data-testid*="snippet" i] [role="textbox"]',
    '[data-testid*="snippet" i] [role="combobox"]',
    '[data-testid*="snippet" i] [role="searchbox"]',
    '[role="dialog"] input[placeholder*="Search" i]:not([type="hidden"]):not([disabled])',
    '[role="dialog"] input[placeholder*="Buscar" i]:not([type="hidden"]):not([disabled])',
    '[role="dialog"] input[aria-label*="Search" i]:not([type="hidden"]):not([disabled])',
    '[role="dialog"] input[aria-label*="Buscar" i]:not([type="hidden"]):not([disabled])',
    '[role="dialog"] input:not([type="hidden"]):not([disabled])',
    '[role="dialog"] textarea:not([disabled])',
    '[role="dialog"] [contenteditable="true"]',
    '[role="dialog"] [role="textbox"]',
    '[role="dialog"] [role="combobox"]',
    '[role="dialog"] [role="searchbox"]',
    'input[placeholder*="Snippet" i]:not([type="hidden"]):not([disabled])',
    'input[placeholder*="Fragment" i]:not([type="hidden"]):not([disabled])',
    'input[aria-label*="Snippet" i]:not([type="hidden"]):not([disabled])',
    'input[aria-label*="Fragment" i]:not([type="hidden"]):not([disabled])',
    'input[placeholder*="Search" i]:not([type="hidden"]):not([disabled])',
    'input[placeholder*="Buscar" i]:not([type="hidden"]):not([disabled])',
    'input[aria-label*="Buscar" i]:not([type="hidden"]):not([disabled])',
    'input[type="search"]:not([disabled])',
    '[role="searchbox"]',
    '[role="combobox"]'
  ];
  var SEARCH_FIELD_KEYWORDS = [
    "search",
    "buscar",
    "snippet",
    "snippets",
    "fragment",
    "fragmento",
    "fragmentos"
  ];
  var DROPDOWN_CONTAINER_SELECTORS = [
    ".v-binder-follower-content .hr-popover",
    ".v-binder-follower-content",
    ".v-binder-follower-container.hr-detached-container",
    ".hr-popover",
    "#snippets-dropdown",
    '[id*="snippet" i]',
    '[data-testid*="snippet" i]',
    '[role="dialog"]',
    '[role="listbox"]',
    '[role="menu"]',
    '[class*="dropdown" i]',
    '[class*="popover" i]',
    '[class*="command" i]',
    '[class*="autocomplete" i]'
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
          const elements = document.querySelectorAll(selector);
          if (!elements.length) {
            continue;
          }
          for (const element of Array.from(elements)) {
            const targetElement = this.resolveClickableTarget(element);
            if (targetElement && this.isVisible(targetElement)) {
              logger.info("Found snippet button", {
                selector,
                elementTag: targetElement.tagName,
                className: targetElement.className
              });
              return targetElement;
            }
          }
        } catch (error) {
          logger.warn("Invalid selector", { selector, error: String(error) });
        }
      }
      const buttons = document.querySelectorAll("button");
      for (const button of Array.from(buttons)) {
        const buttonText = button.textContent?.toLowerCase() ?? "";
        if ((buttonText.includes("snippet") || buttonText.includes("fragment")) && this.isVisible(button)) {
          logger.info("Found snippet button by text content");
          return button;
        }
      }
      logger.warn("Snippet button not found");
      return null;
    }
    /**
     * Resolves SVG/path/icon matches to the clickable wrapper that actually receives the event.
     */
    static resolveClickableTarget(element) {
      if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
        return null;
      }
      const explicitClickable = element.closest('button, [role="button"], [tabindex], .cursor-pointer');
      if (explicitClickable instanceof HTMLElement) {
        return explicitClickable;
      }
      if (explicitClickable instanceof SVGElement) {
        return explicitClickable.parentElement;
      }
      if (element instanceof SVGElement) {
        const nearestWrapper = element.parentElement?.closest(
          'button, [role="button"], [tabindex], div.cursor-pointer, .icon-wrapper'
        );
        return nearestWrapper ?? element.parentElement;
      }
      return element.closest(".icon-wrapper") ?? element;
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
        const rect = element.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        this.dispatchPointerEvents(element, clientX, clientY);
        this.dispatchMouseEvents(element, clientX, clientY);
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0,
          buttons: 0,
          clientX,
          clientY
        });
        element.dispatchEvent(clickEvent);
        logger.debug("Click simulated via dispatched click event");
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
    static dispatchPointerEvents(element, clientX, clientY) {
      const pointerEvents = ["pointerdown", "pointerup"];
      for (const eventType of pointerEvents) {
        const event = new PointerEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          clientX,
          clientY
        });
        element.dispatchEvent(event);
      }
      logger.debug("Pointer events dispatched");
    }
    /**
     * Dispatches mouse events to simulate a natural click
     * @param element - Target element
     */
    static dispatchMouseEvents(element, clientX, clientY) {
      const events = ["mousedown", "mouseup"];
      for (const eventType of events) {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          buttons: eventType === "mousedown" ? 1 : 0,
          button: 0,
          clientX,
          clientY
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
      const buttonSelectors = config.getButtonSelectors();
      const button = DOMHelper.findSnippetButton(buttonSelectors);
      if (!button) {
        logger.warn("Could not find snippet button");
        return;
      }
      const existingDropdown = this.findOpenSnippetDropdown(button);
      const existingField = this.findSearchField({
        button,
        container: existingDropdown,
        requireDropdown: true
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
      const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const clickTargets = this.getSnippetClickTargets(targetButton);
      const stopTrace = this.startSnippetInteractionTrace(targetButton, clickTargets);
      try {
        for (const [index, clickTarget] of clickTargets.entries()) {
          this.logActiveElement("Before snippet click", clickTarget);
          const clickSuccess = DOMHelper.simulateClick(clickTarget);
          if (!clickSuccess) {
            continue;
          }
          logger.info("Snippet button clicked successfully", {
            attempt: index + 1,
            target: this.describeElement(clickTarget)
          });
          this.logActiveElement("After snippet click", clickTarget);
          const dropdown = await this.waitForSnippetDropdown(500, targetButton);
          if (dropdown) {
            logger.info("Snippet dropdown detected", {
              attempt: index + 1,
              dropdown: this.describeElement(dropdown)
            });
          }
          const searchField = await this.waitForSearchField(1e3, {
            button: targetButton,
            ignoreElement: previouslyFocusedElement,
            container: dropdown,
            requireDropdown: true
          });
          if (searchField) {
            return this.focusSearchField(searchField);
          }
        }
      } finally {
        stopTrace();
      }
      logger.warn("Search field not found after clicking snippet button");
      this.logDropdownStructure(targetButton, previouslyFocusedElement);
      return false;
    }
    /**
     * Builds a short list of click targets around the fragments icon.
     */
    getSnippetClickTargets(button) {
      const svgTargets = Array.from(button.querySelectorAll("svg.cursor-pointer, svg"));
      const explicitClickables = Array.from(
        button.querySelectorAll('.cursor-pointer, [role="button"], [tabindex]')
      );
      const orderedTargets = [];
      const seen = /* @__PURE__ */ new Set();
      const addTarget = (target) => {
        if (!target || seen.has(target) || !DOMHelper.isVisible(target)) {
          return;
        }
        seen.add(target);
        orderedTargets.push(target);
      };
      svgTargets.forEach((target) => addTarget(target));
      explicitClickables.forEach((target) => addTarget(target));
      addTarget(button);
      addTarget(button.parentElement);
      return orderedTargets;
    }
    /**
     * Records DOM events and mutations around the snippet interaction for debugging.
     */
    startSnippetInteractionTrace(button, clickTargets) {
      logger.info("Snippet interaction trace started", {
        button: this.describeElement(button),
        clickTargets: clickTargets.map((target) => this.describeElement(target))
      });
      const eventTypes = ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "focusin"];
      const listeners = [];
      const attach = (target, type, label) => {
        const handler = (event) => {
          const targetElement = event.target instanceof Element ? event.target : null;
          const currentTargetElement = event.currentTarget instanceof Element ? event.currentTarget : null;
          logger.info("Trace event", {
            label,
            type,
            target: this.describeElement(targetElement),
            currentTarget: this.describeElement(currentTargetElement),
            activeElement: this.describeElement(
              document.activeElement instanceof HTMLElement ? document.activeElement : null
            )
          });
        };
        target.addEventListener(type, handler, true);
        listeners.push({ target, type, handler });
      };
      for (const type of eventTypes) {
        attach(document, type, "document");
        clickTargets.forEach((target, index) => {
          attach(target, type, `clickTarget:${index + 1}`);
        });
      }
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement) || !DOMHelper.isVisible(node)) {
              return;
            }
            if (!this.isPotentialSnippetOverlayNode(node)) {
              return;
            }
            logger.info("Trace mutation added", {
              node: this.describeElement(node),
              textPreview: (node.textContent || "").trim().slice(0, 200)
            });
          });
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      const timeoutId = window.setTimeout(() => {
        stop();
      }, 2500);
      const stop = () => {
        window.clearTimeout(timeoutId);
        observer.disconnect();
        listeners.forEach(({ target, type, handler }) => {
          target.removeEventListener(type, handler, true);
        });
        logger.info("Snippet interaction trace finished");
      };
      return stop;
    }
    /**
     * Waits for a fragment dropdown that looks real, not just an empty wrapper.
     */
    async waitForSnippetDropdown(timeout, button) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const dropdown = this.findOpenSnippetDropdown(button);
        if (dropdown) {
          return dropdown;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return null;
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
    findSearchField(context = {}) {
      const containers = context.container ? [context.container] : context.requireDropdown ? this.findDropdownCandidates(context.button) : [];
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
    findSearchFieldInContainer(container, context) {
      for (const selector of SEARCH_FIELD_SELECTORS) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of Array.from(elements)) {
            if (!container.contains(element)) {
              continue;
            }
            if (this.isEligibleSearchField(element, context)) {
              return element;
            }
          }
        } catch (error) {
          logger.warn("Invalid search field selector", { selector, error: String(error) });
        }
      }
      return this.findBestFallbackSearchField({ ...context, container });
    }
    /**
     * Determines whether an element can receive search text for the snippets panel.
     */
    isEligibleSearchField(element, context = {}) {
      if (!element || !this.isTextEntryElement(element)) {
        return false;
      }
      if (!DOMHelper.isVisible(element)) {
        return false;
      }
      if (element.closest("#conv-composer-toolbar")) {
        return false;
      }
      if (context.container && !context.container.contains(element)) {
        return false;
      }
      if (context.ignoreElement && (element === context.ignoreElement || element.contains(context.ignoreElement) || context.ignoreElement.contains(element))) {
        return false;
      }
      if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && (element.disabled || element.readOnly)) {
        return false;
      }
      return true;
    }
    /**
     * Restricts fallback matching to text-entry widgets.
     */
    isTextEntryElement(element) {
      if (element instanceof HTMLInputElement) {
        const type = (element.type || "text").toLowerCase();
        return !["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"].includes(type);
      }
      if (element instanceof HTMLTextAreaElement) {
        return true;
      }
      if (element.isContentEditable || element.getAttribute("contenteditable") === "true") {
        return true;
      }
      const role = (element.getAttribute("role") || "").toLowerCase();
      return ["textbox", "combobox", "searchbox"].includes(role);
    }
    /**
     * Looks for the most likely text-entry field when static selectors are no longer enough.
     */
    findBestFallbackSearchField(context) {
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const candidates = /* @__PURE__ */ new Set();
      if (activeElement && (!context.container || context.container.contains(activeElement))) {
        candidates.add(activeElement);
      }
      const scope = context.container ?? document;
      const textEntryCandidates = scope.querySelectorAll(
        'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
      );
      textEntryCandidates.forEach((candidate) => candidates.add(candidate));
      let bestCandidate = null;
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
    scoreSearchFieldCandidate(element, context) {
      if (!this.isEligibleSearchField(element, context)) {
        return 0;
      }
      let score = 10;
      const metadata = this.getFieldMetadata(element);
      const role = (element.getAttribute("role") || "").toLowerCase();
      if (SEARCH_FIELD_KEYWORDS.some((keyword) => metadata.includes(keyword))) {
        score += 80;
      }
      if (element instanceof HTMLInputElement && element.type.toLowerCase() === "search") {
        score += 60;
      }
      if (role === "searchbox") {
        score += 60;
      } else if (role === "combobox") {
        score += 45;
      } else if (role === "textbox") {
        score += 25;
      }
      if (this.isInsideDropdownContainer(element)) {
        score += 30;
      }
      if (document.activeElement === element || element.matches(":focus") || element.contains(document.activeElement)) {
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
    getFieldMetadata(element) {
      const attributeValues = [
        element.getAttribute("aria-label"),
        element.getAttribute("placeholder"),
        element.getAttribute("data-placeholder"),
        element.getAttribute("data-testid"),
        element.getAttribute("role"),
        element.id,
        element.className
      ];
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        attributeValues.push(element.placeholder);
        attributeValues.push(element.type);
      }
      return attributeValues.filter((value) => Boolean(value)).join(" ").toLowerCase();
    }
    /**
     * Returns the most likely open fragment dropdown anchored to the composer button.
     */
    findOpenSnippetDropdown(button) {
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
    isInsideDropdownContainer(element) {
      for (const selector of DROPDOWN_CONTAINER_SELECTORS) {
        try {
          const container = element.closest(selector);
          if (container && DOMHelper.isVisible(container)) {
            return true;
          }
        } catch (error) {
          logger.warn("Invalid dropdown selector", { selector, error: String(error) });
        }
      }
      return false;
    }
    /**
     * Scores dropdown candidates so the popover nearest to the Fragmentos button wins.
     */
    scoreDropdownCandidate(container, button) {
      let score = 0;
      const metadata = this.getContainerMetadata(container);
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      const textEntries = container.querySelectorAll(
        'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
      );
      if (metadata.includes("popover") || metadata.includes("follower")) {
        score += 40;
      }
      if (metadata.includes("fragment") || metadata.includes("snippet")) {
        score += 120;
      }
      if (textEntries.length > 0) {
        score += 35;
      }
      for (const entry of Array.from(textEntries)) {
        const entryMetadata = this.getFieldMetadata(entry);
        if (entryMetadata.includes("fragment")) {
          score += 220;
          break;
        }
        if (entryMetadata.includes("snippet")) {
          score += 160;
          break;
        }
      }
      if (container.querySelector('.overflow-y-auto, .list-none, [role="listbox"], [role="option"], li')) {
        score += 20;
      }
      if (style.position === "absolute" || style.position === "fixed") {
        score += 15;
      }
      if (Number.parseInt(style.zIndex || "0", 10) >= 1e3) {
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
    isLikelySnippetDropdown(container) {
      const metadata = this.getContainerMetadata(container);
      const textEntries = container.querySelectorAll(
        'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
      );
      if (metadata.includes("fragment") || metadata.includes("snippet")) {
        return true;
      }
      if (textEntries.length === 0) {
        return false;
      }
      for (const textEntry of Array.from(textEntries)) {
        const entryMetadata = this.getFieldMetadata(textEntry);
        if (SEARCH_FIELD_KEYWORDS.some((keyword) => entryMetadata.includes(keyword))) {
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
    getContainerMetadata(container) {
      return [
        container.id,
        container.className,
        container.getAttribute("role"),
        container.getAttribute("data-testid"),
        container.textContent?.slice(0, 400)
      ].filter((value) => Boolean(value)).join(" ").toLowerCase();
    }
    /**
     * Measures the distance between the centers of two elements.
     */
    getElementDistance(source, target) {
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
    async waitForSearchField(timeout, context = {}) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const field = this.findSearchField(context);
        if (field) {
          return this.resolveFocusableSearchField(field, context.container) ?? field;
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
        const targetField = this.resolveFocusableSearchField(field) ?? field;
        targetField.focus({ preventScroll: true });
        targetField.click();
        if (targetField instanceof HTMLInputElement || targetField instanceof HTMLTextAreaElement) {
          targetField.select();
          if (typeof targetField.setSelectionRange === "function") {
            targetField.setSelectionRange(0, targetField.value.length);
          }
        }
        const focused = document.activeElement === targetField || targetField.matches(":focus") || targetField.contains(document.activeElement);
        logger.info("Search field focus attempt completed", {
          focused,
          tagName: targetField.tagName,
          placeholder: targetField instanceof HTMLInputElement || targetField instanceof HTMLTextAreaElement ? targetField.placeholder : null,
          ariaLabel: targetField.getAttribute("aria-label")
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
    logDropdownStructure(button, ignoreElement) {
      const dropdowns = this.findDropdownCandidates(button);
      if (!dropdowns.length) {
        logger.warn("Dropdown element not found");
        return;
      }
      logger.warn(`Dropdown candidates found: ${dropdowns.length}`);
      dropdowns.slice(0, 3).forEach((dropdown, index) => {
        const inputs = dropdown.querySelectorAll("input");
        const textFields = dropdown.querySelectorAll(
          'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
        );
        logger.warn(`Dropdown ${index}: tag="${dropdown.tagName}" id="${dropdown.id}" role="${dropdown.getAttribute("role")}" class="${dropdown.className}"`);
        logger.warn(`Dropdown ${index}: ${inputs.length} input(s), ${textFields.length} text-entry candidate(s)`);
      });
      const fallbackCandidates = this.findFallbackDebugCandidates({ button, ignoreElement });
      logger.warn(`Global fallback candidates: ${fallbackCandidates.length}`);
      fallbackCandidates.slice(0, 5).forEach(({ candidate, score }, index) => {
        logger.warn(
          `Candidate ${index}: tag="${candidate.tagName}" role="${candidate.getAttribute("role")}" score=${score} metadata="${this.getFieldMetadata(candidate)}"`
        );
      });
    }
    /**
     * Collects visible overlay candidates and ranks them by proximity to the clicked button.
     */
    findDropdownCandidates(button) {
      const candidates = /* @__PURE__ */ new Set();
      for (const selector of DROPDOWN_CONTAINER_SELECTORS) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            if (DOMHelper.isVisible(element)) {
              candidates.add(element);
            }
          });
        } catch (error) {
          logger.warn("Invalid dropdown selector", { selector, error: String(error) });
        }
      }
      return Array.from(candidates).map((container) => ({
        container,
        score: this.scoreDropdownCandidate(container, button)
      })).filter(({ score }) => score >= 40).sort((left, right) => right.score - left.score).map(({ container }) => container);
    }
    /**
     * Builds a short ranked list of global text-entry candidates for debug output.
     */
    findFallbackDebugCandidates(context) {
      const candidates = /* @__PURE__ */ new Set();
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (activeElement) {
        candidates.add(activeElement);
      }
      document.querySelectorAll(
        'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
      ).forEach((candidate) => candidates.add(candidate));
      return Array.from(candidates).map((candidate) => ({
        candidate,
        score: this.scoreSearchFieldCandidate(candidate, context)
      })).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score);
    }
    /**
     * Resolves wrapper elements like #snippets-search down to the actual input to focus.
     */
    resolveFocusableSearchField(field, container) {
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field.isContentEditable || ["textbox", "combobox", "searchbox"].includes((field.getAttribute("role") || "").toLowerCase())) {
        return field;
      }
      const scopes = [field, container].filter((scope) => Boolean(scope));
      for (const scope of scopes) {
        const nestedField = scope.querySelector(
          '#snippets-search input.hr-input__input:not([type="hidden"]):not([disabled]), #snippets-search input:not([type="hidden"]):not([disabled]), input.hr-input__input:not([type="hidden"]):not([disabled]), input[placeholder*="fragmento/carpeta" i]:not([type="hidden"]):not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
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
    logActiveElement(message, reference) {
      logger.info(message, {
        reference: this.describeElement(reference ?? null),
        activeElement: this.describeElement(
          document.activeElement instanceof Element ? document.activeElement : null
        )
      });
    }
    /**
     * Produces a compact element descriptor for debug logs.
     */
    describeElement(element) {
      if (!element) {
        return null;
      }
      const htmlElement = element instanceof HTMLElement ? element : null;
      const inputElement = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element : null;
      return {
        tag: element.tagName,
        id: htmlElement?.id || null,
        role: element.getAttribute("role"),
        className: htmlElement?.className || (element instanceof SVGElement ? element.getAttribute("class") : null),
        ariaLabel: element.getAttribute("aria-label"),
        placeholder: inputElement?.placeholder || null,
        text: (element.textContent || "").trim().slice(0, 80) || null
      };
    }
    /**
     * Filters mutation logs to overlays and popovers relevant to the snippet flow.
     */
    isPotentialSnippetOverlayNode(node) {
      const metadata = [
        node.className,
        node.id,
        node.getAttribute("role"),
        node.getAttribute("data-testid")
      ].filter((value) => Boolean(value)).join(" ").toLowerCase();
      if (metadata.includes("popover") || metadata.includes("dropdown") || metadata.includes("follower") || metadata.includes("fragment") || metadata.includes("snippet")) {
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
