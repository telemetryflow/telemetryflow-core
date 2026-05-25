import { Injectable } from '@nestjs/common';
import { TfqlLexer } from './TfqlLexer';
import {
  Token,
  TokenType,
  TfqlParseError,
  TfqlParserConfig,
  TARGET_TOKEN_MAP,
} from '../../domain/types/tfql.types';
import {
  TfqlAstNode,
  FetchNode,
  CorrelateNode,
  FilterNode,
  ConditionNode,
  TimeRangeNode,
  AggregationNode,
  IntervalNode,
  GroupByNode,
  OrderByNode,
  OrderByClause,
  LimitNode,
  OffsetNode,
  QueryTarget,
  ComparisonOperator,
  AggregationFunction,
  RelativeTime,
  AbsoluteTime,
  LogicalOperator,
} from '../../domain/types/ast-nodes.types';
import { SortOrder } from '../../domain/value-objects/AggregationInterval';

/**
 * TFQL Parser
 * Converts token stream into Abstract Syntax Tree
 */
@Injectable()
export class TfqlParser {
  private tokens: Token[] = [];
  private current: number = 0;
  private config: TfqlParserConfig;

  constructor(private readonly lexer: TfqlLexer) {
    this.config = {
      strict: false,
      maxDepth: 10,
      defaultTimeRange: { value: 1, unit: 'h' },
    };
  }

  /**
   * Configure parser options
   */
  configure(config: Partial<TfqlParserConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Parse TFQL query string into AST
   */
  parse(query: string): TfqlAstNode {
    this.tokens = this.lexer.tokenize(query);
    this.current = 0;

    return this.parseQuery();
  }

  private parseQuery(depth: number = 0): TfqlAstNode {
    if (depth > (this.config.maxDepth || 10)) {
      throw new TfqlParseError(
        'Maximum query depth exceeded',
        this.peek().line,
        this.peek().column,
        this.peek().position,
      );
    }

    // Check for CORRELATE
    if (this.check(TokenType.CORRELATE)) {
      return this.parseCorrelate(depth);
    }

    // Check for FETCH
    if (this.check(TokenType.FETCH)) {
      return this.parseFetch(depth);
    }

    throw new TfqlParseError(
      `Expected FETCH or CORRELATE, got ${this.peek().type}`,
      this.peek().line,
      this.peek().column,
      this.peek().position,
      this.peek(),
    );
  }

  private parseFetch(_depth: number): FetchNode {
    this.consume(TokenType.FETCH, 'Expected FETCH');

    // Parse target (metrics, logs, traces, etc.)
    const target = this.parseTarget();

    const node: FetchNode = {
      type: 'FETCH',
      target,
    };

    // Parse optional clauses
    while (!this.isAtEnd() && !this.checkAny([TokenType.RPAREN, TokenType.WITH])) {
      if (this.check(TokenType.WHERE)) {
        node.filter = this.parseWhere();
      } else if (this.check(TokenType.TIMERANGE)) {
        node.timeRange = this.parseTimeRange();
      } else if (this.check(TokenType.AGGREGATE)) {
        node.aggregation = this.parseAggregate();
      } else if (this.check(TokenType.INTERVAL)) {
        node.interval = this.parseInterval();
      } else if (this.check(TokenType.GROUP)) {
        node.groupBy = this.parseGroupBy();
      } else if (this.check(TokenType.ORDER)) {
        node.orderBy = this.parseOrderBy();
      } else if (this.check(TokenType.LIMIT)) {
        node.limit = this.parseLimit();
      } else if (this.check(TokenType.OFFSET)) {
        node.offset = this.parseOffset();
      } else if (this.check(TokenType.BY) && node.aggregation) {
        // BY can follow AGGREGATE directly
        node.groupBy = this.parseGroupByFields();
      } else {
        break;
      }
    }

    return node;
  }

  private parseCorrelate(depth: number): CorrelateNode {
    this.consume(TokenType.CORRELATE, 'Expected CORRELATE');

    // Parse left subquery
    this.consume(TokenType.LPAREN, 'Expected ( after CORRELATE');
    const left = this.parseFetch(depth + 1);
    this.consume(TokenType.RPAREN, 'Expected ) after left subquery');

    // Parse WITH
    this.consume(TokenType.WITH, 'Expected WITH');

    // Parse right subquery
    this.consume(TokenType.LPAREN, 'Expected ( after WITH');
    const right = this.parseFetch(depth + 1);
    this.consume(TokenType.RPAREN, 'Expected ) after right subquery');

    // Parse ON
    this.consume(TokenType.ON, 'Expected ON');
    const joinField = this.consume(TokenType.IDENTIFIER, 'Expected join field').value;

    const node: CorrelateNode = {
      type: 'CORRELATE',
      left,
      right,
      joinField,
      joinType: 'INNER',
    };

    // Optional TIMERANGE
    if (this.check(TokenType.TIMERANGE)) {
      node.timeRange = this.parseTimeRange();
    }

    return node;
  }

  private parseTarget(): QueryTarget {
    const token = this.advance();
    const target = TARGET_TOKEN_MAP[token.type];

    if (!target) {
      throw new TfqlParseError(
        `Invalid target: ${token.value}. Expected metrics, logs, traces, etc.`,
        token.line,
        token.column,
        token.position,
        token,
      );
    }

    // Check if target is allowed
    if (this.config.allowedTargets && !this.config.allowedTargets.includes(target)) {
      throw new TfqlParseError(
        `Target '${target}' is not allowed`,
        token.line,
        token.column,
        token.position,
        token,
      );
    }

    return target;
  }

  private parseWhere(): FilterNode {
    this.consume(TokenType.WHERE, 'Expected WHERE');
    return this.parseFilter();
  }

  private parseFilter(): FilterNode {
    const conditions: (ConditionNode | FilterNode)[] = [];
    let operator: LogicalOperator = 'AND';

    conditions.push(this.parseCondition());

    while (this.checkAny([TokenType.AND, TokenType.OR])) {
      const opToken = this.advance();
      operator = opToken.type === TokenType.AND ? 'AND' : 'OR';
      conditions.push(this.parseCondition());
    }

    return {
      type: 'FILTER',
      conditions,
      logicalOperator: operator,
    };
  }

  private parseCondition(): ConditionNode | FilterNode {
    // Check for nested condition in parentheses
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      const filter = this.parseFilter();
      this.consume(TokenType.RPAREN, 'Expected )');
      return filter;
    }

    // Check for NOT
    let negated = false;
    if (this.check(TokenType.NOT)) {
      this.advance();
      negated = true;
    }

    // Parse field name (can be dotted like labels.env)
    let field = this.consume(TokenType.IDENTIFIER, 'Expected field name').value;
    while (this.check(TokenType.DOT)) {
      this.advance();
      field += '.' + this.consume(TokenType.IDENTIFIER, 'Expected field name').value;
    }

    // Parse operator
    const operator = this.parseOperator();

    // Parse value
    const value = this.parseValue(operator);

    return {
      type: 'CONDITION',
      field,
      operator,
      value,
      negated,
    };
  }

  private parseOperator(): ComparisonOperator {
    const token = this.advance();

    switch (token.type) {
      case TokenType.EQUALS:
        return '=';
      case TokenType.NOT_EQUALS:
        return '!=';
      case TokenType.GREATER:
        return '>';
      case TokenType.LESS:
        return '<';
      case TokenType.GREATER_EQ:
        return '>=';
      case TokenType.LESS_EQ:
        return '<=';
      case TokenType.IN:
        return 'IN';
      case TokenType.NOT:
        if (this.check(TokenType.IN)) {
          this.advance();
          return 'NOT IN';
        }
        if (this.check(TokenType.LIKE)) {
          this.advance();
          return 'NOT LIKE';
        }
        if (this.check(TokenType.REGEX)) {
          this.advance();
          return 'NOT REGEX';
        }
        throw new TfqlParseError(
          'Expected IN, LIKE, or REGEX after NOT',
          token.line,
          token.column,
          token.position,
          token,
        );
      case TokenType.LIKE:
        return 'LIKE';
      case TokenType.REGEX:
      case TokenType.TILDE:
        return 'REGEX';
      case TokenType.NOT_TILDE:
        return 'NOT REGEX';
      default:
        throw new TfqlParseError(
          `Expected operator, got ${token.type}`,
          token.line,
          token.column,
          token.position,
          token,
        );
    }
  }

  private parseValue(operator: ComparisonOperator): unknown {
    // Handle IN operator (expects list)
    if (operator === 'IN' || operator === 'NOT IN') {
      this.consume(TokenType.LPAREN, 'Expected ( after IN');
      const values: unknown[] = [];

      do {
        values.push(this.parseLiteral());
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RPAREN, 'Expected ) after value list');
      return values;
    }

    return this.parseLiteral();
  }

  private parseLiteral(): unknown {
    const token = this.advance();

    switch (token.type) {
      case TokenType.STRING:
        return token.value;
      case TokenType.NUMBER:
        return parseFloat(token.value);
      case TokenType.DURATION:
        return token.value;
      case TokenType.BOOLEAN:
        return token.value.toLowerCase() === 'true';
      case TokenType.NULL:
        return null;
      case TokenType.IDENTIFIER:
        return token.value;
      default:
        throw new TfqlParseError(
          `Expected literal value, got ${token.type}`,
          token.line,
          token.column,
          token.position,
          token,
        );
    }
  }

  private parseTimeRange(): TimeRangeNode {
    this.consume(TokenType.TIMERANGE, 'Expected TIMERANGE');

    // Check for "last X duration" format
    if (this.check(TokenType.LAST)) {
      this.advance();
      const duration = this.consume(TokenType.DURATION, 'Expected duration after LAST').value;
      const parsed = this.parseDurationValue(duration);

      return {
        type: 'TIMERANGE',
        from: {
          type: 'relative',
          value: parsed.value,
          unit: parsed.unit,
        },
        to: {
          type: 'relative',
          value: 0,
          unit: 's',
        },
      };
    }

    // Parse absolute/relative from and to
    const from = this.parseTimeValue();
    const to = this.parseTimeValue();

    return {
      type: 'TIMERANGE',
      from,
      to,
    };
  }

  private parseTimeValue(): RelativeTime | AbsoluteTime {
    const token = this.peek();

    if (token.type === TokenType.DURATION) {
      this.advance();
      const parsed = this.parseDurationValue(token.value);
      return {
        type: 'relative',
        value: parsed.value,
        unit: parsed.unit,
      };
    }

    if (token.type === TokenType.STRING) {
      this.advance();
      return {
        type: 'absolute',
        value: new Date(token.value),
      };
    }

    throw new TfqlParseError(
      'Expected time value (duration or ISO date string)',
      token.line,
      token.column,
      token.position,
      token,
    );
  }

  private parseDurationValue(duration: string): { value: number; unit: RelativeTime['unit'] } {
    const match = duration.match(/^(\d+)(s|m|h|d|w|M|y)$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }
    return {
      value: parseInt(match[1], 10),
      unit: match[2] as RelativeTime['unit'],
    };
  }

  private parseAggregate(): AggregationNode {
    this.consume(TokenType.AGGREGATE, 'Expected AGGREGATE');

    // Parse aggregation function
    const funcToken = this.advance();
    const func = this.tokenToAggregationFunction(funcToken);

    // Parse field in parentheses
    this.consume(TokenType.LPAREN, 'Expected ( after function name');
    const field = this.consume(TokenType.IDENTIFIER, 'Expected field name').value;
    this.consume(TokenType.RPAREN, 'Expected ) after field name');

    const node: AggregationNode = {
      type: 'AGGREGATION',
      function: func,
      field,
    };

    // Optional alias with AS
    if (this.check(TokenType.AS)) {
      this.advance();
      node.alias = this.consume(TokenType.IDENTIFIER, 'Expected alias').value;
    }

    return node;
  }

  private tokenToAggregationFunction(token: Token): AggregationFunction {
    const funcMap: Partial<Record<TokenType, AggregationFunction>> = {
      [TokenType.COUNT]: 'count',
      [TokenType.SUM]: 'sum',
      [TokenType.AVG]: 'avg',
      [TokenType.MIN]: 'min',
      [TokenType.MAX]: 'max',
      [TokenType.RATE]: 'rate',
      [TokenType.INCREASE]: 'increase',
      [TokenType.IRATE]: 'irate',
      [TokenType.DELTA]: 'delta',
      [TokenType.P50]: 'p50',
      [TokenType.P75]: 'p75',
      [TokenType.P90]: 'p90',
      [TokenType.P95]: 'p95',
      [TokenType.P99]: 'p99',
      [TokenType.HISTOGRAM_QUANTILE]: 'histogram_quantile',
      [TokenType.TOPK]: 'topk',
      [TokenType.BOTTOMK]: 'bottomk',
    };

    const func = funcMap[token.type];
    if (!func) {
      throw new TfqlParseError(
        `Invalid aggregation function: ${token.value}`,
        token.line,
        token.column,
        token.position,
        token,
      );
    }

    return func;
  }

  private parseInterval(): IntervalNode {
    this.consume(TokenType.INTERVAL, 'Expected INTERVAL');
    const duration = this.consume(TokenType.DURATION, 'Expected duration').value;
    const parsed = this.parseDurationValue(duration);

    return {
      type: 'INTERVAL',
      value: parsed.value,
      unit: parsed.unit as IntervalNode['unit'],
    };
  }

  private parseGroupBy(): GroupByNode {
    this.consume(TokenType.GROUP, 'Expected GROUP');
    this.consume(TokenType.BY, 'Expected BY after GROUP');
    return this.parseGroupByFields();
  }

  private parseGroupByFields(): GroupByNode {
    if (this.check(TokenType.BY)) {
      this.advance();
    }

    const fields: string[] = [];

    do {
      fields.push(this.consume(TokenType.IDENTIFIER, 'Expected field name').value);
    } while (this.match(TokenType.COMMA));

    return {
      type: 'GROUP_BY',
      fields,
    };
  }

  private parseOrderBy(): OrderByNode {
    this.consume(TokenType.ORDER, 'Expected ORDER');
    this.consume(TokenType.BY, 'Expected BY after ORDER');

    const clauses: OrderByClause[] = [];

    do {
      const field = this.consume(TokenType.IDENTIFIER, 'Expected field name').value;
      let order: SortOrder = SortOrder.ASC;

      if (this.check(TokenType.ASC)) {
        this.advance();
        order = SortOrder.ASC;
      } else if (this.check(TokenType.DESC)) {
        this.advance();
        order = SortOrder.DESC;
      }

      clauses.push({ field, order });
    } while (this.match(TokenType.COMMA));

    return {
      type: 'ORDER_BY',
      clauses,
    };
  }

  private parseLimit(): LimitNode {
    this.consume(TokenType.LIMIT, 'Expected LIMIT');
    const value = parseInt(this.consume(TokenType.NUMBER, 'Expected number').value, 10);

    return {
      type: 'LIMIT',
      value,
    };
  }

  private parseOffset(): OffsetNode {
    this.consume(TokenType.OFFSET, 'Expected OFFSET');
    const value = parseInt(this.consume(TokenType.NUMBER, 'Expected number').value, 10);

    return {
      type: 'OFFSET',
      value,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkAny(types: TokenType[]): boolean {
    return types.some(type => this.check(type));
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    const token = this.peek();
    throw new TfqlParseError(
      `${message}. Got ${token.type} (${token.value})`,
      token.line,
      token.column,
      token.position,
      token,
    );
  }
}
