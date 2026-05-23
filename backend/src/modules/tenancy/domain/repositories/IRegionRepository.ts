import { Region } from "../aggregates/Region";
import { RegionId } from "../value-objects/RegionId";

export interface IRegionRepository {
  findAll(): Promise<Region[]>;
  findById(id: RegionId): Promise<Region | null>;
  findByCode(code: string): Promise<Region | null>;
  save(region: Region): Promise<void>;
  delete(id: RegionId): Promise<void>;
}
