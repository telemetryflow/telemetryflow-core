export class CreateGroupCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly organizationId?: string,
  ) {}
}
