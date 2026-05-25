import { Injectable } from '@nestjs/common';
import { TfqlParser } from '../../../query/infrastructure/parsers/TfqlParser';
import { TfqlLexer } from '../../../query/infrastructure/parsers/TfqlLexer';
import {
  TfqlParseError,
  TfqlLexerError,
  TfqlParserConfig,
} from '../../../query/domain/types/tfql.types';
import { TfqlAstNode, FetchNode, CorrelateNode } from '../../../query/domain/types/ast-nodes.types';
import {
  ValidateTfqlQueryRequestDto,
  TfqlValidationResultDto,
} from '../../presentation/dto/ValidateTfqlQuery.request';

/**
 * Service for validating TFQL queries
 * Used by alerting module to validate query configurations
 */
@Injectable()
export class TfqlValidationService {
  private readonly parser: TfqlParser;
  private readonly lexer: TfqlLexer;

  constructor() {
    this.lexer = new TfqlLexer();
    this.parser = new TfqlParser(this.lexer);
  }

  /**
   * Validate a TFQL query string
   */
  validate(request: ValidateTfqlQueryRequestDto): TfqlValidationResultDto {
    const { query, allowedTargets, strictMode } = request;

    // Configure parser options
    const config: Partial<TfqlParserConfig> = {
      strict: strictMode ?? false,
      maxDepth: 5,
    };

    if (allowedTargets && allowedTargets.length > 0) {
      config.allowedTargets = allowedTargets;
    }

    this.parser.configure(config);

    try {
      // Attempt to parse the query
      const ast = this.parser.parse(query);

      // Extract query structure info
      const parsedQuery = this.extractQueryInfo(ast);
      const suggestions = this.generateSuggestions(ast, query);

      return {
        valid: true,
        parsedQuery,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (error) {
      if (error instanceof TfqlParseError) {
        return {
          valid: false,
          error: error.message,
          errorDetails: {
            line: error.line,
            column: error.column,
            position: error.position,
            message: error.message,
          },
          suggestions: this.getErrorSuggestions(error),
        };
      }

      if (error instanceof TfqlLexerError) {
        return {
          valid: false,
          error: error.message,
          errorDetails: {
            line: error.line,
            column: error.column,
            position: error.position,
            message: error.message,
          },
          suggestions: ['Check for invalid characters or malformed tokens'],
        };
      }

      // Unknown error
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        suggestions: ['Ensure query follows TFQL syntax'],
      };
    }
  }

  /**
   * Extract query structure information from AST
   */
  private extractQueryInfo(ast: TfqlAstNode): TfqlValidationResultDto['parsedQuery'] {
    if (ast.type === 'FETCH') {
      const fetchNode = ast as FetchNode;
      return {
        type: 'FETCH',
        target: fetchNode.target,
        hasFilter: !!fetchNode.filter,
        hasTimeRange: !!fetchNode.timeRange,
        hasAggregation: !!fetchNode.aggregation,
        hasGroupBy: !!fetchNode.groupBy,
      };
    }

    if (ast.type === 'CORRELATE') {
      const correlateNode = ast as CorrelateNode;
      return {
        type: 'CORRELATE',
        target: `${correlateNode.left.target} + ${correlateNode.right.target}`,
        hasFilter: !!correlateNode.left.filter || !!correlateNode.right.filter,
        hasTimeRange: !!correlateNode.timeRange,
        hasAggregation: false,
        hasGroupBy: false,
      };
    }

    return {
      type: ast.type,
    };
  }

  /**
   * Generate suggestions for improving the query
   */
  private generateSuggestions(ast: TfqlAstNode, _query: string): string[] {
    const suggestions: string[] = [];

    if (ast.type === 'FETCH') {
      const fetchNode = ast as FetchNode;

      // Suggest adding time range if missing
      if (!fetchNode.timeRange) {
        suggestions.push('Consider adding TIMERANGE clause to limit query scope');
      }

      // Suggest adding LIMIT for large datasets
      if (!fetchNode.limit && (fetchNode.target === 'logs' || fetchNode.target === 'traces')) {
        suggestions.push('Consider adding LIMIT clause for logs/traces queries');
      }

      // Check for missing GROUP BY with aggregation
      if (fetchNode.aggregation && !fetchNode.groupBy) {
        suggestions.push('Consider adding GROUP BY clause with aggregation');
      }
    }

    return suggestions;
  }

  /**
   * Get suggestions based on parse error
   */
  private getErrorSuggestions(error: TfqlParseError): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('expected fetch')) {
      suggestions.push('TFQL queries must start with FETCH or CORRELATE');
      suggestions.push('Example: FETCH metrics WHERE name = "cpu_usage"');
    }

    if (message.includes('expected where')) {
      suggestions.push('Use WHERE clause to filter data');
      suggestions.push('Example: WHERE service = "api-gateway"');
    }

    if (message.includes('expected timerange')) {
      suggestions.push('Use TIMERANGE to specify time bounds');
      suggestions.push('Example: TIMERANGE last 1h');
    }

    if (message.includes('operator')) {
      suggestions.push('Valid operators: =, !=, >, <, >=, <=, IN, LIKE, REGEX');
    }

    if (message.includes('target')) {
      suggestions.push('Valid targets: metrics, logs, traces, agents, clusters, pods, etc.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Check TFQL syntax documentation');
    }

    return suggestions;
  }

  /**
   * Validate multiple queries in batch
   */
  validateBatch(queries: ValidateTfqlQueryRequestDto[]): TfqlValidationResultDto[] {
    return queries.map(query => this.validate(query));
  }
}
