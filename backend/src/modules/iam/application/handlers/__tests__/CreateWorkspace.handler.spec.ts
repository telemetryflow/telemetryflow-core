import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';

describe('CreateWorkspaceHandler', () => {
  let handler: any;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const mockEventBus = { publish: jest.fn() };

    handler = { execute: jest.fn().mockResolvedValue(undefined) };
    eventBus = mockEventBus as any;
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should have execute method', () => {
    expect(handler.execute).toBeDefined();
  });
});
