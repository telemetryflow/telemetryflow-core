import { Region } from '../aggregates/Region';
import { RegionId } from '../value-objects/RegionId';

export interface IRegionRepository {
  save(region: Region): Promise<void>;
  findById(id: RegionId): Promise<Region | null>;
  findByCode(code: string): Promise<Region | null>;
  findAll(): Promise<Region[]>;
  delete(id: RegionId): Promise<void>;
}
