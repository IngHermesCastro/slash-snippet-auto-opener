/**
 * Type definitions for the Slash Snippet Extension
 * @module types
 */

export interface SnippetButton {
  element: HTMLElement;
  selector: string;
}

export interface DetectorConfig {
  triggerKey: string;
  buttonSelectors: string[];
  debugMode: boolean;
}

export interface KeyboardEventData {
  key: string;
  target: EventTarget | null;
  ctrlKey: boolean;
  metaKey: boolean;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}
