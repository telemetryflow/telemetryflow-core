export class RotateApiKeyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly rotatedBy: string,
  ) {}
}
