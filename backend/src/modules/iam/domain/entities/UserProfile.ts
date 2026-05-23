export class UserProfile {
  constructor(
    public firstName: string,
    public lastName: string,
    public avatar?: string,
    public timezone?: string,
    public locale?: string,
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
