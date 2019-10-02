import { CustomError } from "ts-custom-error";

type ExactInner<T> = <D>() => (D extends T ? D : D);
type Exact<T> = ExactInner<T> & T;

export type ValidatorFunction<T> = (key: string, data: unknown) => data is Exact<T>;
export type RetrieveFunction<T> = (data: unknown) => Exact<T> | null;

export type ObjectValidator<T> = {
  [P in keyof T]-?: ValidatorFunction<T[P]>;
};

export class ValidationError extends CustomError {
  public constructor(public readonly key: string, public readonly cause: string | ValidationError[], data: unknown) {
    super(Array.isArray(cause) ? cause.map(e => e.message).join("\n") : `${key} is not ${cause}: ${JSON.stringify(data)}`);
  }
}

function type(key: string, data: unknown, type: "string" | "number" | "boolean" | "undefined"): data is Exact<boolean> {
  if (typeof data === type) {
    return true;
  }

  throw new ValidationError(key, type, data);
}

export function string(key: string, data: unknown): data is Exact<string> {
  return type(key, data, "string");
}

export function number(key: string, data: unknown): data is Exact<number> {
  return type(key, data, "number");
}

export function boolean(key: string, data: unknown): data is Exact<boolean> {
  return type(key, data, "boolean");
}

export function nullable(key: string, data: unknown): data is Exact<null> {
  if (data === null) {
    return true;
  }

  throw new ValidationError(key, "null", data);
}

export function undefinedable(key: string, data: unknown): data is Exact<undefined> {
  return type(key, data, "undefined");
}

export function literal<T>(literal: T): ValidatorFunction<T> {
  return (key: string, data: unknown): data is Exact<T> => {
    if (data === literal) {
      return true;
    }

    throw new ValidationError(key, JSON.stringify(literal), data);
  };
}

export function array<T>(validator: ValidatorFunction<T>): ValidatorFunction<T[]> {
  return (key: string, data: unknown): data is Exact<T[]> => {
    if (!Array.isArray(data)) {
      throw new ValidationError(key, "array", data);
    }

    const errors: ValidationError[] = [];
    for (const i in data) {
      try {
        validator(`${key}[${i}]`, data[i]);
      } catch (e) {
        errors.push(e);
      }
    }

    if (errors.length === 0) {
      return true;
    }

    throw new ValidationError(key, errors, data);
  };
}

export function object<T>(validator: ObjectValidator<T>): ValidatorFunction<T> {
  return (key: string, data: unknown): data is Exact<T> => {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      throw new ValidationError(key, "object", data);
    }

    const errors: ValidationError[] = [];
    for (const i in validator) {
      try {
        validator[i](`${key}.${i}`, (data as any)[i]);
      } catch (e) {
        errors.push(e);
      }
    }

    if (errors.length === 0) {
      return true;
    }

    throw new ValidationError(key, errors, data);
  };
}

export function nullOr<T>(validator: ValidatorFunction<T>): ValidatorFunction<T | null> {
  return (key: string, data: unknown): data is Exact<T | null> => {
    if (data === null) {
      return true;
    }

    try {
      return validator(key, data);
    } catch (e) {
      throw new ValidationError(key, `${e.cause} | null`, data);
    }
  };
}

export function undefinedOr<T>(validator: ValidatorFunction<T>): ValidatorFunction<T | undefined> {
  return (key: string, data: unknown): data is Exact<T | undefined> => {
    if (data === undefined) {
      return true;
    }

    try {
      return validator(key, data);
    } catch (e) {
      throw new ValidationError(key, `${e.cause} | undefined`, data);
    }
  };
}

export function valueOf<T>(validator: ValidatorFunction<T>): RetrieveFunction<T> {
  return (data: unknown): Exact<T> | null => {
    try {
      return validator(".", data) ? data : null;
    } catch (e) {
      return null;
    }
  };
}

export function union<T1>(v1: ValidatorFunction<T1>): ValidatorFunction<T1>
export function union<T1, T2>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>): ValidatorFunction<T1 | T2>
export function union<T1, T2, T3>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>): ValidatorFunction<T1 | T2 | T3>
export function union<T1, T2, T3, T4>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>): ValidatorFunction<T1 | T2 | T3 | T4>
export function union<T1, T2, T3, T4, T5>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>): ValidatorFunction<T1 | T2 | T3 | T4 | T5>
export function union<T1, T2, T3, T4, T5, T6>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>): ValidatorFunction<T1 | T2 | T3 | T4 | T5 | T6>
export function union<T1, T2, T3, T4, T5, T6, T7>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>): ValidatorFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7 >
export function union<T1, T2, T3, T4, T5, T6, T7, T8>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>, v8?: ValidatorFunction<T8>): ValidatorFunction<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8> {
  const validators = [v1, v2, v3, v4, v5, v6, v7, v8];
  return (key: string, data: unknown): data is Exact<any> => {
    const errors: ValidationError[] = [];
    for (const i in validators) {
      try {
        const validator = validators[i];
        if (validator === undefined) {
          continue;
        }
        validator(`${key}`, data);
        return true;
      } catch (e) {
        errors.push(e);
      }
    }

    throw new ValidationError(key, errors.map(e => e.cause).join(" | "), data);
  };
}

export function tuple<T1>(v1: ValidatorFunction<T1>): ValidatorFunction<[T1]>
export function tuple<T1, T2>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>): ValidatorFunction<[T1, T2]>
export function tuple<T1, T2, T3>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>): ValidatorFunction<[T1, T2, T3]>
export function tuple<T1, T2, T3, T4>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>): ValidatorFunction<[T1, T2, T3, T4]>
export function tuple<T1, T2, T3, T4, T5>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>): ValidatorFunction<[T1, T2, T3, T4, T5]>
export function tuple<T1, T2, T3, T4, T5, T6>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>): ValidatorFunction<[T1, T2, T3, T4, T5, T6]>
export function tuple<T1, T2, T3, T4, T5, T6, T7>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>): ValidatorFunction<[T1, T2, T3, T4, T5, T6, T7]>
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>, v8?: ValidatorFunction<T8>): ValidatorFunction<[T1, T2, T3, T4, T5, T6, T7, T8]>
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8>(v1: ValidatorFunction<T1>, v2?: ValidatorFunction<T2>, v3?: ValidatorFunction<T3>, v4?: ValidatorFunction<T4>, v5?: ValidatorFunction<T5>, v6?: ValidatorFunction<T6>, v7?: ValidatorFunction<T7>, v8?: ValidatorFunction<T8>, never?: never): ValidatorFunction<any> {
  const validators = [v1, v2, v3, v4, v5, v6, v7, v8];
  return (key: string, data: unknown): data is Exact<any> => {
    if (!Array.isArray(data)) {
      throw new ValidationError(key, "tuple", data);
    }

    const errors: ValidationError[] = [];
    for (const i in validators) {
      try {
        const validator = validators[i];
        if (validator === undefined) {
          continue;
        }
        validator(`${key}[${i}]`, data[i]);
      } catch (e) {
        errors.push(e);
      }
    }

    if (errors.length === 0) {
      return true;
    }

    throw new ValidationError(key, errors, data);
  };
}

