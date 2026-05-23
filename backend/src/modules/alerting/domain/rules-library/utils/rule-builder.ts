/**
 * Fluent builder for creating alert rule templates
 */

import {
  AlertRuleTemplate,
  AlertConditionTemplate,
  AlertSeverity,
  AlertSourceType,
  QueryLanguage,
  RuleCategory,
  DefaultDurations,
  DefaultIntervals,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AlertRuleBuilder {
  private rule: Partial<AlertRuleTemplate>;

  constructor(id?: string) {
    this.rule = {
      id: id || uuidv4(),
      conditions: [],
      labels: {},
      annotations: {},
      evaluationInterval: DefaultIntervals.NORMAL,
      forDuration: DefaultDurations.MEDIUM,
      enabled: true,
      sourceType: AlertSourceType.PROMETHEUS,
      queryLanguage: QueryLanguage.CONDITION,
    };
  }

  /**
   * Create a new builder instance
   */
  static create(id?: string): AlertRuleBuilder {
    return new AlertRuleBuilder(id);
  }

  /**
   * Set the rule name
   */
  name(name: string): AlertRuleBuilder {
    this.rule.name = name;
    return this;
  }

  /**
   * Set the rule description
   */
  description(description: string): AlertRuleBuilder {
    this.rule.description = description;
    return this;
  }

  /**
   * Set the rule category
   */
  category(category: RuleCategory, subcategory?: string): AlertRuleBuilder {
    this.rule.category = category;
    this.rule.subcategory = subcategory;
    return this;
  }

  /**
   * Set the rule severity
   */
  severity(severity: AlertSeverity): AlertRuleBuilder {
    this.rule.severity = severity;
    return this;
  }

  /**
   * Add a condition to the rule
   */
  condition(condition: AlertConditionTemplate): AlertRuleBuilder {
    this.rule.conditions = [...(this.rule.conditions || []), condition];
    return this;
  }

  /**
   * Add multiple conditions
   */
  conditions(conditions: AlertConditionTemplate[]): AlertRuleBuilder {
    this.rule.conditions = [...(this.rule.conditions || []), ...conditions];
    return this;
  }

  /**
   * Set the evaluation interval
   */
  evaluationInterval(interval: string): AlertRuleBuilder {
    this.rule.evaluationInterval = interval;
    return this;
  }

  /**
   * Set the for duration (how long condition must be true)
   */
  forDuration(duration: string): AlertRuleBuilder {
    this.rule.forDuration = duration;
    return this;
  }

  /**
   * Add a label
   */
  label(key: string, value: string): AlertRuleBuilder {
    this.rule.labels = { ...this.rule.labels, [key]: value };
    return this;
  }

  /**
   * Add multiple labels
   */
  labels(labels: Record<string, string>): AlertRuleBuilder {
    this.rule.labels = { ...this.rule.labels, ...labels };
    return this;
  }

  /**
   * Add an annotation
   */
  annotation(key: string, value: string): AlertRuleBuilder {
    this.rule.annotations = { ...this.rule.annotations, [key]: value };
    return this;
  }

  /**
   * Add multiple annotations
   */
  annotations(annotations: Record<string, string>): AlertRuleBuilder {
    this.rule.annotations = { ...this.rule.annotations, ...annotations };
    return this;
  }

  /**
   * Set the runbook URL
   */
  runbook(url: string): AlertRuleBuilder {
    this.rule.runbook = url;
    return this;
  }

  /**
   * Set the PromQL expression (for reference)
   */
  promql(query: string): AlertRuleBuilder {
    this.rule.promql = query;
    return this;
  }

  /**
   * Set the source reference
   */
  source(name: string, url?: string): AlertRuleBuilder {
    this.rule.source = { name, url };
    return this;
  }

  /**
   * Set the alert source type (prometheus, tfo-agent, tfo-collector, custom)
   */
  sourceType(sourceType: AlertSourceType): AlertRuleBuilder {
    this.rule.sourceType = sourceType;
    return this;
  }

  /**
   * Set the query language (condition, tfql, promql, elasticsearch, sql)
   */
  queryLanguage(language: QueryLanguage): AlertRuleBuilder {
    this.rule.queryLanguage = language;
    return this;
  }

  /**
   * Set TFQL query string
   */
  tfqlQuery(query: string): AlertRuleBuilder {
    this.rule.tfqlQuery = query;
    this.rule.queryLanguage = QueryLanguage.TFQL;
    return this;
  }

  /**
   * Set enabled status
   */
  enabled(enabled: boolean): AlertRuleBuilder {
    this.rule.enabled = enabled;
    return this;
  }

  /**
   * Build the alert rule template
   */
  build(): AlertRuleTemplate {
    if (!this.rule.name) {
      throw new Error('Alert rule name is required');
    }
    if (!this.rule.category) {
      throw new Error('Alert rule category is required');
    }
    if (!this.rule.severity) {
      throw new Error('Alert rule severity is required');
    }
    if (!this.rule.conditions || this.rule.conditions.length === 0) {
      throw new Error('Alert rule must have at least one condition');
    }

    return this.rule as AlertRuleTemplate;
  }
}

/**
 * Helper function to create common rule patterns
 */
export const RulePatterns = {
  /**
   * Create a threshold-based rule
   */
  threshold(options: {
    id: string;
    name: string;
    description: string;
    category: RuleCategory;
    severity: AlertSeverity;
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte';
    threshold: number;
    duration?: string;
    sourceType?: AlertSourceType;
  }): AlertRuleTemplate {
    return AlertRuleBuilder.create(options.id)
      .name(options.name)
      .description(options.description)
      .category(options.category)
      .severity(options.severity)
      .sourceType(options.sourceType || AlertSourceType.PROMETHEUS)
      .condition({
        metric: options.metric,
        aggregation: 'avg',
        operator: options.operator,
        threshold: options.threshold,
        duration: options.duration || DefaultDurations.MEDIUM,
      })
      .source('awesome-prometheus-alerts', 'https://samber.github.io/awesome-prometheus-alerts/')
      .build();
  },

  /**
   * Create an availability rule (up/down)
   */
  availability(options: {
    id: string;
    name: string;
    description: string;
    category: RuleCategory;
    metric: string;
    duration?: string;
    sourceType?: AlertSourceType;
  }): AlertRuleTemplate {
    return AlertRuleBuilder.create(options.id)
      .name(options.name)
      .description(options.description)
      .category(options.category)
      .severity('critical')
      .sourceType(options.sourceType || AlertSourceType.PROMETHEUS)
      .condition({
        metric: options.metric,
        aggregation: 'last',
        operator: 'eq',
        threshold: 0,
        duration: options.duration || DefaultDurations.SHORT,
      })
      .source('awesome-prometheus-alerts', 'https://samber.github.io/awesome-prometheus-alerts/')
      .build();
  },

  /**
   * Create a rate-based rule
   */
  rate(options: {
    id: string;
    name: string;
    description: string;
    category: RuleCategory;
    severity: AlertSeverity;
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte';
    threshold: number;
    duration?: string;
    sourceType?: AlertSourceType;
  }): AlertRuleTemplate {
    return AlertRuleBuilder.create(options.id)
      .name(options.name)
      .description(options.description)
      .category(options.category)
      .severity(options.severity)
      .sourceType(options.sourceType || AlertSourceType.PROMETHEUS)
      .condition({
        metric: options.metric,
        aggregation: 'rate',
        operator: options.operator,
        threshold: options.threshold,
        duration: options.duration || DefaultDurations.MEDIUM,
      })
      .source('awesome-prometheus-alerts', 'https://samber.github.io/awesome-prometheus-alerts/')
      .build();
  },

  /**
   * Create a TFO-Agent specific rule
   */
  tfoAgent(options: {
    id: string;
    name: string;
    description: string;
    severity: AlertSeverity;
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    threshold: number;
    duration?: string;
    tfqlQuery?: string;
  }): AlertRuleTemplate {
    const builder = AlertRuleBuilder.create(options.id)
      .name(options.name)
      .description(options.description)
      .category(RuleCategory.TFO_AGENT)
      .severity(options.severity)
      .sourceType(AlertSourceType.TFO_AGENT)
      .condition({
        metric: options.metric,
        aggregation: 'avg',
        operator: options.operator,
        threshold: options.threshold,
        duration: options.duration || DefaultDurations.MEDIUM,
      })
      .source('TelemetryFlow Platform', 'https://telemetryflow.id/docs/alerting');

    if (options.tfqlQuery) {
      builder.tfqlQuery(options.tfqlQuery);
    }

    return builder.build();
  },

  /**
   * Create a TFO-Collector specific rule
   */
  tfoCollector(options: {
    id: string;
    name: string;
    description: string;
    severity: AlertSeverity;
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    threshold: number;
    duration?: string;
    tfqlQuery?: string;
  }): AlertRuleTemplate {
    const builder = AlertRuleBuilder.create(options.id)
      .name(options.name)
      .description(options.description)
      .category(RuleCategory.TFO_COLLECTOR)
      .severity(options.severity)
      .sourceType(AlertSourceType.TFO_COLLECTOR)
      .condition({
        metric: options.metric,
        aggregation: 'avg',
        operator: options.operator,
        threshold: options.threshold,
        duration: options.duration || DefaultDurations.MEDIUM,
      })
      .source('TelemetryFlow Platform', 'https://telemetryflow.id/docs/alerting');

    if (options.tfqlQuery) {
      builder.tfqlQuery(options.tfqlQuery);
    }

    return builder.build();
  },
};
