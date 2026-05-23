import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class SafePathPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException("Path parameter is required");
    }
    const decoded = decodeURIComponent(value);
    const doubleDecoded = decodeURIComponent(decoded);

    const patterns = [value, decoded, doubleDecoded];
    for (const v of patterns) {
      if (v.includes("..") || v.includes("/") || v.includes("\\")) {
        throw new BadRequestException(
          `Path parameter contains invalid characters: ${value}`,
        );
      }
    }

    return value;
  }
}
