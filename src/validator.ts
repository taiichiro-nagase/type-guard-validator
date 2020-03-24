import { CustomError } from 'ts-custom-error';

// https://github.com/microsoft/TypeScript/issues/12936#issuecomment-524631270
export type ExactInner<T> = <D>() => (D extends T ? D : D);
export type Exact<T> = ExactInner<T> & T;

export type ValidatorFunction<T> = (key: string, data: unknown) => asserts data is Exact<T>;
export type RetrieveFunction<T> = (data: unknown) => Exact<T> | null;
export type TypeCheckFunction<T> = (data: unknown) => data is Exact<T>;

export type ObjectValidator<T> = {
  [P in keyof T]-?: ValidatorFunction<T[P]>;
};

export class ValidationError extends CustomError {
  // eslint-disable-next-line max-len
  public constructor(public readonly key: string, public readonly cause: string | ValidationError[], data: unknown) {
    super(Array.isArray(cause) ? cause.map((e) => e.message).join('\n') : `${key} is not ${cause}: ${JSON.stringify(data)}`);
  }
}

function nullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// eslint-disable-next-line max-len
function toError<T>(validator: ValidatorFunction<T>, key: string, data: unknown): ValidationError | null {
  try {
    validator(key, data);
    return null;
  } catch (e) {
    return e;
  }
}

function primitive(key: string, data: unknown, type: 'string' | 'number' | 'boolean' | 'undefined'): asserts data is Exact<boolean> {
  if (typeof data !== type) { // eslint-disable-line valid-typeof
    throw new ValidationError(key, type, data);
  }
}

export function string(key: string, data: unknown): asserts data is Exact<string> {
  return primitive(key, data, 'string');
}

export function number(key: string, data: unknown): asserts data is Exact<number> {
  return primitive(key, data, 'number');
}

export function boolean(key: string, data: unknown): asserts data is Exact<boolean> {
  return primitive(key, data, 'boolean');
}

export function nullable(key: string, data: unknown): asserts data is Exact<null> {
  if (data !== null) {
    throw new ValidationError(key, 'null', data);
  }
}

export function undefinedable(key: string, data: unknown): asserts data is Exact<undefined> {
  return primitive(key, data, 'undefined');
}

export function literal<T>(value: T): ValidatorFunction<T> {
  return (key: string, data: unknown): asserts data is Exact<T> => {
    if (data !== value) {
      throw new ValidationError(key, JSON.stringify(value), data);
    }
  };
}

export function array<T>(validator: ValidatorFunction<T>): ValidatorFunction<T[]> {
  return (key: string, data: unknown): asserts data is Exact<T[]> => {
    if (!Array.isArray(data)) {
      throw new ValidationError(key, 'array', data);
    }

    const errors = data
      .map((value, i) => toError(validator, `${key}[${i}]`, value))
      .filter(nullOrUndefined);

    if (errors.length !== 0) {
      throw new ValidationError(key, errors, data);
    }
  };
}

export function object<T>(validator: ObjectValidator<T>): ValidatorFunction<T> {
  return (key: string, data: unknown): asserts data is Exact<T> => {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new ValidationError(key, 'object', data);
    }

    const errors = Object
      .keys(validator)
      .map((property) => toError((validator as any)[property], `${key}.${property}`, (data as any)[property]))
      .filter(nullOrUndefined);

    if (errors.length !== 0) {
      throw new ValidationError(key, errors, data);
    }
  };
}

export function nullOr<T>(validator: ValidatorFunction<T>): ValidatorFunction<T | null> {
  return (key: string, data: unknown): asserts data is Exact<T | null> => {
    if (data === null) {
      return;
    }

    try {
      validator(key, data);
    } catch (e) {
      throw new ValidationError(key, `${e.cause} | null`, data);
    }
  };
}

export function undefinedOr<T>(validator: ValidatorFunction<T>): ValidatorFunction<T | undefined> {
  return (key: string, data: unknown): asserts data is Exact<T | undefined> => {
    if (data === undefined) {
      return;
    }

    try {
      validator(key, data);
    } catch (e) {
      throw new ValidationError(key, `${e.cause} | undefined`, data);
    }
  };
}

export function valueOf<T>(validator: ValidatorFunction<T>): RetrieveFunction<T> {
  return (data: unknown): Exact<T> | null => {
    try {
      validator('.', data);
      return data;
    } catch (e) {
      return null;
    }
  };
}

export function typeOf<T>(validator: ValidatorFunction<T>): TypeCheckFunction<T> {
  return (data: unknown): data is Exact<T> => {
    try {
      validator('.', data);
      return true;
    } catch (e) {
      return false;
    }
  };
}

/* eslint-disable max-len */
export function union<T1>(v1: ValidatorFunction<T1>): ValidatorFunction<T1>;
export function union<T1, T2>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>): ValidatorFunction<T1 | T2>;
export function union<T1, T2, T3>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>): ValidatorFunction<T1 | T2 | T3>;
export function union<T1, T2, T3, T4>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>): ValidatorFunction<T1 | T2 | T3 | T4>;
export function union<T1, T2, T3, T4, T5>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>): ValidatorFunction<T1 | T2 | T3 | T4 | T5>;
export function union<T1, T2, T3, T4, T5, T6>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>): ValidatorFunction<T1 | T2 | T3 | T4 | T5 | T6>;
export function union<T1, T2, T3, T4, T5, T6, T7>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>): ValidatorFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7 >;
export function union<T1, T2, T3, T4, T5, T6, T7, T8>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>, v8?: ValidatorFunction<T8>): ValidatorFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8> {
  const validators = [v1, v2, v3, v4, v5, v6, v7, v8];
  return (key: string, data: unknown): asserts data is Exact<unknown> => {
    const errors = validators
      .filter(nullOrUndefined)
      .map((validator) => toError(validator, key, data))
      .filter(nullOrUndefined);

    if (errors.length === validators.filter(nullOrUndefined).length) {
      throw new ValidationError(key, errors.map((e) => e.cause).join(' | '), data);
    }
  };
}
/* eslint-enable max-len */

/* eslint-disable max-len */
export function tuple<T1>(v1: ValidatorFunction<T1>): ValidatorFunction<[T1]>;
export function tuple<T1, T2>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>): ValidatorFunction<[T1, T2]>;
export function tuple<T1, T2, T3>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>): ValidatorFunction<[T1, T2, T3]>;
export function tuple<T1, T2, T3, T4>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>): ValidatorFunction<[T1, T2, T3, T4]>;
export function tuple<T1, T2, T3, T4, T5>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>): ValidatorFunction<[T1, T2, T3, T4, T5]>;
export function tuple<T1, T2, T3, T4, T5, T6>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>): ValidatorFunction<[T1, T2, T3, T4, T5, T6]>;
export function tuple<T1, T2, T3, T4, T5, T6, T7>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>): ValidatorFunction<[T1, T2, T3, T4, T5, T6, T7]>;
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>, v8?: ValidatorFunction<T8>): ValidatorFunction<[T1, T2, T3, T4, T5, T6, T7, T8]>;
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>, v8?: ValidatorFunction<T8>, never?: never): ValidatorFunction<unknown> { // eslint-disable-line @typescript-eslint/no-unused-vars
  const validators = [v1, v2, v3, v4, v5, v6, v7, v8];
  return (key: string, data: unknown): asserts data is Exact<unknown> => {
    if (!Array.isArray(data)) {
      throw new ValidationError(key, 'tuple', data);
    }

    const errors = validators
      .filter(nullOrUndefined)
      .map((validator, i) => toError(validator, `${key}[${i}]`, data[i]))
      .filter(nullOrUndefined);

    if (errors.length !== 0) {
      throw new ValidationError(key, errors, data);
    }
  };
}
/* eslint-enable max-len */
