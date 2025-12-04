export abstract class AggregateRoot<T> {
  protected _id: T;
  private _domainEvents: any[] = [];

  get id(): T {
    return this._id;
  }

  get domainEvents(): any[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: any): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
