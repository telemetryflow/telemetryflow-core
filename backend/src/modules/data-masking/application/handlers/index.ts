import { CreatePolicyHandler } from "./CreatePolicy.handler";
import { UpdatePolicyHandler } from "./UpdatePolicy.handler";
import { DeletePolicyHandler } from "./DeletePolicy.handler";
import { TogglePolicyHandler } from "./TogglePolicy.handler";
import { TestMaskingRuleHandler } from "./TestMaskingRule.handler";
import { GetPolicyHandler } from "./GetPolicy.handler";
import { ListPoliciesHandler } from "./ListPolicies.handler";

export const CommandHandlers = [
  CreatePolicyHandler,
  UpdatePolicyHandler,
  DeletePolicyHandler,
  TogglePolicyHandler,
  TestMaskingRuleHandler,
];

export const QueryHandlers = [GetPolicyHandler, ListPoliciesHandler];
