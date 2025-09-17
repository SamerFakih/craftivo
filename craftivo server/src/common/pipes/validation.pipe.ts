import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform<T = unknown>(
    value: T,
    { metatype }: ArgumentMetadata,
  ): Promise<T> {
    if (!metatype || !this.requiresValidation(metatype)) {
      return value;
    }
    const objectInstance = plainToInstance(
      metatype as new (...args: unknown[]) => unknown,
      value as object,
    );
    const errors = await validate(objectInstance as Record<string, unknown>);
    if (errors.length > 0) {
      const messages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .filter(Boolean);
      throw new BadRequestException(
        `Validation failed: ${messages.join('; ')}`,
      );
    }
    return value;
  }

  private requiresValidation(metatype: unknown): boolean {
    if (typeof metatype !== 'function') return false;
    const primitives: ReadonlyArray<
      | StringConstructor
      | BooleanConstructor
      | NumberConstructor
      | ArrayConstructor
      | ObjectConstructor
    > = [String, Boolean, Number, Array, Object];
    return !primitives.includes(
      metatype as
        | StringConstructor
        | BooleanConstructor
        | NumberConstructor
        | ArrayConstructor
        | ObjectConstructor,
    );
  }
}
