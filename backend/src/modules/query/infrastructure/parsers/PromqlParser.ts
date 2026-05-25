import { Injectable } from '@nestjs/common';
import {
  TfqlAstNode,
  FetchNode,
  ConditionNode,
  PromqlNode,
  PromqlInstantVector,
  PromqlRangeVector,
  PromqlAggregation,
  PromqlLabelMatcher,
  AggregationFunction,
  RelativeTime,
} from '../../domain/types/ast-nodes.types';
import { TfqlParseError, parseDuration } from '../../domain/types/tfql.types';

/**
 * PromQL Parser
 * Parses Prometheus Query Language and converts to TFQL AST
 */
@Injectable()
export class PromqlParser {
  private input: string = '';
  private position: number = 0;

  /**
   * Parse PromQL query into TFQL AST
   */
  parse(query: string): TfqlAstNode {
    this.input = query.trim();
    this.position = 0;

    const promqlAst = this.parseExpression();
    return this.convertToTfqlAst(promqlAst);
  }

  /**
   * Parse PromQL directly (for debugging/testing)
   */
  parsePromql(query: string): PromqlNode {
    this.input = query.trim();
    this.position = 0;
    return this.parseExpression();
  }

  private parseExpression(): PromqlNode {
    this.skipWhitespace();

    // Check for aggregation functions
    const aggFunc = this.tryParseAggregationFunction();
    if (aggFunc) {
      return aggFunc;
    }

    // Otherwise, parse instant/range vector
    return this.parseVector();
  }

  private tryParseAggregationFunction(): PromqlAggregation | null {
    const aggFunctions = [
      'sum', 'avg', 'min', 'max', 'count', 'count_values',
      'stddev', 'stdvar', 'topk', 'bottomk', 'quantile',
      'rate', 'irate', 'increase', 'delta', 'idelta',
      'histogram_quantile', 'absent', 'absent_over_time',
      'ceil', 'floor', 'round', 'sqrt', 'exp', 'ln', 'log2', 'log10',
      'abs', 'clamp', 'clamp_max', 'clamp_min',
      'label_join', 'label_replace', 'vector', 'scalar', 'sort', 'sort_desc',
      'changes', 'resets', 'deriv', 'predict_linear',
      'avg_over_time', 'min_over_time', 'max_over_time', 'sum_over_time',
      'count_over_time', 'quantile_over_time', 'stddev_over_time', 'stdvar_over_time',
      'last_over_time', 'present_over_time',
    ];

    const startPos = this.position;

    for (const func of aggFunctions) {
      if (this.matchString(func) && this.peek() === '(') {
        return this.parseAggregation(func);
      }
    }

    this.position = startPos;
    return null;
  }

  private parseAggregation(funcName: string): PromqlAggregation {
    this.expect('(');
    this.skipWhitespace();

    // Parse arguments
    const args: unknown[] = [];

    // Some functions like histogram_quantile have numeric first arg
    if (['histogram_quantile', 'quantile', 'topk', 'bottomk', 'quantile_over_time'].includes(funcName)) {
      const numArg = this.parseNumber();
      if (numArg !== null) {
        args.push(numArg);
        this.skipWhitespace();
        if (this.peek() === ',') {
          this.advance();
          this.skipWhitespace();
        }
      }
    }

    // Parse the vector expression
    const vector = this.parseExpression();

    this.skipWhitespace();
    this.expect(')');

    // Parse optional by/without clause
    this.skipWhitespace();
    let by: string[] | undefined;
    let without: string[] | undefined;

    if (this.matchString('by')) {
      by = this.parseLabelList();
    } else if (this.matchString('without')) {
      without = this.parseLabelList();
    }

    return {
      type: 'PROMQL_AGGREGATION',
      function: funcName,
      vector,
      by,
      without,
      args: args.length > 0 ? args : undefined,
    };
  }

  private parseVector(): PromqlInstantVector | PromqlRangeVector {
    // Parse metric name
    const metricName = this.parseMetricName();

    // Parse optional label matchers
    const labelMatchers = this.parseLabelMatchers();

    // Check for range selector [5m]
    this.skipWhitespace();
    if (this.peek() === '[') {
      const range = this.parseRangeSelector();
      return {
        type: 'PROMQL_RANGE_VECTOR',
        metricName,
        labelMatchers,
        range,
      };
    }

    return {
      type: 'PROMQL_INSTANT_VECTOR',
      metricName,
      labelMatchers,
    };
  }

  private parseMetricName(): string {
    const start = this.position;

    // Metric names can contain: a-z, A-Z, 0-9, _, :
    // Must start with a-z, A-Z, or _
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (/[a-zA-Z0-9_:]/.test(char)) {
        this.position++;
      } else {
        break;
      }
    }

    if (this.position === start) {
      throw new TfqlParseError('Expected metric name', 1, this.position + 1, this.position);
    }

    return this.input.slice(start, this.position);
  }

  private parseLabelMatchers(): PromqlLabelMatcher[] {
    this.skipWhitespace();
    if (this.peek() !== '{') {
      return [];
    }

    this.advance(); // {
    this.skipWhitespace();

    const matchers: PromqlLabelMatcher[] = [];

    while (this.peek() !== '}' && this.position < this.input.length) {
      // Parse label name
      const name = this.parseIdentifier();
      this.skipWhitespace();

      // Parse operator
      let operator: PromqlLabelMatcher['operator'];
      if (this.matchString('=~')) {
        operator = '=~';
      } else if (this.matchString('!~')) {
        operator = '!~';
      } else if (this.matchString('!=')) {
        operator = '!=';
      } else if (this.matchString('=')) {
        operator = '=';
      } else {
        throw new TfqlParseError(
          'Expected label matcher operator (=, !=, =~, !~)',
          1,
          this.position + 1,
          this.position,
        );
      }

      this.skipWhitespace();

      // Parse value
      const value = this.parseString();

      matchers.push({ name, operator, value });

      this.skipWhitespace();
      if (this.peek() === ',') {
        this.advance();
        this.skipWhitespace();
      }
    }

    this.expect('}');
    return matchers;
  }

  private parseRangeSelector(): string {
    this.expect('[');
    const start = this.position;

    while (this.position < this.input.length && this.peek() !== ']') {
      this.advance();
    }

    const range = this.input.slice(start, this.position);
    this.expect(']');
    return range;
  }

  private parseLabelList(): string[] {
    this.skipWhitespace();
    this.expect('(');
    this.skipWhitespace();

    const labels: string[] = [];

    while (this.peek() !== ')' && this.position < this.input.length) {
      labels.push(this.parseIdentifier());
      this.skipWhitespace();
      if (this.peek() === ',') {
        this.advance();
        this.skipWhitespace();
      }
    }

    this.expect(')');
    return labels;
  }

  private parseIdentifier(): string {
    const start = this.position;

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (/[a-zA-Z0-9_]/.test(char)) {
        this.position++;
      } else {
        break;
      }
    }

    if (this.position === start) {
      throw new TfqlParseError('Expected identifier', 1, this.position + 1, this.position);
    }

    return this.input.slice(start, this.position);
  }

  private parseString(): string {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") {
      throw new TfqlParseError('Expected string', 1, this.position + 1, this.position);
    }

    this.advance();
    const start = this.position;

    while (this.position < this.input.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance(); // Skip escape char
      }
      this.advance();
    }

    const value = this.input.slice(start, this.position);
    this.expect(quote);
    return value;
  }

  private parseNumber(): number | null {
    const start = this.position;
    let hasDecimal = false;

    if (this.peek() === '-' || this.peek() === '+') {
      this.advance();
    }

    while (this.position < this.input.length) {
      const char = this.peek();
      if (/[0-9]/.test(char)) {
        this.advance();
      } else if (char === '.' && !hasDecimal) {
        hasDecimal = true;
        this.advance();
      } else {
        break;
      }
    }

    if (this.position === start) {
      return null;
    }

    return parseFloat(this.input.slice(start, this.position));
  }

  // ============================================================================
  // Convert PromQL AST to TFQL AST
  // ============================================================================

  private convertToTfqlAst(node: PromqlNode): FetchNode {
    switch (node.type) {
      case 'PROMQL_INSTANT_VECTOR':
        return this.convertInstantVector(node);
      case 'PROMQL_RANGE_VECTOR':
        return this.convertRangeVector(node);
      case 'PROMQL_AGGREGATION':
        return this.convertAggregation(node);
      default:
        throw new TfqlParseError('Unknown PromQL node type', 1, 1, 0);
    }
  }

  private convertInstantVector(node: PromqlInstantVector): FetchNode {
    const fetchNode: FetchNode = {
      type: 'FETCH',
      target: 'metrics',
    };

    // Convert metric name to filter
    const conditions: ConditionNode[] = [{
      type: 'CONDITION',
      field: 'metric_name',
      operator: '=',
      value: node.metricName,
    }];

    // Convert label matchers to conditions
    for (const matcher of node.labelMatchers) {
      conditions.push(this.convertLabelMatcher(matcher));
    }

    if (conditions.length > 0) {
      fetchNode.filter = {
        type: 'FILTER',
        conditions,
        logicalOperator: 'AND',
      };
    }

    return fetchNode;
  }

  private convertRangeVector(node: PromqlRangeVector): FetchNode {
    const fetchNode = this.convertInstantVector({
      type: 'PROMQL_INSTANT_VECTOR',
      metricName: node.metricName,
      labelMatchers: node.labelMatchers,
    });

    // Parse range duration and add as time range
    const parsed = parseDuration(node.range);
    fetchNode.timeRange = {
      type: 'TIMERANGE',
      from: {
        type: 'relative',
        value: parsed.value,
        unit: parsed.unit as RelativeTime['unit'],
      },
      to: {
        type: 'relative',
        value: 0,
        unit: 's',
      },
    };

    return fetchNode;
  }

  private convertAggregation(node: PromqlAggregation): FetchNode {
    // Get base fetch from inner vector
    let fetchNode: FetchNode;
    if (node.vector.type === 'PROMQL_AGGREGATION') {
      fetchNode = this.convertAggregation(node.vector);
    } else if (node.vector.type === 'PROMQL_RANGE_VECTOR') {
      fetchNode = this.convertRangeVector(node.vector);
    } else {
      fetchNode = this.convertInstantVector(node.vector);
    }

    // Map PromQL function to TFQL aggregation
    const aggFunc = this.mapAggregationFunction(node.function);
    if (aggFunc) {
      fetchNode.aggregation = {
        type: 'AGGREGATION',
        function: aggFunc,
        field: 'value',
        args: node.args,
      };
    }

    // Add group by if present
    if (node.by && node.by.length > 0) {
      fetchNode.groupBy = {
        type: 'GROUP_BY',
        fields: node.by,
      };
    }

    return fetchNode;
  }

  private convertLabelMatcher(matcher: PromqlLabelMatcher): ConditionNode {
    let operator: ConditionNode['operator'];
    const value: unknown = matcher.value;

    switch (matcher.operator) {
      case '=':
        operator = '=';
        break;
      case '!=':
        operator = '!=';
        break;
      case '=~':
        operator = 'REGEX';
        break;
      case '!~':
        operator = 'NOT REGEX';
        break;
    }

    // Map common label names to TFQL fields
    let field = matcher.name;
    if (field === 'job') {
      field = 'service_name';
    } else if (field === 'instance') {
      field = 'instance';
    } else {
      field = `labels.${field}`;
    }

    return {
      type: 'CONDITION',
      field,
      operator,
      value,
    };
  }

  private mapAggregationFunction(func: string): AggregationFunction | null {
    const mapping: Record<string, AggregationFunction> = {
      'sum': 'sum',
      'avg': 'avg',
      'min': 'min',
      'max': 'max',
      'count': 'count',
      'rate': 'rate',
      'irate': 'irate',
      'increase': 'increase',
      'delta': 'delta',
      'topk': 'topk',
      'bottomk': 'bottomk',
      'histogram_quantile': 'histogram_quantile',
      'quantile': 'p50', // Approximate
    };

    return mapping[func] || null;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private peek(): string {
    if (this.position >= this.input.length) return '\0';
    return this.input[this.position];
  }

  private advance(): string {
    return this.input[this.position++];
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++;
    }
  }

  private matchString(str: string): boolean {
    const remaining = this.input.slice(this.position);
    if (remaining.toLowerCase().startsWith(str.toLowerCase())) {
      // Make sure it's not a prefix of a longer identifier
      const nextChar = remaining[str.length];
      if (!nextChar || !/[a-zA-Z0-9_]/.test(nextChar)) {
        this.position += str.length;
        return true;
      }
    }
    return false;
  }

  private expect(char: string): void {
    if (this.peek() !== char) {
      throw new TfqlParseError(
        `Expected '${char}', got '${this.peek()}'`,
        1,
        this.position + 1,
        this.position,
      );
    }
    this.advance();
  }
}
