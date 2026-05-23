import { Injectable } from '@nestjs/common';
import { QueryDialect } from '../../domain/types/tfql.types';

/**
 * Dialect Detector
 * Automatically detects the query language dialect based on query syntax
 */
@Injectable()
export class DialectDetector {
  /**
   * Detect the query dialect from raw query string
   */
  detect(query: string): QueryDialect {
    const trimmed = query.trim();

    // Check for Elasticsearch JSON
    if (this.isElasticsearch(trimmed)) {
      return QueryDialect.ELASTICSEARCH;
    }

    // Check for TFQL keywords
    if (this.isTfql(trimmed)) {
      return QueryDialect.TFQL;
    }

    // Check for PromQL patterns
    if (this.isPromql(trimmed)) {
      return QueryDialect.PROMQL;
    }

    // Check for SQL-like patterns
    if (this.isSql(trimmed)) {
      return QueryDialect.SQL;
    }

    // Default to TFQL
    return QueryDialect.TFQL;
  }

  /**
   * Check if query is Elasticsearch JSON format
   */
  private isElasticsearch(query: string): boolean {
    // Must start with { and be valid JSON-like
    if (!query.startsWith('{')) {
      return false;
    }

    try {
      const parsed = JSON.parse(query);
      // Check for Elasticsearch-specific keys
      const esKeys = ['query', 'bool', 'must', 'should', 'filter', 'match', 'term', 'range', 'aggs', 'aggregations'];
      return this.hasAnyKey(parsed, esKeys);
    } catch {
      return false;
    }
  }

  /**
   * Check if query is native TFQL format
   */
  private isTfql(query: string): boolean {
    const upper = query.toUpperCase();

    // TFQL starts with FETCH or CORRELATE
    const tfqlKeywords = ['FETCH ', 'CORRELATE '];
    return tfqlKeywords.some(kw => upper.startsWith(kw));
  }

  /**
   * Check if query is PromQL format
   */
  private isPromql(query: string): boolean {
    // PromQL patterns:
    // 1. metric_name{label="value"}
    // 2. rate(metric[5m])
    // 3. sum(metric) by (label)

    // Check for function patterns like rate(, sum(, avg(, etc.
    const promqlFunctions = [
      'rate\\s*\\(',
      'irate\\s*\\(',
      'increase\\s*\\(',
      'delta\\s*\\(',
      'sum\\s*\\(',
      'avg\\s*\\(',
      'min\\s*\\(',
      'max\\s*\\(',
      'count\\s*\\(',
      'histogram_quantile\\s*\\(',
      'topk\\s*\\(',
      'bottomk\\s*\\(',
      'absent\\s*\\(',
      'absent_over_time\\s*\\(',
      'ceil\\s*\\(',
      'floor\\s*\\(',
      'round\\s*\\(',
      'label_join\\s*\\(',
      'label_replace\\s*\\(',
      'vector\\s*\\(',
      'scalar\\s*\\(',
      'time\\s*\\(',
      'timestamp\\s*\\(',
    ];

    const funcPattern = new RegExp(promqlFunctions.join('|'), 'i');
    if (funcPattern.test(query)) {
      return true;
    }

    // Check for metric{label="value"} pattern
    const labelSelectorPattern = /^[a-zA-Z_:][a-zA-Z0-9_:]*\s*\{[^}]*\}/;
    if (labelSelectorPattern.test(query)) {
      return true;
    }

    // Check for [duration] pattern (range vector)
    const rangeVectorPattern = /\[\d+[smhdwy]\]/;
    if (rangeVectorPattern.test(query)) {
      return true;
    }

    // Check for offset modifier
    const offsetPattern = /\soffset\s+\d+[smhdwy]/i;
    if (offsetPattern.test(query)) {
      return true;
    }

    // Check for by/without modifier
    const byWithoutPattern = /\s+(by|without)\s*\(/i;
    if (byWithoutPattern.test(query)) {
      return true;
    }

    return false;
  }

  /**
   * Check if query is SQL-like format
   */
  private isSql(query: string): boolean {
    const upper = query.toUpperCase();

    // SQL starts with SELECT
    if (upper.startsWith('SELECT ')) {
      return true;
    }

    // Check for other SQL patterns
    const sqlKeywords = ['FROM ', 'JOIN ', 'INNER JOIN ', 'LEFT JOIN ', 'RIGHT JOIN '];
    return sqlKeywords.some(kw => upper.includes(kw));
  }

  /**
   * Helper to check if object has any of the specified keys (nested)
   */
  private hasAnyKey(obj: unknown, keys: string[]): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (keys.includes(key)) {
        return true;
      }
      if (this.hasAnyKey(record[key], keys)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get confidence score for each dialect
   */
  detectWithConfidence(query: string): { dialect: QueryDialect; confidence: number; alternatives: { dialect: QueryDialect; confidence: number }[] } {
    const trimmed = query.trim();
    const scores: { dialect: QueryDialect; confidence: number }[] = [];

    // Calculate scores for each dialect
    scores.push({
      dialect: QueryDialect.ELASTICSEARCH,
      confidence: this.calculateElasticsearchScore(trimmed),
    });

    scores.push({
      dialect: QueryDialect.TFQL,
      confidence: this.calculateTfqlScore(trimmed),
    });

    scores.push({
      dialect: QueryDialect.PROMQL,
      confidence: this.calculatePromqlScore(trimmed),
    });

    scores.push({
      dialect: QueryDialect.SQL,
      confidence: this.calculateSqlScore(trimmed),
    });

    // Sort by confidence
    scores.sort((a, b) => b.confidence - a.confidence);

    return {
      dialect: scores[0].dialect,
      confidence: scores[0].confidence,
      alternatives: scores.slice(1),
    };
  }

  private calculateElasticsearchScore(query: string): number {
    if (!query.startsWith('{')) return 0;

    try {
      const parsed = JSON.parse(query);
      let score = 0.5; // Base score for valid JSON starting with {

      const esKeys = ['query', 'bool', 'must', 'should', 'filter', 'match', 'term', 'range', 'aggs'];
      for (const key of esKeys) {
        if (this.hasAnyKey(parsed, [key])) {
          score += 0.1;
        }
      }

      return Math.min(score, 1);
    } catch {
      return 0;
    }
  }

  private calculateTfqlScore(query: string): number {
    const upper = query.toUpperCase();
    let score = 0;

    // Strong indicators
    if (upper.startsWith('FETCH ')) score += 0.5;
    if (upper.startsWith('CORRELATE ')) score += 0.5;

    // Medium indicators
    if (upper.includes(' TIMERANGE ')) score += 0.2;
    if (upper.includes(' AGGREGATE ')) score += 0.2;

    // Weak indicators
    if (upper.includes(' WHERE ')) score += 0.1;
    if (upper.includes(' LIMIT ')) score += 0.05;
    if (upper.includes(' ORDER BY ')) score += 0.05;

    return Math.min(score, 1);
  }

  private calculatePromqlScore(query: string): number {
    let score = 0;

    // Check for metric{label="value"} pattern
    if (/^[a-zA-Z_:][a-zA-Z0-9_:]*\s*\{/.test(query)) {
      score += 0.4;
    }

    // Check for range vector [5m]
    if (/\[\d+[smhdwy]\]/.test(query)) {
      score += 0.3;
    }

    // Check for PromQL functions
    const promqlFuncs = ['rate', 'irate', 'increase', 'histogram_quantile', 'absent', 'vector', 'scalar'];
    for (const func of promqlFuncs) {
      if (new RegExp(`${func}\\s*\\(`, 'i').test(query)) {
        score += 0.2;
        break;
      }
    }

    // Check for by/without
    if (/\s+(by|without)\s*\(/i.test(query)) {
      score += 0.1;
    }

    // Check for offset
    if (/\soffset\s+\d+[smhdwy]/i.test(query)) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private calculateSqlScore(query: string): number {
    const upper = query.toUpperCase();
    let score = 0;

    // Strong indicators
    if (upper.startsWith('SELECT ')) score += 0.5;

    // Medium indicators
    if (upper.includes(' FROM ')) score += 0.2;
    if (upper.includes(' JOIN ')) score += 0.2;

    // Weak indicators
    if (upper.includes(' WHERE ')) score += 0.05;
    if (upper.includes(' GROUP BY ')) score += 0.05;
    if (upper.includes(' HAVING ')) score += 0.1;

    return Math.min(score, 1);
  }
}
