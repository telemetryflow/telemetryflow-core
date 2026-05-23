/**
 * @deprecated Use @/utils/telemetry/vm instead
 * This file is kept for backward compatibility only
 *
 * Migration guide:
 * - import { generateAgents } from '@/mocks/agent'
 * + import { generateAgents } from '@/utils/telemetry'
 */

export {
  generateAgents,
  generateK8sNodeAgent,
  generateVMAgent,
  generateAgentTimeSeries,
  getAgentSummary,
} from "@/utils/telemetry/vm/agent";

// Re-export as agentMock for backward compatibility
import * as agentFunctions from "@/utils/telemetry/vm/agent";

export const agentMock = {
  generateAgents: agentFunctions.generateAgents,
  generateAgentTimeSeries: agentFunctions.generateAgentTimeSeries,
  getAgentSummary: agentFunctions.getAgentSummary,
};
