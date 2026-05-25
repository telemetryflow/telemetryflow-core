import { Injectable } from '@nestjs/common';
import {
  TfqlAstNode,
  FetchNode,
  FilterNode,
  ConditionNode,
  OrderByNode,
  OrderByClause,
  ElasticQueryNode,
  ElasticBoolQuery,
  ElasticTermQuery,
  ElasticRangeQuery,
  ElasticMatchQuery,
  ElasticWildcardQuery,
  ElasticRegexpQuery,
} from '../../domain/types/ast-nodes.types';
import { SortOrder } from '../../domain/value-objects/AggregationInterval';
import { TfqlParseError } from '../../domain/types/tfql.types';

interface ElasticSearchBody {
  query?: unknown;
  size?: number;
  from?: number;
  sort?: unknown[];
  _source?: string[] | { includes?: string[]; excludes?: string[] };
  aggs?: unknown;
  aggregations?: unknown;
}

/**
 * Elasticsearch Query Parser
 * Parses Elasticsearch Query DSL and converts to TFQL AST
 */
@Injectable()
export class ElasticParser {
  /**
   * Parse Elasticsearch query JSON into TFQL AST
   */
  parse(query: string): TfqlAstNode {
    let parsed: ElasticSearchBody;

    try {
      parsed = JSON.parse(query);
    } catch (_e) {
      throw new TfqlParseError('Invalid JSON', 1, 1, 0);
    }

    return this.convertToTfqlAst(parsed);
  }

  /**
   * Parse Elasticsearch query directly (for debugging/testing)
   */
  parseElastic(query: string): ElasticQueryNode | null {
    const parsed = JSON.parse(query) as ElasticSearchBody;
    if (!parsed.query) {
      return null;
    }
    return this.parseQueryNode(parsed.query);
  }

  private convertToTfqlAst(body: ElasticSearchBody): FetchNode {
    const fetchNode: FetchNode = {
      type: 'FETCH',
      target: 'logs', // Default to logs for Elasticsearch queries
    };

    // Parse query
    if (body.query) {
      const queryNode = this.parseQueryNode(body.query);
      if (queryNode) {
        fetchNode.filter = this.convertQueryToFilter(queryNode);
      }
    }

    // Parse size (limit)
    if (body.size !== undefined) {
      fetchNode.limit = {
        type: 'LIMIT',
        value: body.size,
      };
    }

    // Parse from (offset)
    if (body.from !== undefined) {
      fetchNode.offset = {
        type: 'OFFSET',
        value: body.from,
      };
    }

    // Parse sort
    if (body.sort && Array.isArray(body.sort)) {
      fetchNode.orderBy = this.parseSort(body.sort);
    }

    // Parse _source for field selection
    if (body._source) {
      if (Array.isArray(body._source)) {
        fetchNode.fields = body._source;
      } else if (typeof body._source === 'object' && body._source.includes) {
        fetchNode.fields = body._source.includes;
      }
    }

    return fetchNode;
  }

  private parseQueryNode(query: unknown): ElasticQueryNode | null {
    if (typeof query !== 'object' || query === null) {
      return null;
    }

    const queryObj = query as Record<string, unknown>;

    // Bool query
    if (queryObj.bool) {
      return this.parseBoolQuery(queryObj.bool as Record<string, unknown>);
    }

    // Term query
    if (queryObj.term) {
      return this.parseTermQuery(queryObj.term as Record<string, unknown>);
    }

    // Terms query (multiple values)
    if (queryObj.terms) {
      return this.parseTermsQuery(queryObj.terms as Record<string, unknown>);
    }

    // Range query
    if (queryObj.range) {
      return this.parseRangeQuery(queryObj.range as Record<string, unknown>);
    }

    // Match query
    if (queryObj.match) {
      return this.parseMatchQuery(queryObj.match as Record<string, unknown>);
    }

    // Match phrase query
    if (queryObj.match_phrase) {
      return this.parseMatchQuery(queryObj.match_phrase as Record<string, unknown>, true);
    }

    // Wildcard query
    if (queryObj.wildcard) {
      return this.parseWildcardQuery(queryObj.wildcard as Record<string, unknown>);
    }

    // Regexp query
    if (queryObj.regexp) {
      return this.parseRegexpQuery(queryObj.regexp as Record<string, unknown>);
    }

    // Exists query
    if (queryObj.exists) {
      return this.parseExistsQuery(queryObj.exists as Record<string, unknown>);
    }

    // Query string
    if (queryObj.query_string) {
      return this.parseQueryStringQuery(queryObj.query_string as Record<string, unknown>);
    }

    // Simple query string
    if (queryObj.simple_query_string) {
      return this.parseSimpleQueryStringQuery(queryObj.simple_query_string as Record<string, unknown>);
    }

    return null;
  }

  private parseBoolQuery(bool: Record<string, unknown>): ElasticBoolQuery {
    const result: ElasticBoolQuery = {
      type: 'ELASTIC_BOOL',
    };

    if (bool.must) {
      result.must = this.parseQueryArray(bool.must);
    }

    if (bool.must_not) {
      result.mustNot = this.parseQueryArray(bool.must_not);
    }

    if (bool.should) {
      result.should = this.parseQueryArray(bool.should);
    }

    if (bool.filter) {
      result.filter = this.parseQueryArray(bool.filter);
    }

    if (typeof bool.minimum_should_match === 'number') {
      result.minimumShouldMatch = bool.minimum_should_match;
    }

    return result;
  }

  private parseQueryArray(queries: unknown): ElasticQueryNode[] {
    if (!Array.isArray(queries)) {
      const node = this.parseQueryNode(queries);
      return node ? [node] : [];
    }

    const result: ElasticQueryNode[] = [];
    for (const query of queries) {
      const node = this.parseQueryNode(query);
      if (node) {
        result.push(node);
      }
    }
    return result;
  }

  private parseTermQuery(term: Record<string, unknown>): ElasticTermQuery {
    const field = Object.keys(term)[0];
    let value = term[field];

    // Handle { field: { value: "..." } } format
    if (typeof value === 'object' && value !== null && 'value' in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>).value;
    }

    return {
      type: 'ELASTIC_TERM',
      field,
      value,
    };
  }

  private parseTermsQuery(terms: Record<string, unknown>): ElasticBoolQuery {
    // Convert terms to bool/should
    const field = Object.keys(terms)[0];
    const values = terms[field] as unknown[];

    return {
      type: 'ELASTIC_BOOL',
      should: values.map(value => ({
        type: 'ELASTIC_TERM' as const,
        field,
        value,
      })),
      minimumShouldMatch: 1,
    };
  }

  private parseRangeQuery(range: Record<string, unknown>): ElasticRangeQuery {
    const field = Object.keys(range)[0];
    const conditions = range[field] as Record<string, unknown>;

    return {
      type: 'ELASTIC_RANGE',
      field,
      gt: conditions.gt,
      gte: conditions.gte,
      lt: conditions.lt,
      lte: conditions.lte,
    };
  }

  private parseMatchQuery(match: Record<string, unknown>, _isPhrase: boolean = false): ElasticMatchQuery {
    const field = Object.keys(match)[0];
    let query: string;
    let operator: 'AND' | 'OR' = 'OR';

    const value = match[field];
    if (typeof value === 'string') {
      query = value;
    } else if (typeof value === 'object' && value !== null) {
      const valueObj = value as Record<string, unknown>;
      query = String(valueObj.query || '');
      if (valueObj.operator) {
        operator = valueObj.operator === 'and' ? 'AND' : 'OR';
      }
    } else {
      query = String(value);
    }

    return {
      type: 'ELASTIC_MATCH',
      field,
      query,
      operator,
    };
  }

  private parseWildcardQuery(wildcard: Record<string, unknown>): ElasticWildcardQuery {
    const field = Object.keys(wildcard)[0];
    let value: string;

    const wildcardValue = wildcard[field];
    if (typeof wildcardValue === 'string') {
      value = wildcardValue;
    } else if (typeof wildcardValue === 'object' && wildcardValue !== null) {
      value = String((wildcardValue as Record<string, unknown>).value || '');
    } else {
      value = String(wildcardValue);
    }

    return {
      type: 'ELASTIC_WILDCARD',
      field,
      value,
    };
  }

  private parseRegexpQuery(regexp: Record<string, unknown>): ElasticRegexpQuery {
    const field = Object.keys(regexp)[0];
    let value: string;

    const regexpValue = regexp[field];
    if (typeof regexpValue === 'string') {
      value = regexpValue;
    } else if (typeof regexpValue === 'object' && regexpValue !== null) {
      value = String((regexpValue as Record<string, unknown>).value || '');
    } else {
      value = String(regexpValue);
    }

    return {
      type: 'ELASTIC_REGEXP',
      field,
      value,
    };
  }

  private parseExistsQuery(exists: Record<string, unknown>): ElasticBoolQuery {
    // Convert exists to a bool must_not term with null
    const field = exists.field as string;

    return {
      type: 'ELASTIC_BOOL',
      mustNot: [{
        type: 'ELASTIC_TERM',
        field,
        value: null,
      }],
    };
  }

  private parseQueryStringQuery(qs: Record<string, unknown>): ElasticMatchQuery {
    const query = String(qs.query || '');
    const defaultField = String(qs.default_field || '_all');

    return {
      type: 'ELASTIC_MATCH',
      field: defaultField,
      query,
      operator: qs.default_operator === 'AND' ? 'AND' : 'OR',
    };
  }

  private parseSimpleQueryStringQuery(qs: Record<string, unknown>): ElasticMatchQuery {
    const query = String(qs.query || '');
    const fields = qs.fields as string[] | undefined;
    const field = fields && fields.length > 0 ? fields[0] : '_all';

    return {
      type: 'ELASTIC_MATCH',
      field,
      query,
      operator: qs.default_operator === 'AND' ? 'AND' : 'OR',
    };
  }

  private parseSort(sort: unknown[]): OrderByNode {
    const clauses: OrderByClause[] = [];

    for (const item of sort) {
      if (typeof item === 'string') {
        clauses.push({ field: item, order: SortOrder.ASC });
      } else if (typeof item === 'object' && item !== null) {
        const sortObj = item as Record<string, unknown>;
        const field = Object.keys(sortObj)[0];
        const value = sortObj[field];

        let order: SortOrder = SortOrder.ASC;
        if (typeof value === 'string') {
          order = value.toLowerCase() === 'desc' ? SortOrder.DESC : SortOrder.ASC;
        } else if (typeof value === 'object' && value !== null) {
          const orderValue = (value as Record<string, unknown>).order;
          if (typeof orderValue === 'string') {
            order = orderValue.toLowerCase() === 'desc' ? SortOrder.DESC : SortOrder.ASC;
          }
        }

        clauses.push({ field, order });
      }
    }

    return {
      type: 'ORDER_BY',
      clauses,
    };
  }

  // ============================================================================
  // Convert Elasticsearch Query to TFQL Filter
  // ============================================================================

  private convertQueryToFilter(node: ElasticQueryNode): FilterNode {
    switch (node.type) {
      case 'ELASTIC_BOOL':
        return this.convertBoolToFilter(node);
      case 'ELASTIC_TERM':
        return this.convertTermToFilter(node);
      case 'ELASTIC_RANGE':
        return this.convertRangeToFilter(node);
      case 'ELASTIC_MATCH':
        return this.convertMatchToFilter(node);
      case 'ELASTIC_WILDCARD':
        return this.convertWildcardToFilter(node);
      case 'ELASTIC_REGEXP':
        return this.convertRegexpToFilter(node);
      default:
        throw new TfqlParseError(`Unsupported Elasticsearch query type: ${(node as any).type}`, 1, 1, 0);
    }
  }

  private convertBoolToFilter(node: ElasticBoolQuery): FilterNode {
    const conditions: (ConditionNode | FilterNode)[] = [];

    // Must clauses -> AND
    if (node.must) {
      for (const query of node.must) {
        conditions.push(this.convertQueryToFilter(query));
      }
    }

    // Filter clauses -> AND (same as must, but no scoring)
    if (node.filter) {
      for (const query of node.filter) {
        conditions.push(this.convertQueryToFilter(query));
      }
    }

    // Must not clauses -> AND with negation
    if (node.mustNot) {
      for (const query of node.mustNot) {
        const filter = this.convertQueryToFilter(query);
        // Mark conditions as negated
        for (const cond of filter.conditions) {
          if ('negated' in cond) {
            (cond as ConditionNode).negated = true;
          }
        }
        conditions.push(filter);
      }
    }

    // Should clauses -> OR (wrapped in a sub-filter)
    if (node.should && node.should.length > 0) {
      const shouldConditions: (ConditionNode | FilterNode)[] = [];
      for (const query of node.should) {
        shouldConditions.push(this.convertQueryToFilter(query));
      }

      if (shouldConditions.length === 1) {
        conditions.push(shouldConditions[0]);
      } else {
        conditions.push({
          type: 'FILTER',
          conditions: shouldConditions,
          logicalOperator: 'OR',
        });
      }
    }

    if (conditions.length === 0) {
      // Empty bool query matches all
      return {
        type: 'FILTER',
        conditions: [],
        logicalOperator: 'AND',
      };
    }

    if (conditions.length === 1) {
      if (conditions[0].type === 'FILTER') {
        return conditions[0];
      }
    }

    return {
      type: 'FILTER',
      conditions,
      logicalOperator: 'AND',
    };
  }

  private convertTermToFilter(node: ElasticTermQuery): FilterNode {
    return {
      type: 'FILTER',
      conditions: [{
        type: 'CONDITION',
        field: this.mapElasticField(node.field),
        operator: '=',
        value: node.value,
      }],
      logicalOperator: 'AND',
    };
  }

  private convertRangeToFilter(node: ElasticRangeQuery): FilterNode {
    const conditions: ConditionNode[] = [];
    const field = this.mapElasticField(node.field);

    if (node.gt !== undefined) {
      conditions.push({
        type: 'CONDITION',
        field,
        operator: '>',
        value: node.gt,
      });
    }

    if (node.gte !== undefined) {
      conditions.push({
        type: 'CONDITION',
        field,
        operator: '>=',
        value: node.gte,
      });
    }

    if (node.lt !== undefined) {
      conditions.push({
        type: 'CONDITION',
        field,
        operator: '<',
        value: node.lt,
      });
    }

    if (node.lte !== undefined) {
      conditions.push({
        type: 'CONDITION',
        field,
        operator: '<=',
        value: node.lte,
      });
    }

    return {
      type: 'FILTER',
      conditions,
      logicalOperator: 'AND',
    };
  }

  private convertMatchToFilter(node: ElasticMatchQuery): FilterNode {
    return {
      type: 'FILTER',
      conditions: [{
        type: 'CONDITION',
        field: this.mapElasticField(node.field),
        operator: 'LIKE',
        value: `%${node.query}%`,
      }],
      logicalOperator: 'AND',
    };
  }

  private convertWildcardToFilter(node: ElasticWildcardQuery): FilterNode {
    // Convert Elasticsearch wildcard (* and ?) to SQL LIKE (% and _)
    const value = node.value
      .replace(/\*/g, '%')
      .replace(/\?/g, '_');

    return {
      type: 'FILTER',
      conditions: [{
        type: 'CONDITION',
        field: this.mapElasticField(node.field),
        operator: 'LIKE',
        value,
      }],
      logicalOperator: 'AND',
    };
  }

  private convertRegexpToFilter(node: ElasticRegexpQuery): FilterNode {
    return {
      type: 'FILTER',
      conditions: [{
        type: 'CONDITION',
        field: this.mapElasticField(node.field),
        operator: 'REGEX',
        value: node.value,
      }],
      logicalOperator: 'AND',
    };
  }

  private mapElasticField(field: string): string {
    // Map common Elasticsearch field names to TFQL
    const mapping: Record<string, string> = {
      '@timestamp': 'timestamp',
      'message': 'body',
      'level': 'severity_text',
      'log.level': 'severity_text',
      'service.name': 'service_name',
      'trace.id': 'trace_id',
      'span.id': 'span_id',
      '_all': 'body',
    };

    return mapping[field] || field;
  }
}
