/**
 * Logger utility for consistent logging across the extension
 * Implements singleton pattern for centralized logging
 * @module utils/logger
 */

import { LogLevel, type LogEntry } from '../types/index.js';
import { DEBUG_MODE } from './constants.js';

class Logger {
  private logs: LogEntry[] = [];
  private isDebugMode: boolean = DEBUG_MODE;
  private readonly MAX_LOGS = 1000;

  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  private createEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      data,
    };
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `[${timestamp}] [${entry.level}] ${entry.message}${dataStr}`;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  private output(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDebugMode) console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, data);
    this.addLog(entry);
    this.output(entry);
  }

  info(message: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.INFO, message, data);
    this.addLog(entry);
    this.output(entry);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.WARN, message, data);
    this.addLog(entry);
    this.output(entry);
  }

  error(message: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.ERROR, message, data);
    this.addLog(entry);
    this.output(entry);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const logger = new Logger();
