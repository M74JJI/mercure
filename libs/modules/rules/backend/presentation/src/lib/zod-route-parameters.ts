import 'reflect-metadata';

import { Param, Query } from '@nestjs/common';
import type { ZodDto } from 'nestjs-zod';

function withZodDesignType(decorator: ParameterDecorator, dto: ZodDto): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) {
      throw new Error('Zod route parameters can only decorate controller methods.');
    }

    decorator(target, propertyKey, parameterIndex);

    const current =
      (Reflect.getOwnMetadata('design:paramtypes', target, propertyKey) as
        readonly unknown[] | undefined) ?? [];
    const paramTypes = [...current];
    paramTypes[parameterIndex] = dto;
    Reflect.defineMetadata('design:paramtypes', paramTypes, target, propertyKey);
  };
}

export function ZodQuery(dto: ZodDto): ParameterDecorator {
  return withZodDesignType(Query(), dto);
}

export function ZodParam(dto: ZodDto): ParameterDecorator {
  return withZodDesignType(Param(), dto);
}
