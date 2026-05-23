/**
 * @deprecated Use @/utils/telemetry/vm instead
 * This file is kept for backward compatibility only
 *
 * Migration guide:
 * - import { generateVirtualMachines } from '@/mocks/infra'
 * + import { generateVirtualMachines } from '@/utils/telemetry'
 */

export {
  generateVirtualMachine,
  generateVirtualMachines,
  generateVMTimeSeries,
} from "@/utils/telemetry/vm/generator";

// Re-export as infraMock for backward compatibility
import * as infraFunctions from "@/utils/telemetry/vm/generator";

export const infraMock = {
  generateVirtualMachines: infraFunctions.generateVirtualMachines,
  generateVirtualMachine: infraFunctions.generateVirtualMachine,
  generateVMTimeSeries: infraFunctions.generateVMTimeSeries,
};
