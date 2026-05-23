import { Injectable } from '@nestjs/common';
import { ResponseFormat } from '../../domain/interfaces';

/**
 * Response Normalizer
 * Transforms query results to consistent format
 */
@Injectable()
export class ResponseNormalizer {
  /**
   * Normalize array of results
   */
  normalize<T>(data: unknown[], format?: ResponseFormat): T[] {
    return data.map((item) => this.normalizeItem<T>(item, format));
  }

  /**
   * Normalize single item
   */
  normalizeItem<T>(item: unknown, format?: ResponseFormat): T {
    if (item === null || item === undefined) {
      return item as T;
    }

    if (typeof item !== 'object') {
      return item as T;
    }

    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      // Convert snake_case to camelCase if requested
      const normalizedKey = format?.camelCase !== false ? this.toCamelCase(key) : key;
      normalized[normalizedKey] = this.normalizeValue(value, format);
    }

    return normalized as T;
  }

  /**
   * Convert snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Normalize a single value
   */
  private normalizeValue(value: unknown, format?: ResponseFormat): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle Date objects
    if (value instanceof Date) {
      return this.formatTimestamp(value, format?.timestamps);
    }

    // Handle ISO date strings
    if (typeof value === 'string' && this.isISODate(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return this.formatTimestamp(date, format?.timestamps);
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((v) => this.normalizeValue(v, format));
    }

    // Handle nested objects
    if (typeof value === 'object') {
      return this.normalizeItem(value, format);
    }

    return value;
  }

  /**
   * Check if string is ISO date format
   */
  private isISODate(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
  }

  /**
   * Format timestamp based on format option
   */
  private formatTimestamp(
    date: Date,
    format?: 'iso' | 'unix' | 'unixMs',
  ): string | number | Date {
    switch (format) {
      case 'unix':
        return Math.floor(date.getTime() / 1000);
      case 'unixMs':
        return date.getTime();
      case 'iso':
      default:
        return date.toISOString();
    }
  }

  /**
   * Convert bytes to human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Convert nanoseconds to milliseconds
   */
  nsToMs(ns: number): number {
    return ns / 1_000_000;
  }

  /**
   * Convert duration to human-readable format
   */
  formatDuration(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(2)}µs`;
    }
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${(ms / 60000).toFixed(2)}m`;
  }
}
