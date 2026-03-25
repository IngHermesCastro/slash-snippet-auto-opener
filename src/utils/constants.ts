/**
 * Application constants
 * Centralized configuration for selectors and keys
 * @module utils/constants
 */

export const TRIGGER_KEY = '/';

/**
 * Selectors to find the "Insert Snippet" button
 * Order matters: more specific selectors first
 */
export const BUTTON_SELECTORS = [
  // Most specific: exact Tailwind classes from the insert snippet button
  'div.text-gray-500.h-8.w-8.flex.justify-center.items-center.cursor-pointer.rounded-full',
  'div.text-gray-500.h-8.w-8.flex.justify-center.cursor-pointer',
  
  // Alternative Tailwind patterns for insert snippet
  'div.cursor-pointer.items-center[class*="text-gray"]',
  'div.flex.justify-center.items-center.cursor-pointer.h-8.w-8',
  
  // Try to match 'Insert Snippet' text or aria-label (button elements)
  'button[aria-label*="Snippet"]',
  'button[data-testid="insert-snippet"]',
  'button[class*="snippet"]',
  'button[aria-label="Insert Snippet"]',
  
  // DIV-based buttons with role
  'div[role="button"][aria-label*="Snippet"]',
  'div[role="button"][class*="flex"]',
  
  // Generic fallback patterns
  'div[class*="flex"][class*="cursor-pointer"]',
] as const;

/**
 * Selectors to find the snippet search field once the panel is open
 * Ordered from most specific to most generic
 */
export const SEARCH_FIELD_SELECTORS = [
  '#snippets-dropdown input:not([type="hidden"]):not([disabled])',
  '#snippets-dropdown textarea:not([disabled])',
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
  'input[type="search"]:not([disabled])',
] as const;

/**
 * Debounce delay for keydown events (ms)
 * Prevents multiple triggers on single keypress
 */
export const DEBOUNCE_DELAY = 100;

/**
 * Maximum timeouts for DOM operations
 */
export const OPERATION_TIMEOUT = {
  FIND_BUTTON: 500,
  SIMULATE_CLICK: 200,
} as const;

/**
 * Debug configuration
 */
export const DEBUG_MODE = true;

/**
 * Namespace for extension-specific data attributes
 */
export const EXTENSION_NS = 'data-slash-ext';
