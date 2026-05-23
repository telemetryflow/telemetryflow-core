export class DeletePolicyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
