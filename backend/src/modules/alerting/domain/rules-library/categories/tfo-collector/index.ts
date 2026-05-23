/**
 * TFO-Collector Alert Rules
 * TelemetryFlow Collector (OTEL Collector) monitoring
 * Based on OpenTelemetry Collector internal metrics
 * @see https://opentelemetry.io/docs/collector/internal-telemetry/
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  AlertSourceType,
  RuleCategory,
  DefaultThresholds,
  DefaultDurations,
} from '../../types';
import { AlertRuleBuilder, ConditionBuilder } from '../../utils';

// ====================== TFO-COLLECTOR CATEGORY ======================
export const TFOCollectorCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.TFO_COLLECTOR,
    name: 'TFO-Collector',
    description: 'TelemetryFlow Collector (OTEL) monitoring for traces, metrics, and logs pipelines',
    icon: 'mdi:pipe',
    exporter: 'otelcol-contrib',
    documentationUrl: 'https://docs.telemetryflow.id/collector',
    ruleCount: 35,
  },
  groups: [
    { id: 'health', name: 'Health', description: 'Collector health and availability', rules: [] },
    { id: 'receiver', name: 'Receivers', description: 'Receiver pipeline metrics', rules: [] },
    { id: 'processor', name: 'Processors', description: 'Processor pipeline metrics', rules: [] },
    { id: 'exporter', name: 'Exporters', description: 'Exporter pipeline metrics', rules: [] },
    { id: 'traces', name: 'Traces', description: 'Trace-specific pipeline metrics', rules: [] },
    { id: 'metrics', name: 'Metrics', description: 'Metrics-specific pipeline metrics', rules: [] },
    { id: 'logs', name: 'Logs', description: 'Logs-specific pipeline metrics', rules: [] },
    { id: 'queue', name: 'Queues', description: 'Queue and buffer metrics', rules: [] },
  ],
};

export const TFOCollectorRules: AlertRuleTemplate[] = [
  // ====================== HEALTH ======================
  AlertRuleBuilder.create('tfo-collector-down')
    .name('TFO-Collector Down')
    .description('TFO-Collector is down')
    .category(RuleCategory.TFO_COLLECTOR, 'health')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_process_uptime')
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'availability' })
    .annotations({
      summary: 'TFO-Collector down ({{ $labels.service_instance_id }})',
      description: 'TFO-Collector instance is not running',
    })
    .promql('up{job="otelcol"} == 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-high-cpu')
    .name('TFO-Collector High CPU')
    .description('TFO-Collector CPU usage is high')
    .category(RuleCategory.TFO_COLLECTOR, 'health')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_process_cpu_seconds_total')
        .rate()
        .gt(0.8)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'cpu' })
    .annotations({
      summary: 'TFO-Collector high CPU ({{ $labels.service_instance_id }})',
      description: 'CPU usage is {{ $value | humanizePercentage }}',
    })
    .promql('rate(otelcol_process_cpu_seconds_total[5m]) > 0.8')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-high-memory')
    .name('TFO-Collector High Memory')
    .description('TFO-Collector memory usage is high')
    .category(RuleCategory.TFO_COLLECTOR, 'health')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_process_memory_rss')
        .last()
        .gt(1073741824) // 1GB
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'memory' })
    .annotations({
      summary: 'TFO-Collector high memory ({{ $labels.service_instance_id }})',
      description: 'Memory usage is {{ $value | humanize1024 }}B',
    })
    .promql('otelcol_process_memory_rss > 1073741824')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-restart')
    .name('TFO-Collector Restarted')
    .description('TFO-Collector has restarted')
    .category(RuleCategory.TFO_COLLECTOR, 'health')
    .severity('info')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_process_uptime')
        .last()
        .lt(300)
        .duration(DefaultDurations.SHORT)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'restart' })
    .annotations({
      summary: 'TFO-Collector restarted ({{ $labels.service_instance_id }})',
      description: 'Collector uptime is {{ $value }}s',
    })
    .promql('otelcol_process_uptime < 300')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== RECEIVER ======================
  AlertRuleBuilder.create('tfo-collector-receiver-refused')
    .name('TFO-Collector Receiver Refusing Data')
    .description('Receiver is refusing incoming telemetry data')
    .category(RuleCategory.TFO_COLLECTOR, 'receiver')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_receiver_refused_spans')
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'receiver' })
    .annotations({
      summary: 'Receiver refusing data ({{ $labels.receiver }})',
      description: 'Refused spans rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_receiver_refused_spans[5m]) > 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-receiver-no-data')
    .name('TFO-Collector Receiver No Data')
    .description('Receiver is not receiving any data')
    .category(RuleCategory.TFO_COLLECTOR, 'receiver')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_receiver_accepted_spans')
        .rate()
        .eq(0)
        .duration(DefaultDurations.LONG)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'receiver' })
    .annotations({
      summary: 'Receiver not receiving data ({{ $labels.receiver }})',
      description: 'No spans received for 15 minutes',
    })
    .promql('rate(otelcol_receiver_accepted_spans[15m]) == 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-receiver-errors')
    .name('TFO-Collector Receiver Errors')
    .description('Receiver is encountering errors')
    .category(RuleCategory.TFO_COLLECTOR, 'receiver')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_receiver_errors_total')
        .rate()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'receiver' })
    .annotations({
      summary: 'Receiver errors ({{ $labels.receiver }})',
      description: 'Error rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_receiver_errors_total[5m]) > 1')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== PROCESSOR ======================
  AlertRuleBuilder.create('tfo-collector-processor-dropped')
    .name('TFO-Collector Processor Dropping Data')
    .description('Processor is dropping telemetry data')
    .category(RuleCategory.TFO_COLLECTOR, 'processor')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_dropped_spans')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_DROPPED_SPANS_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'processor' })
    .annotations({
      summary: 'Processor dropping data ({{ $labels.processor }})',
      description: 'Dropped spans rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_processor_dropped_spans[5m]) > 10')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-processor-dropped-critical')
    .name('TFO-Collector Processor Dropping Data Critical')
    .description('Processor is dropping significant telemetry data')
    .category(RuleCategory.TFO_COLLECTOR, 'processor')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_dropped_spans')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_DROPPED_SPANS_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'processor' })
    .annotations({
      summary: 'Processor dropping data critical ({{ $labels.processor }})',
      description: 'Dropped spans rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_processor_dropped_spans[5m]) > 100')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-batch-timeout')
    .name('TFO-Collector Batch Timeout')
    .description('Batch processor is timing out')
    .category(RuleCategory.TFO_COLLECTOR, 'processor')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_batch_timeout_trigger_send')
        .rate()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'batch' })
    .annotations({
      summary: 'Batch processor timeout ({{ $labels.processor }})',
      description: 'Batch timeout rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_processor_batch_timeout_trigger_send[5m]) > 10')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== EXPORTER ======================
  AlertRuleBuilder.create('tfo-collector-exporter-failed')
    .name('TFO-Collector Exporter Failed')
    .description('Exporter is failing to send data')
    .category(RuleCategory.TFO_COLLECTOR, 'exporter')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_send_failed_spans')
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'exporter' })
    .annotations({
      summary: 'Exporter failing ({{ $labels.exporter }})',
      description: 'Failed spans rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_exporter_send_failed_spans[5m]) > 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-exporter-queue-full')
    .name('TFO-Collector Exporter Queue Full')
    .description('Exporter queue is nearly full')
    .category(RuleCategory.TFO_COLLECTOR, 'exporter')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_queue_size')
        .last()
        .gt(DefaultThresholds.COLLECTOR_QUEUE_SIZE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'exporter' })
    .annotations({
      summary: 'Exporter queue full ({{ $labels.exporter }})',
      description: 'Queue utilization: {{ $value }}%',
    })
    .promql('otelcol_exporter_queue_size / otelcol_exporter_queue_capacity * 100 > 80')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-exporter-retry')
    .name('TFO-Collector Exporter Retrying')
    .description('Exporter is retrying to send data')
    .category(RuleCategory.TFO_COLLECTOR, 'exporter')
    .severity('info')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_retry_send_spans')
        .rate()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'exporter' })
    .annotations({
      summary: 'Exporter retrying ({{ $labels.exporter }})',
      description: 'Retry rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_exporter_retry_send_spans[5m]) > 1')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-exporter-no-output')
    .name('TFO-Collector Exporter No Output')
    .description('Exporter is not sending any data')
    .category(RuleCategory.TFO_COLLECTOR, 'exporter')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_sent_spans')
        .rate()
        .eq(0)
        .duration(DefaultDurations.LONG)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'exporter' })
    .annotations({
      summary: 'Exporter not sending data ({{ $labels.exporter }})',
      description: 'No spans sent for 15 minutes',
    })
    .promql('rate(otelcol_exporter_sent_spans[15m]) == 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== TRACES ======================
  AlertRuleBuilder.create('tfo-collector-traces-dropped')
    .name('TFO-Collector Traces Dropped')
    .description('Traces are being dropped')
    .category(RuleCategory.TFO_COLLECTOR, 'traces')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_dropped_spans')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_DROPPED_SPANS_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'traces' })
    .annotations({
      summary: 'Traces being dropped',
      description: 'Dropped spans rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_processor_dropped_spans[5m])) > 10')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-traces-high-latency')
    .name('TFO-Collector Traces High Latency')
    .description('Trace processing latency is high')
    .category(RuleCategory.TFO_COLLECTOR, 'traces')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_span_processing_duration_seconds')
        .p99()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'traces' })
    .annotations({
      summary: 'Trace processing high latency',
      description: 'P99 processing latency: {{ $value }}s',
    })
    .promql('histogram_quantile(0.99, rate(otelcol_span_processing_duration_seconds_bucket[5m])) > 1')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-traces-export-failure')
    .name('TFO-Collector Traces Export Failure')
    .description('Trace export is failing')
    .category(RuleCategory.TFO_COLLECTOR, 'traces')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_send_failed_spans')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_EXPORT_FAILURE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'traces' })
    .annotations({
      summary: 'Trace export failing',
      description: 'Export failure rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_exporter_send_failed_spans[5m])) > 5')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== METRICS ======================
  AlertRuleBuilder.create('tfo-collector-metrics-dropped')
    .name('TFO-Collector Metrics Dropped')
    .description('Metrics are being dropped')
    .category(RuleCategory.TFO_COLLECTOR, 'metrics')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_dropped_metric_points')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_DROPPED_METRICS_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'metrics' })
    .annotations({
      summary: 'Metrics being dropped',
      description: 'Dropped metric points rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_processor_dropped_metric_points[5m])) > 10')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-metrics-refused')
    .name('TFO-Collector Metrics Refused')
    .description('Metrics receiver is refusing data')
    .category(RuleCategory.TFO_COLLECTOR, 'metrics')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_receiver_refused_metric_points')
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'metrics' })
    .annotations({
      summary: 'Metrics receiver refusing data',
      description: 'Refused metric points rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_receiver_refused_metric_points[5m])) > 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-metrics-export-failure')
    .name('TFO-Collector Metrics Export Failure')
    .description('Metrics export is failing')
    .category(RuleCategory.TFO_COLLECTOR, 'metrics')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_send_failed_metric_points')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_EXPORT_FAILURE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'metrics' })
    .annotations({
      summary: 'Metrics export failing',
      description: 'Export failure rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_exporter_send_failed_metric_points[5m])) > 5')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== LOGS ======================
  AlertRuleBuilder.create('tfo-collector-logs-dropped')
    .name('TFO-Collector Logs Dropped')
    .description('Logs are being dropped')
    .category(RuleCategory.TFO_COLLECTOR, 'logs')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_dropped_log_records')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_DROPPED_LOGS_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'logs' })
    .annotations({
      summary: 'Logs being dropped',
      description: 'Dropped log records rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_processor_dropped_log_records[5m])) > 10')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-logs-refused')
    .name('TFO-Collector Logs Refused')
    .description('Logs receiver is refusing data')
    .category(RuleCategory.TFO_COLLECTOR, 'logs')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_receiver_refused_log_records')
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'logs' })
    .annotations({
      summary: 'Logs receiver refusing data',
      description: 'Refused log records rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_receiver_refused_log_records[5m])) > 0')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-logs-export-failure')
    .name('TFO-Collector Logs Export Failure')
    .description('Logs export is failing')
    .category(RuleCategory.TFO_COLLECTOR, 'logs')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_send_failed_log_records')
        .rate()
        .gt(DefaultThresholds.COLLECTOR_EXPORT_FAILURE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', signal: 'logs' })
    .annotations({
      summary: 'Logs export failing',
      description: 'Export failure rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_exporter_send_failed_log_records[5m])) > 5')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  // ====================== QUEUE ======================
  AlertRuleBuilder.create('tfo-collector-queue-high')
    .name('TFO-Collector Queue High')
    .description('Collector queue is filling up')
    .category(RuleCategory.TFO_COLLECTOR, 'queue')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_queue_size')
        .avg()
        .gt(DefaultThresholds.COLLECTOR_QUEUE_SIZE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'queue' })
    .annotations({
      summary: 'Queue filling up ({{ $labels.exporter }})',
      description: 'Queue utilization: {{ $value }}%',
    })
    .promql('otelcol_exporter_queue_size / otelcol_exporter_queue_capacity * 100 > 80')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-queue-critical')
    .name('TFO-Collector Queue Critical')
    .description('Collector queue is almost full')
    .category(RuleCategory.TFO_COLLECTOR, 'queue')
    .severity('critical')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_exporter_queue_size')
        .avg()
        .gt(DefaultThresholds.COLLECTOR_QUEUE_SIZE_CRITICAL)
        .duration(DefaultDurations.SHORT)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'queue' })
    .annotations({
      summary: 'Queue critical ({{ $labels.exporter }})',
      description: 'Queue utilization: {{ $value }}%',
    })
    .promql('otelcol_exporter_queue_size / otelcol_exporter_queue_capacity * 100 > 95')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-memory-limiter-active')
    .name('TFO-Collector Memory Limiter Active')
    .description('Memory limiter is actively throttling')
    .category(RuleCategory.TFO_COLLECTOR, 'queue')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_processor_memory_limiter_decision')
        .rate()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .label('decision', 'drop')
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'memory-limiter' })
    .annotations({
      summary: 'Memory limiter dropping data',
      description: 'Data being dropped due to memory pressure',
    })
    .promql('rate(otelcol_processor_memory_limiter_decision{decision="drop"}[5m]) > 1')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-rpc-errors')
    .name('TFO-Collector RPC Errors')
    .description('Collector experiencing RPC errors')
    .category(RuleCategory.TFO_COLLECTOR, 'health')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_rpc_server_request_count')
        .rate()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .label('rpc_grpc_status_code', 'ERROR')
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'rpc' })
    .annotations({
      summary: 'High RPC error rate',
      description: 'RPC error rate: {{ $value }}/s',
    })
    .promql('sum(rate(otelcol_rpc_server_request_count{rpc_grpc_status_code!="OK"}[5m])) > 10')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),

  AlertRuleBuilder.create('tfo-collector-scrape-errors')
    .name('TFO-Collector Scrape Errors')
    .description('Prometheus receiver scrape errors')
    .category(RuleCategory.TFO_COLLECTOR, 'receiver')
    .severity('warning')
    .sourceType(AlertSourceType.TFO_COLLECTOR)
    .condition(
      ConditionBuilder.create()
        .metric('otelcol_receiver_prometheus_scrape_errors_total')
        .rate()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build()
    )
    .labels({ component: 'tfo-collector', type: 'scrape' })
    .annotations({
      summary: 'Prometheus scrape errors',
      description: 'Scrape error rate: {{ $value }}/s',
    })
    .promql('rate(otelcol_receiver_prometheus_scrape_errors_total[5m]) > 1')
    .source('telemetryflow', 'https://docs.telemetryflow.id/collector/alerts')
    .build(),
];

// Update category with rules
TFOCollectorCategory.groups.forEach(group => {
  group.rules = TFOCollectorRules.filter(rule => rule.subcategory === group.id);
});
