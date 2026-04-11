import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Drop-in Zod validation pipe for @Body()/@Query()/@Param() inputs.
 * Share schemas from @repo/validators so web, mobile, and API all validate identically.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          code: 'VALIDATION_FAILED',
          message: 'Input validation failed',
          details: err.flatten(),
        });
      }
      throw err;
    }
  }
}
