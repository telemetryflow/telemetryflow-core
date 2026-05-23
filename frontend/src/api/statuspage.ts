/**
 * Status Page API client
 * TASK-10: Frontend API client for Status Page module
 */

import { collectorClient } from "./collector";
import { config, brandDefaults } from "@/config";
import type {
  StatusPage,
  StatusPageResponse,
  Incident,
  IncidentResponse,
  Subscriber,
  SubscriberResponse,
  SubscribeRequest,
  CreateStatusPageRequest,
  UpdateStatusPageRequest,
  AddMonitorRequest,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentUpdateRequest,
  ListStatusPagesQuery,
  ListIncidentsQuery,
  PaginatedStatusPages,
  OverallStatus,
  IncidentImpact,
  IncidentStatus,
} from "@/types/statuspage";
import { transformStatusPage, transformIncident, transformSubscriber } from "@/types/statuspage";

// ==================== ENDPOINTS ====================

export const STATUS_PAGE_ENDPOINTS = {
  BASE: "/api/v2/status-pages",
  SINGLE: (id: string) => `/api/v2/status-pages/${id}`,
  MONITORS: (id: string) => `/api/v2/status-pages/${id}/monitors`,
  MONITOR: (id: string, monitorId: string) =>
    `/api/v2/status-pages/${id}/monitors/${monitorId}`,
  INCIDENTS: (id: string) => `/api/v2/status-pages/${id}/incidents`,
  INCIDENT: (id: string, incidentId: string) =>
    `/api/v2/status-pages/${id}/incidents/${incidentId}`,
  INCIDENT_UPDATES: (id: string, incidentId: string) =>
    `/api/v2/status-pages/${id}/incidents/${incidentId}/updates`,
  INCIDENT_RESOLVE: (id: string, incidentId: string) =>
    `/api/v2/status-pages/${id}/incidents/${incidentId}/resolve`,
  SUBSCRIBERS: (id: string) => `/api/v2/status-pages/${id}/subscribers`,
  SUBSCRIBER: (id: string, subscriberId: string) =>
    `/api/v2/status-pages/${id}/subscribers/${subscriberId}`,
  CUSTOM_DOMAIN: (id: string) => `/api/v2/status-pages/${id}/custom-domain`,
  VERIFY_DOMAIN: (id: string) =>
    `/api/v2/status-pages/${id}/custom-domain/verify`,
  // Public endpoints (no auth)
  PUBLIC_PAGE: (slug: string) => `/api/v2/public/status/${slug}`,
  PUBLIC_SUBSCRIBE: (slug: string) => `/api/v2/public/status/${slug}/subscribe`,
} as const;

// ==================== MOCK DATA ====================

// First status page matches backend seed (status-page/infrastructure/persistence/seeds/index.ts)
// Remaining pages are additional mock data for list views
function generateMockStatusPages(count: number): StatusPage[] {
  const pages: StatusPage[] = [];
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // --- Page 1: Backend seed "TelemetryFlow Status" ---
  pages.push({
    id: "statuspage-telemetryflow",
    title: "TelemetryFlow Status",
    slug: "telemetryflow",
    description: "Real-time status of TelemetryFlow Platform services — Official Website, Demo, and GitHub Repository",
    isPublic: true,
    overallStatus: "operational",
    branding: {
      brandColor: "#10B981",
      headerText: "System Status",
      footerText: brandDefaults.poweredBy,
    },
    display: {
      showUptimePercentage: true,
      showResponseTime: true,
      showIncidentHistory: true,
      showMaintenanceSchedule: true,
      allowSubscriptions: true,
      showLegend: true,
      uptimeRanges: [24, 7, 30, 90],
      historyDays: 90,
    },
    customDomainVerified: false,
    customDomainSsl: false,
    monitors: [
      {
        monitorId: "monitor-1",
        displayName: "TelemetryFlow Official Website",
        displayOrder: 0,
        isVisible: true,
      },
      {
        monitorId: "monitor-2",
        displayName: "TelemetryFlow Demo Website",
        displayOrder: 1,
        isVisible: true,
      },
      {
        monitorId: "monitor-3",
        displayName: "TelemetryFlow GitHub Repository",
        displayOrder: 2,
        isVisible: true,
      },
    ],
    activeIncidents: 0,
    organizationId: "org-devopscorner",
    createdBy: "user-admin",
    createdAt: now - 90 * DAY_MS,
    updatedAt: now - 1 * DAY_MS,
  });

  // --- Additional mock status pages ---
  const additionalPages: Array<{ title: string; slug: string; status: OverallStatus; brandColor: string; activeIncidents: number }> = [
    { title: "DevOpsCorner Platform Status", slug: "devopscorner", status: "operational", brandColor: "#3B82F6", activeIncidents: 0 },
    { title: "API Services Status", slug: "api-services", status: "operational", brandColor: "#8B5CF6", activeIncidents: 0 },
    { title: "Infrastructure Status", slug: "infrastructure", status: "degraded_performance", brandColor: "#F59E0B", activeIncidents: 1 },
    { title: "Cloud Services Status", slug: "cloud-services", status: "operational", brandColor: "#10B981", activeIncidents: 0 },
    { title: "CI/CD Pipeline Status", slug: "cicd-pipeline", status: "operational", brandColor: "#6366F1", activeIncidents: 0 },
    { title: "Staging Environment Status", slug: "staging", status: "partial_outage", brandColor: "#EF4444", activeIncidents: 2 },
    { title: "Internal Tools Status", slug: "internal-tools", status: "operational", brandColor: "#14B8A6", activeIncidents: 0 },
  ];

  for (let i = 0; i < Math.min(count - 1, additionalPages.length); i++) {
    const p = additionalPages[i];
    pages.push({
      id: `statuspage-${p.slug}`,
      title: p.title,
      slug: p.slug,
      description: `Status page for ${p.title.replace(" Status", "").toLowerCase()} services`,
      isPublic: i < 4,
      overallStatus: p.status,
      branding: {
        brandColor: p.brandColor,
        headerText: "System Status",
        footerText: brandDefaults.poweredBy,
      },
      display: {
        showUptimePercentage: true,
        showResponseTime: true,
        showIncidentHistory: true,
        showMaintenanceSchedule: true,
        allowSubscriptions: true,
        showLegend: true,
        uptimeRanges: [24, 7, 30, 90],
        historyDays: 90,
      },
      customDomainVerified: false,
      customDomainSsl: false,
      monitors: [
        { monitorId: `monitor-${i * 2 + 4}`, displayName: `Service ${i * 2 + 1}`, displayOrder: 0, isVisible: true },
        { monitorId: `monitor-${i * 2 + 5}`, displayName: `Service ${i * 2 + 2}`, displayOrder: 1, isVisible: true },
      ],
      activeIncidents: p.activeIncidents,
      organizationId: "org-devopscorner",
      createdBy: "user-admin",
      createdAt: now - (80 - i * 10) * DAY_MS,
      updatedAt: now - (i + 1) * DAY_MS,
    });
  }

  return pages;
}

// Incidents for "TelemetryFlow Status" page match backend seed exactly
// Additional random incidents generated for other pages
function generateMockIncidents(
  statusPageId: string,
  count: number,
): Incident[] {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const HOUR_MS = 60 * 60 * 1000;
  const MIN_MS = 60 * 1000;

  // For the main TelemetryFlow Status page, return seed-matching incidents
  if (statusPageId === "statuspage-telemetryflow") {
    return [
      // 1. Scheduled Database Maintenance (upcoming)
      {
        id: "incident-scheduled-db-maintenance",
        statusPageId,
        title: "Scheduled Database Maintenance",
        impact: "minor",
        status: "scheduled",
        message: "We will be performing scheduled database maintenance.",
        affectedMonitorIds: [],
        updates: [
          {
            id: "maint-1",
            status: "scheduled",
            message: "Database maintenance window scheduled. Expected downtime: 30 minutes.",
            createdBy: "user-admin",
            createdAt: now,
          },
        ],
        isScheduledMaintenance: true,
        scheduledStartAt: now + 3 * DAY_MS,
        scheduledEndAt: now + 3 * DAY_MS + 2 * HOUR_MS,
        startedAt: now + 3 * DAY_MS,
        organizationId: "org-devopscorner",
        createdBy: "user-admin",
        createdAt: now,
        updatedAt: now,
      },
      // 2. API Latency Degradation (resolved ~22h ago)
      {
        id: "incident-api-latency",
        statusPageId,
        title: "API Latency Degradation",
        impact: "minor",
        status: "resolved",
        message: "We are investigating reports of increased API response times.",
        affectedMonitorIds: [],
        updates: [
          {
            id: "update-1",
            status: "investigating",
            message: "We are investigating reports of increased API response times.",
            createdBy: "user-admin",
            createdAt: now - 24 * HOUR_MS,
          },
          {
            id: "update-2",
            status: "identified",
            message: "The issue has been identified as a database connection pool saturation.",
            createdBy: "user-admin",
            createdAt: now - 23.5 * HOUR_MS,
          },
          {
            id: "update-3",
            status: "resolved",
            message: "The issue has been resolved. Connection pool limits have been increased.",
            createdBy: "user-admin",
            createdAt: now - 22 * HOUR_MS,
          },
        ],
        isScheduledMaintenance: false,
        startedAt: now - 24 * HOUR_MS,
        resolvedAt: now - 22 * HOUR_MS,
        organizationId: "org-devopscorner",
        createdBy: "user-admin",
        createdAt: now - 24 * HOUR_MS,
        updatedAt: now - 22 * HOUR_MS,
      },
      // 3. Authentication Service Outage (resolved 7 days ago)
      {
        id: "incident-auth-outage",
        statusPageId,
        title: "Authentication Service Outage",
        impact: "major",
        status: "resolved",
        message: "Users were unable to log in to the platform.",
        affectedMonitorIds: [],
        updates: [
          {
            id: "auth-1",
            status: "investigating",
            message: "We are aware of issues affecting user authentication.",
            createdBy: "user-admin",
            createdAt: now - 7 * DAY_MS,
          },
          {
            id: "auth-2",
            status: "identified",
            message: "The root cause has been identified as a misconfigured load balancer.",
            createdBy: "user-admin",
            createdAt: now - 7 * DAY_MS + 20 * MIN_MS,
          },
          {
            id: "auth-3",
            status: "monitoring",
            message: "A fix has been deployed and we are monitoring the situation.",
            createdBy: "user-admin",
            createdAt: now - 7 * DAY_MS + 35 * MIN_MS,
          },
          {
            id: "auth-4",
            status: "resolved",
            message: "The incident has been fully resolved. All services are operational.",
            createdBy: "user-admin",
            createdAt: now - 7 * DAY_MS + 45 * MIN_MS,
          },
        ],
        isScheduledMaintenance: false,
        startedAt: now - 7 * DAY_MS,
        resolvedAt: now - 7 * DAY_MS + 45 * MIN_MS,
        organizationId: "org-devopscorner",
        createdBy: "user-admin",
        createdAt: now - 7 * DAY_MS,
        updatedAt: now - 7 * DAY_MS + 45 * MIN_MS,
      },
    ];
  }

  // Generic incidents for other status pages
  const incidents: Incident[] = [];
  const impacts: IncidentImpact[] = ["minor", "minor", "major", "critical"];
  const statuses: IncidentStatus[] = ["resolved", "resolved", "monitoring", "investigating"];
  const titles = [
    "API Response Delays",
    "Database Connection Issues",
    "Scheduled Maintenance",
    "Authentication Service Degradation",
    "CDN Outage",
  ];

  for (let i = 0; i < count; i++) {
    const impact = impacts[i % impacts.length];
    const status = statuses[i % statuses.length];
    const isScheduled = i === 2;
    const startedAt = now - (i + 1) * DAY_MS;

    incidents.push({
      id: `incident-${statusPageId}-${i}`,
      statusPageId,
      title: titles[i % titles.length],
      impact,
      status: isScheduled ? "scheduled" : status,
      message: `We are ${status === "investigating" ? "currently investigating" : "monitoring"} this issue.`,
      affectedMonitorIds: [],
      updates: [
        {
          id: `update-1-${i}`,
          status: "investigating",
          message: "We are investigating reports of issues.",
          createdBy: "user-admin",
          createdAt: startedAt,
        },
        ...(status !== "investigating"
          ? [
              {
                id: `update-2-${i}`,
                status: status as IncidentStatus,
                message:
                  status === "resolved"
                    ? "The issue has been resolved."
                    : "We have identified the issue.",
                createdBy: "user-admin",
                createdAt: startedAt + 30 * MIN_MS,
              },
            ]
          : []),
      ],
      isScheduledMaintenance: isScheduled,
      scheduledStartAt: isScheduled ? now + DAY_MS : undefined,
      scheduledEndAt: isScheduled ? now + DAY_MS + 2 * HOUR_MS : undefined,
      startedAt,
      resolvedAt:
        status === "resolved" ? startedAt + 2 * HOUR_MS : undefined,
      organizationId: "org-devopscorner",
      createdBy: "user-admin",
      createdAt: startedAt,
      updatedAt: now,
    });
  }

  return incidents.sort((a, b) => b.createdAt - a.createdAt);
}

// ==================== API CLIENT ====================

export const statusPageApi = {
  /**
   * List status pages
   */
  async listStatusPages(
    query: ListStatusPagesQuery = {},
  ): Promise<PaginatedStatusPages> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pages = generateMockStatusPages(8);
      const page = query.page || 1;
      const pageSize = query.pageSize || 20;
      const total = pages.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const data = pages.slice(start, start + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    }

    const response = await collectorClient.get<{
      items: StatusPageResponse[];
      total: number;
      page: number;
      limit: number;
    }>(STATUS_PAGE_ENDPOINTS.BASE, {
      params: { page: query.page, limit: query.pageSize },
    });

    return {
      data: response.data.items.map(transformStatusPage),
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.limit,
      totalPages: Math.ceil(response.data.total / response.data.limit),
      hasNext: response.data.page * response.data.limit < response.data.total,
      hasPrevious: response.data.page > 1,
    };
  },

  /**
   * Get a status page by ID or slug
   */
  async getStatusPage(idOrSlug: string): Promise<StatusPage> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const pages = generateMockStatusPages(5);
      return (
        pages.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || {
          ...pages[0],
          id: idOrSlug,
        }
      );
    }

    const response = await collectorClient.get<StatusPageResponse>(
      STATUS_PAGE_ENDPOINTS.SINGLE(idOrSlug),
    );
    return transformStatusPage(response.data);
  },

  /**
   * Get a status page by slug (public endpoint)
   * Returns status page with embedded incidents
   */
  async getStatusPageBySlug(
    slug: string,
  ): Promise<{ statusPage: StatusPage; incidents: Incident[] }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const pages = generateMockStatusPages(5);
      const page = pages.find((p) => p.slug === slug) || { ...pages[0], slug };
      return {
        statusPage: page,
        incidents: generateMockIncidents(page.id, 5),
      };
    }

    const response = await collectorClient.get<
      StatusPageResponse & { incidents?: IncidentResponse[] }
    >(`/api/v2/public/status/${slug}`);
    const { incidents: rawIncidents, ...statusPageData } = response.data;
    return {
      statusPage: transformStatusPage(statusPageData as StatusPageResponse),
      incidents: (rawIncidents || []).map(transformIncident),
    };
  },

  /**
   * Create a status page
   */
  async createStatusPage(data: CreateStatusPageRequest): Promise<StatusPage> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();

      return {
        id: `statuspage-${now}`,
        title: data.title,
        slug: data.slug,
        description: data.description,
        isPublic: data.isPublic ?? true,
        overallStatus: "operational",
        branding: {
          brandColor: data.branding?.brandColor || "#10B981",
          ...data.branding,
        },
        display: {
          showUptimePercentage: true,
          showResponseTime: true,
          showIncidentHistory: true,
          showMaintenanceSchedule: true,
          allowSubscriptions: true,
          showLegend: true,
          uptimeRanges: [24, 7, 30, 90],
          historyDays: 90,
          ...data.display,
        },
        customDomainVerified: false,
        customDomainSsl: false,
        monitors: [],
        organizationId: "org-devopscorner",
        createdBy: "user-current",
        createdAt: now,
        updatedAt: now,
      };
    }

    const response = await collectorClient.post<StatusPageResponse>(
      STATUS_PAGE_ENDPOINTS.BASE,
      {
        title: data.title,
        slug: data.slug,
        description: data.description,
        is_public: data.isPublic,
        branding: data.branding,
        display: data.display,
      },
    );

    return transformStatusPage(response.data);
  },

  /**
   * Update a status page
   */
  async updateStatusPage(
    id: string,
    data: UpdateStatusPageRequest,
  ): Promise<StatusPage> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const pages = generateMockStatusPages(5);
      const page = pages[0];

      return {
        ...page,
        id,
        title: data.title || page.title,
        slug: data.slug || page.slug,
        description: data.description || page.description,
        isPublic: data.isPublic ?? page.isPublic,
        branding: { ...page.branding, ...data.branding },
        display: { ...page.display, ...data.display },
        updatedAt: Date.now(),
      };
    }

    const response = await collectorClient.put<StatusPageResponse>(
      STATUS_PAGE_ENDPOINTS.SINGLE(id),
      {
        title: data.title,
        slug: data.slug,
        description: data.description,
        is_public: data.isPublic,
        branding: data.branding,
        display: data.display,
        monitors: data.monitors,
      },
    );

    return transformStatusPage(response.data);
  },

  /**
   * Delete a status page
   */
  async deleteStatusPage(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.delete(STATUS_PAGE_ENDPOINTS.SINGLE(id));
  },

  /**
   * Add a monitor to status page
   */
  async addMonitor(
    statusPageId: string,
    data: AddMonitorRequest,
  ): Promise<StatusPage> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const pages = generateMockStatusPages(5);
      const page = pages[0];

      return {
        ...page,
        id: statusPageId,
        monitors: [
          ...page.monitors,
          {
            monitorId: data.monitorId,
            displayName: data.displayName,
            description: data.description,
            displayOrder: data.displayOrder || page.monitors.length + 1,
            groupName: data.groupName,
            isVisible: data.isVisible ?? true,
          },
        ],
        updatedAt: Date.now(),
      };
    }

    const response = await collectorClient.post<StatusPageResponse>(
      STATUS_PAGE_ENDPOINTS.MONITORS(statusPageId),
      {
        monitor_id: data.monitorId,
        display_name: data.displayName,
        description: data.description,
        display_order: data.displayOrder,
        group_name: data.groupName,
        is_visible: data.isVisible,
      },
    );

    return transformStatusPage(response.data);
  },

  /**
   * Remove a monitor from status page
   */
  async removeMonitor(statusPageId: string, monitorId: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.delete(
      STATUS_PAGE_ENDPOINTS.MONITOR(statusPageId, monitorId),
    );
  },

  /**
   * List incidents for a status page
   */
  async listIncidents(
    statusPageId: string,
    query: ListIncidentsQuery = {},
  ): Promise<Incident[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let incidents = generateMockIncidents(statusPageId, 10);

      if (query.status) {
        incidents = incidents.filter((i) => i.status === query.status);
      }
      if (query.limit) {
        incidents = incidents.slice(0, query.limit);
      }

      return incidents;
    }

    const response = await collectorClient.get<IncidentResponse[]>(
      STATUS_PAGE_ENDPOINTS.INCIDENTS(statusPageId),
      {
        params: { status: query.status, limit: query.limit },
      },
    );

    return response.data.map(transformIncident);
  },

  /**
   * Create an incident
   */
  async createIncident(
    statusPageId: string,
    data: CreateIncidentRequest,
  ): Promise<Incident> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();

      return {
        id: `incident-${now}`,
        statusPageId,
        title: data.title,
        impact: data.impact,
        status: data.isScheduledMaintenance ? "scheduled" : "investigating",
        message: data.message,
        affectedMonitorIds: data.affectedMonitorIds || [],
        updates: [
          {
            id: `update-${now}`,
            status: "investigating",
            message: data.message || "We are investigating this issue.",
            createdBy: "user-current",
            createdAt: now,
          },
        ],
        isScheduledMaintenance: data.isScheduledMaintenance || false,
        scheduledStartAt: data.scheduledStartAt
          ? new Date(data.scheduledStartAt).getTime()
          : undefined,
        scheduledEndAt: data.scheduledEndAt
          ? new Date(data.scheduledEndAt).getTime()
          : undefined,
        startedAt: now,
        organizationId: "org-devopscorner",
        createdBy: "user-current",
        createdAt: now,
        updatedAt: now,
      };
    }

    const response = await collectorClient.post<IncidentResponse>(
      STATUS_PAGE_ENDPOINTS.INCIDENTS(statusPageId),
      {
        title: data.title,
        impact: data.impact,
        message: data.message,
        affected_monitor_ids: data.affectedMonitorIds,
        is_scheduled_maintenance: data.isScheduledMaintenance,
        scheduled_start_at: data.scheduledStartAt,
        scheduled_end_at: data.scheduledEndAt,
      },
    );

    return transformIncident(response.data);
  },

  /**
   * Update an incident
   */
  async updateIncident(
    statusPageId: string,
    incidentId: string,
    data: UpdateIncidentRequest,
  ): Promise<Incident> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const incidents = generateMockIncidents(statusPageId, 5);
      const incident = incidents[0];

      return {
        ...incident,
        id: incidentId,
        title: data.title || incident.title,
        impact: data.impact || incident.impact,
        message: data.message || incident.message,
        updatedAt: Date.now(),
      };
    }

    const response = await collectorClient.put<IncidentResponse>(
      STATUS_PAGE_ENDPOINTS.INCIDENT(statusPageId, incidentId),
      {
        title: data.title,
        impact: data.impact,
        message: data.message,
      },
    );

    return transformIncident(response.data);
  },

  /**
   * Add an update to an incident
   */
  async addIncidentUpdate(
    statusPageId: string,
    incidentId: string,
    data: IncidentUpdateRequest,
  ): Promise<Incident> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const incidents = generateMockIncidents(statusPageId, 5);
      const incident = incidents[0];
      const now = Date.now();

      return {
        ...incident,
        id: incidentId,
        status: data.status,
        updates: [
          ...incident.updates,
          {
            id: `update-${now}`,
            status: data.status,
            message: data.message,
            createdBy: "user-current",
            createdAt: now,
          },
        ],
        resolvedAt: data.status === "resolved" ? now : incident.resolvedAt,
        updatedAt: now,
      };
    }

    const response = await collectorClient.post<IncidentResponse>(
      STATUS_PAGE_ENDPOINTS.INCIDENT_UPDATES(statusPageId, incidentId),
      {
        status: data.status,
        message: data.message,
      },
    );

    return transformIncident(response.data);
  },

  /**
   * Resolve an incident
   */
  async resolveIncident(
    statusPageId: string,
    incidentId: string,
  ): Promise<Incident> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const incidents = generateMockIncidents(statusPageId, 5);
      const incident = incidents[0];
      const now = Date.now();

      return {
        ...incident,
        id: incidentId,
        status: "resolved",
        resolvedAt: now,
        updates: [
          ...incident.updates,
          {
            id: `update-${now}`,
            status: "resolved",
            message: "This incident has been resolved.",
            createdBy: "user-current",
            createdAt: now,
          },
        ],
        updatedAt: now,
      };
    }

    const response = await collectorClient.post<IncidentResponse>(
      STATUS_PAGE_ENDPOINTS.INCIDENT_RESOLVE(statusPageId, incidentId),
    );

    return transformIncident(response.data);
  },

  /**
   * Subscribe to status page updates (public, by slug)
   */
  async subscribePublic(
    slug: string,
    data: SubscribeRequest,
  ): Promise<{ message: string; subscription_type: string }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        message: "Subscription created",
        subscription_type: data.subscription_type || "email",
      };
    }

    const response = await collectorClient.post<{
      message: string;
      subscription_type: string;
    }>(STATUS_PAGE_ENDPOINTS.PUBLIC_SUBSCRIBE(slug), {
      email: data.email,
      webhook_url: data.webhook_url,
      subscription_type: data.subscription_type || "email",
      notificationType: data.notificationType,
      monitorIds: data.monitorIds,
      recaptcha_token: data.recaptcha_token,
    });
    return response.data;
  },

  /**
   * List subscribers for a status page (admin, authenticated)
   */
  async listSubscribers(
    statusPageId: string,
    confirmedOnly?: boolean,
  ): Promise<{ data: Subscriber[]; total: number }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // TelemetryFlow Status page subscribers match backend seed
      if (statusPageId === "statuspage-telemetryflow") {
        const now = Date.now();
        const subscribers: Subscriber[] = [
          {
            id: "sub-devops-email",
            statusPageId,
            email: "devops@telemetryflow.id",
            subscriptionType: "email",
            isConfirmed: true,
            notificationType: "all",
            confirmedAt: now - 30 * 24 * 60 * 60 * 1000,
            organizationId: "org-devopscorner",
            createdAt: now - 30 * 24 * 60 * 60 * 1000,
            updatedAt: now - 30 * 24 * 60 * 60 * 1000,
          },
          {
            id: "sub-alerts-email",
            statusPageId,
            email: "alerts@telemetryflow.id",
            subscriptionType: "email",
            isConfirmed: true,
            notificationType: "incidents_only",
            confirmedAt: now - 25 * 24 * 60 * 60 * 1000,
            organizationId: "org-devopscorner",
            createdAt: now - 25 * 24 * 60 * 60 * 1000,
            updatedAt: now - 25 * 24 * 60 * 60 * 1000,
          },
          {
            id: "sub-maintenance-email",
            statusPageId,
            email: "maintenance@telemetryflow.id",
            subscriptionType: "email",
            isConfirmed: true,
            notificationType: "maintenance_only",
            confirmedAt: now - 20 * 24 * 60 * 60 * 1000,
            organizationId: "org-devopscorner",
            createdAt: now - 20 * 24 * 60 * 60 * 1000,
            updatedAt: now - 20 * 24 * 60 * 60 * 1000,
          },
          {
            id: "sub-slack-webhook",
            statusPageId,
            webhookUrl: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXX",
            subscriptionType: "webhook",
            isConfirmed: true,
            notificationType: "all",
            confirmedAt: now - 15 * 24 * 60 * 60 * 1000,
            organizationId: "org-devopscorner",
            createdAt: now - 15 * 24 * 60 * 60 * 1000,
            updatedAt: now - 15 * 24 * 60 * 60 * 1000,
          },
        ];
        const filtered = confirmedOnly ? subscribers.filter((s) => s.isConfirmed) : subscribers;
        return { data: filtered, total: filtered.length };
      }

      return { data: [], total: 0 };
    }

    const response = await collectorClient.get<{
      data: SubscriberResponse[];
      total: number;
    }>(STATUS_PAGE_ENDPOINTS.SUBSCRIBERS(statusPageId), {
      params: confirmedOnly !== undefined ? { confirmedOnly: String(confirmedOnly) } : {},
    });
    return {
      data: response.data.data.map(transformSubscriber),
      total: response.data.total,
    };
  },

  /**
   * Add a subscriber (admin, authenticated)
   */
  async addSubscriber(
    statusPageId: string,
    data: SubscribeRequest,
  ): Promise<Subscriber> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();
      return {
        id: `sub-${now}`,
        statusPageId,
        email: data.email,
        webhookUrl: data.webhook_url,
        subscriptionType: data.subscription_type || "email",
        isConfirmed: true,
        notificationType: data.notificationType || "all",
        organizationId: "org-devopscorner",
        createdAt: now,
        updatedAt: now,
      };
    }

    const response = await collectorClient.post<SubscriberResponse>(
      STATUS_PAGE_ENDPOINTS.SUBSCRIBERS(statusPageId),
      {
        email: data.email,
        webhook_url: data.webhook_url,
        subscription_type: data.subscription_type || "email",
        notificationType: data.notificationType,
        monitorIds: data.monitorIds,
      },
    );
    return transformSubscriber(response.data);
  },

  /**
   * Remove a subscriber (admin, authenticated)
   */
  async removeSubscriber(
    statusPageId: string,
    subscriberId: string,
  ): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.delete(
      STATUS_PAGE_ENDPOINTS.SUBSCRIBER(statusPageId, subscriberId),
    );
  },
};

export default statusPageApi;
