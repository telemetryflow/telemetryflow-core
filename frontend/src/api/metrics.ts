/**
 * Metrics API client
 */

import { collectorClient } from "./collector";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { config } from "@/config";
import { mockDataGenerator } from "@/services/mockDataGenerator";
import { mockMetricStats } from "@/mocks/api-stats";
import type {
  MetricQuery,
  MetricQueryResult,
  MetricMetadata,
  MetricSeries,
} from "@/types";

export interface MetricLabelsResponse {
  labels: string[];
  values: Record<string, string[]>;
}

export interface MetricStatsResponse {
  totalMetrics: number;
  totalDataPoints: number;
  activeSeries: number;
  avgRatePerMin: number;
  /** Previous period values for trend comparison */
  prevDataPoints?: number;
  prevActiveSeries?: number;
  prevAvgRatePerMin?: number;
}

export const metricsApi = {
  /**
   * Query metrics data
   */
  async query(params: MetricQuery): Promise<MetricQueryResult> {
    if (config.useMock) {
      const data = mockDataGenerator.getMetricSeries(
        params.query,
        params.start,
        params.end,
        params.step,
      );
      return { status: "success", data };
    }

    const response = await collectorClient.post<MetricSeries[]>(
      COLLECTOR_ENDPOINTS.METRICS_QUERY,
      params,
    );
    return {
      status: response.status,
      data: response.data,
      error: response.error,
    };
  },

  /**
   * Get metrics overview stats (total data points, active series, etc.)
   */
  async getStats(start?: number, end?: number): Promise<MetricStatsResponse> {
    if (config.useMock) {
      return mockMetricStats(start, end);
    }

    const defaults: MetricStatsResponse = {
      totalMetrics: 0,
      totalDataPoints: 0,
      activeSeries: 0,
      avgRatePerMin: 0,
    };

    try {
      const params: Record<string, string> = {};
      if (start) params.from = String(start);
      if (end) params.to = String(end);
      const response = await collectorClient.get<any>(
        COLLECTOR_ENDPOINTS.METRICS_STATS,
        { params },
      );
      const payload = response.data;
      const result = payload?.data || payload || defaults;

      return {
        totalMetrics: Number(result.totalMetrics) || 0,
        totalDataPoints: Number(result.totalDataPoints) || 0,
        activeSeries: Number(result.activeSeries) || 0,
        avgRatePerMin: Number(result.avgRatePerMin) || 0,
        prevDataPoints: result.prevDataPoints != null ? Number(result.prevDataPoints) : undefined,
        prevActiveSeries: result.prevActiveSeries != null ? Number(result.prevActiveSeries) : undefined,
        prevAvgRatePerMin: result.prevAvgRatePerMin != null ? Number(result.prevAvgRatePerMin) : undefined,
      };
    } catch {
      return defaults;
    }
  },

  /**
   * Get metric names
   */
  async getMetricNames(): Promise<string[]> {
    if (config.useMock) {
      return mockDataGenerator.getMetricNames();
    }

    const response = await collectorClient.get<string[]>(
      COLLECTOR_ENDPOINTS.METRICS,
    );
    return response.data;
  },

  /**
   * Get metric metadata
   */
  async getMetadata(metricName?: string): Promise<MetricMetadata[]> {
    if (config.useMock) {
      const metadata = mockDataGenerator.getMetricMetadata();
      return metricName
        ? metadata.filter((m) => m.name === metricName)
        : metadata;
    }

    const params = metricName ? { metric: metricName } : undefined;
    const response = await collectorClient.get<MetricMetadata[]>(
      COLLECTOR_ENDPOINTS.METRICS_METADATA,
      { params },
    );
    return response.data;
  },

  /**
   * Get label names and values
   */
  async getLabels(metricName?: string): Promise<MetricLabelsResponse> {
    if (config.useMock) {
      return mockDataGenerator.getMetricLabels();
    }

    const params = metricName ? { metric: metricName } : undefined;
    const response = await collectorClient.get<MetricLabelsResponse>(
      COLLECTOR_ENDPOINTS.METRICS_LABELS,
      { params },
    );
    return response.data;
  },

  /**
   * Get instant metric value
   */
  async getInstant(query: string, time?: number): Promise<MetricSeries[]> {
    if (config.useMock) {
      const t = time || Date.now();
      return mockDataGenerator.getMetricSeries(query, t - 60000, t, 60000);
    }

    const response = await collectorClient.post<MetricSeries[]>(
      COLLECTOR_ENDPOINTS.METRICS_QUERY,
      {
        query,
        time: time || Date.now(),
        instant: true,
      },
    );
    return response.data;
  },

  /**
   * Get metric range data
   */
  async getRange(
    query: string,
    start: number,
    end: number,
    step?: number,
  ): Promise<MetricSeries[]> {
    if (config.useMock) {
      const s =
        step || Math.max(Math.floor((end - start) / 1000 / 250), 15) * 1000;
      return mockDataGenerator.getMetricSeries(query, start, end, s);
    }

    const response = await collectorClient.post<MetricSeries[]>(
      COLLECTOR_ENDPOINTS.METRICS_QUERY,
      {
        query,
        start,
        end,
        step: step || Math.max(Math.floor((end - start) / 1000 / 250), 15),
      },
    );
    return response.data;
  },
};

export default metricsApi;
