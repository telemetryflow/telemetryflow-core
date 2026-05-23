import { BadRequestException } from "@nestjs/common";

export function validateStepParam(step: unknown): number {
  const num = Number(step);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1 || num > 86400) {
    throw new BadRequestException(
      "Invalid step value: must be a positive integer between 1 and 86400",
    );
  }
  return num;
}

export function validateIntervalParam(interval: unknown): number {
  const num = Number(interval);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1 || num > 86400) {
    throw new BadRequestException(
      "Invalid interval value: must be a positive integer between 1 and 86400",
    );
  }
  return num;
}
