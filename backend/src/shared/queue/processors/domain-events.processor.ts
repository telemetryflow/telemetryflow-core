import { Injectable, Logger, Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { BaseProcessor } from "./base.processor";
import {
  JobData,
  QUEUE_SERVICE,
  QUEUE_NAMES,
} from "../interfaces/queue.interface";
import { QueueService } from "../queue.service";
import { NotificationJobType } from "./notifications.processor";
import { AlertJobType } from "./alerts.processor";

/**
 * Domain Events Job Types
 */
export enum DomainEventJobType {
  // User events
  USER_CREATED = "domain.user.created",
  USER_UPDATED = "domain.user.updated",
  USER_DELETED = "domain.user.deleted",
  USER_ACTIVATED = "domain.user.activated",
  USER_DEACTIVATED = "domain.user.deactivated",

  // Organization events
  ORGANIZATION_CREATED = "domain.organization.created",
  ORGANIZATION_UPDATED = "domain.organization.updated",
  ORGANIZATION_DELETED = "domain.organization.deleted",

  // Agent events
  AGENT_REGISTERED = "domain.agent.registered",
  AGENT_UPDATED = "domain.agent.updated",
  AGENT_DEREGISTERED = "domain.agent.deregistered",
  AGENT_HEALTH_CHANGED = "domain.agent.health_changed",

  // Kubernetes events
  CLUSTER_REGISTERED = "domain.k8s.cluster_registered",
  CLUSTER_UPDATED = "domain.k8s.cluster_updated",
  CLUSTER_DEREGISTERED = "domain.k8s.cluster_deregistered",

  // VM events
  VM_REGISTERED = "domain.vm.registered",
  VM_UPDATED = "domain.vm.updated",
  VM_DEREGISTERED = "domain.vm.deregistered",

  // Generic
  GENERIC_EVENT = "domain.generic",
}

/**
 * Domain Events Processor
 * Handles asynchronous processing of domain events for event sourcing and notifications
 */
@Injectable()
export class DomainEventsProcessor extends BaseProcessor {
  protected readonly logger = new Logger(DomainEventsProcessor.name);
  protected readonly processorName = "DomainEventsProcessor";

  constructor(
    @Inject(QUEUE_SERVICE)
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<void> {
    this.validateJobData(job);
    const correlationId = this.getCorrelationId(job);

    this.logger.debug(`Processing domain event job ${job.id}`, {
      type: job.data.type,
      correlationId,
    });

    // Process based on event category
    const eventType = job.data.type;

    if (eventType.startsWith("domain.user.")) {
      await this.processUserEvent(job);
    } else if (eventType.startsWith("domain.organization.")) {
      await this.processOrganizationEvent(job);
    } else if (eventType.startsWith("domain.agent.")) {
      await this.processAgentEvent(job);
    } else if (eventType.startsWith("domain.k8s.")) {
      await this.processKubernetesEvent(job);
    } else if (eventType.startsWith("domain.vm.")) {
      await this.processVMEvent(job);
    } else {
      await this.processGenericEvent(job);
    }

    this.onComplete(job);
  }

  private async processUserEvent(job: Job<JobData>): Promise<void> {
    const { userId, action, metadata } = job.data.payload as {
      userId: string;
      action: string;
      metadata?: Record<string, unknown>;
    };

    this.logger.debug(`Processing user event: ${action}`, { userId, metadata });

    try {
      switch (job.data.type) {
        case DomainEventJobType.USER_CREATED:
          // Send welcome email
          await this.queueService.addJob(QUEUE_NAMES.NOTIFICATIONS, {
            type: NotificationJobType.SEND_WELCOME,
            payload: {
              userId,
              email: metadata?.email,
              firstName: metadata?.firstName,
              organizationName: metadata?.organizationName,
            },
            metadata: job.data.metadata,
          });
          this.logger.log(`Welcome email queued for user ${userId}`);
          break;

        case DomainEventJobType.USER_DEACTIVATED:
          // Send deactivation notification
          await this.queueService.addJob(QUEUE_NAMES.NOTIFICATIONS, {
            type: NotificationJobType.SEND_EMAIL,
            payload: {
              to: metadata?.email,
              subject: "Account Deactivated",
              template: "user-deactivated",
              context: { userId, reason: metadata?.reason },
            },
            metadata: job.data.metadata,
          });
          this.logger.log(
            `Deactivation notification queued for user ${userId}`,
          );
          break;

        default:
          this.logger.debug(`No specific handler for user event: ${action}`);
      }

      // Audit logging for all user events
      this.logger.log(`User event processed: ${action} for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processOrganizationEvent(job: Job<JobData>): Promise<void> {
    const { organizationId, action, metadata } = job.data.payload as {
      organizationId: string;
      action: string;
      metadata?: Record<string, unknown>;
    };

    this.logger.debug(`Processing organization event: ${action}`, {
      organizationId,
      metadata,
    });

    try {
      switch (job.data.type) {
        case DomainEventJobType.ORGANIZATION_CREATED:
          // Initialize default resources (workspaces, default policies, etc.)
          this.logger.log(
            `Initializing default resources for organization ${organizationId}`,
          );

          // In production, this would:
          // - Create default workspace
          // - Set up default retention policies
          // - Initialize default dashboards
          // - Configure default alert rules
          break;

        case DomainEventJobType.ORGANIZATION_DELETED:
          // Cleanup organization resources
          this.logger.log(
            `Cleaning up resources for organization ${organizationId}`,
          );

          // In production, this would:
          // - Delete telemetry data
          // - Remove alert rules
          // - Delete dashboards
          // - Clean up user associations
          break;

        default:
          this.logger.debug(
            `No specific handler for organization event: ${action}`,
          );
      }

      this.logger.log(
        `Organization event processed: ${action} for org ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process organization event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processAgentEvent(job: Job<JobData>): Promise<void> {
    const { agentId, action, metadata } = job.data.payload as {
      agentId: string;
      action: string;
      metadata?: Record<string, unknown>;
    };

    this.logger.debug(`Processing agent event: ${action}`, {
      agentId,
      metadata,
    });

    try {
      switch (job.data.type) {
        case DomainEventJobType.AGENT_HEALTH_CHANGED: {
          const health = metadata?.health as string;

          if (health === "unhealthy" || health === "down") {
            await this.queueService.addJob(QUEUE_NAMES.ALERTS, {
              type: AlertJobType.FIRE_ALERT,
              payload: {
                ruleId: `agent-health-${agentId}`,
                ruleName: "Agent Health Alert",
                severity: "warning",
                value: 0,
                condition: {
                  type: "threshold",
                  metric: "agent.health",
                  operator: "==",
                  value: 0,
                  duration: 1,
                },
                labels: {
                  agent_id: agentId,
                  agent_name: metadata?.name as string,
                  health,
                },
              },
              metadata: job.data.metadata,
            });

            this.logger.log(`Alert queued for unhealthy agent ${agentId}`);
          }
          break;
        }

        default:
          this.logger.debug(`No specific handler for agent event: ${action}`);
      }

      this.logger.log(`Agent event processed: ${action} for agent ${agentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process agent event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processKubernetesEvent(job: Job<JobData>): Promise<void> {
    const { clusterId, action, metadata } = job.data.payload as {
      clusterId: string;
      action: string;
      metadata?: Record<string, unknown>;
    };

    this.logger.debug(`Processing Kubernetes event: ${action}`, {
      clusterId,
      metadata,
    });

    try {
      switch (job.data.type) {
        case DomainEventJobType.CLUSTER_REGISTERED:
          // Sync cluster resources
          this.logger.log(`Syncing resources for cluster ${clusterId}`);

          // In production, this would:
          // - Start polling cluster API
          // - Discover workloads (deployments, pods, services)
          // - Set up default monitors
          // - Initialize metrics collection
          break;

        case DomainEventJobType.CLUSTER_DEREGISTERED:
          // Cleanup cluster resources
          this.logger.log(`Cleaning up resources for cluster ${clusterId}`);

          // In production, this would:
          // - Stop polling cluster API
          // - Delete cluster-specific monitors
          // - Archive telemetry data
          break;

        default:
          this.logger.debug(
            `No specific handler for Kubernetes event: ${action}`,
          );
      }

      this.logger.log(
        `Kubernetes event processed: ${action} for cluster ${clusterId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process Kubernetes event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processVMEvent(job: Job<JobData>): Promise<void> {
    const { vmId, action, metadata } = job.data.payload as {
      vmId: string;
      action: string;
      metadata?: Record<string, unknown>;
    };

    this.logger.debug(`Processing VM event: ${action}`, { vmId, metadata });

    try {
      switch (job.data.type) {
        case DomainEventJobType.VM_REGISTERED:
          // Setup monitoring for VM
          this.logger.log(`Setting up monitoring for VM ${vmId}`);

          // In production, this would:
          // - Install/configure monitoring agent
          // - Set up default metrics collection
          // - Create default dashboards
          // - Initialize health checks
          break;

        case DomainEventJobType.VM_DEREGISTERED:
          // Cleanup VM monitoring
          this.logger.log(`Cleaning up monitoring for VM ${vmId}`);

          // In production, this would:
          // - Stop metrics collection
          // - Remove health checks
          // - Archive VM data
          break;

        default:
          this.logger.debug(`No specific handler for VM event: ${action}`);
      }

      this.logger.log(`VM event processed: ${action} for VM ${vmId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process VM event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processGenericEvent(job: Job<JobData>): Promise<void> {
    this.logger.debug(`Processing generic event: ${job.data.type}`, {
      payload: job.data.payload,
    });
  }
}
