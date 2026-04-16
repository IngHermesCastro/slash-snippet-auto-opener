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
  'div.text-gray-500.h-8.w-8.flex.justify-center.items-center.cursor-pointer.rounded-full',
  'div.text-gray-500.h-8.w-8.flex.justify-center.cursor-pointer',
  
  // Alternative Tailwind patterns for insert snippet
  'div.cursor-pointer.items-center[class*="text-gray"]',
  'div.flex.justify-center.items-center.cursor-pointer.h-8.w-8',
  
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
  '#conv-composer-toolbar div[class*="flex"][class*="cursor-pointer"]',
] as const;

/**
 * Selectors to find the snippet search field once the panel is open
 * Ordered from most specific to most generic
 */
export const SEARCH_FIELD_SELECTORS = [
  '#snippets-search input.hr-input__input:not([type="hidden"]):not([disabled])',
  '#snippets-search input:not([type="hidden"]):not([disabled])',
  '.hr-popover #snippets-search input.hr-input__input:not([type="hidden"]):not([disabled])',
  '.hr-popover input[placeholder*="fragmento/carpeta" i]:not([type="hidden"]):not([disabled])',
  '#snippets-dropdown input:not([type="hidden"]):not([disabled])',
  '#snippets-dropdown textarea:not([disabled])',
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
  '[role="combobox"]',
] as const;

/**
 * Keywords used to score text-entry candidates after opening the snippets UI
 */
export const SEARCH_FIELD_KEYWORDS = [
  'search',
  'buscar',
  'snippet',
  'snippets',
  'fragment',
  'fragmento',
  'fragmentos',
] as const;

/**
 * Visible overlay/container selectors where the snippets UI is likely rendered
 */
export const DROPDOWN_CONTAINER_SELECTORS = [
  '.v-binder-follower-content .hr-popover',
  '.v-binder-follower-content',
  '.v-binder-follower-container.hr-detached-container',
  '.hr-popover',
  '#snippets-dropdown',
  '[id*="snippet" i]',
  '[data-testid*="snippet" i]',
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[class*="dropdown" i]',
  '[class*="popover" i]',
  '[class*="command" i]',
  '[class*="autocomplete" i]',
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
