export class CreateRegionCommand {
  constructor(
    public readonly name: string,
    public readonly code: string,
    public readonly description: string,
  ) {}
}
