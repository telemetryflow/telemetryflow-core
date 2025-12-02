import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrganizationHandler } from '../CreateOrganization.handler';
import { CreateOrganizationCommand } from '../../commands/CreateOrganization.command';
import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';

describe('CreateOrganizationHandler', () => {
  let handler: CreateOrganizationHandler;
  let repository: jest.Mocked<IOrganizationRepository>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrganizationHandler,
        { provide: 'IOrganizationRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreateOrganizationHandler>(CreateOrganizationHandler);
    repository = module.get('IOrganizationRepository');
  });

  it('should create organization successfully', async () => {
    const command = new CreateOrganizationCommand(
      'DevOpsCorner',
      'devopscorner',
      'region-1',
      'DevOpsCorner Indonesia',
      'devopscorner.id'
    );

    const result = await handler.execute(command);

    expect(repository.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
