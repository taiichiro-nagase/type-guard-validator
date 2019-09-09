import { CustomError } from "ts-custom-error";

class ValidationError extends CustomError {
  public constructor(public readonly key: string, public readonly cause: string | ValidationError[], data: unknown) {
    super(Array.isArray(cause) ? cause.map(e => e.message).join("\n") : `${key} is not ${cause}: ${JSON.stringify(data)}`);
  }
}

export type ValidatorFunction<T> = (key: string, data: unknown) => data is Exact<T>;
export type ObjectValidator<T> = {
  [P in keyof T]-?: ValidatorFunction<T[P]>;
};

type ExactInner<T> = <D>() => (D extends T ? D : D);
type Exact<T> = ExactInner<T> & T;

function type(key: string, data: unknown, type: "string" | "number" | "boolean"): data is Exact<boolean> {
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
      throw new ValidationError(key, `null or ${e.cause}`, data);
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
      throw new ValidationError(key, `undefined or ${e.cause}`, data);
    }
  };
}

function innerUnion(...validators: ValidatorFunction<any>[]): ValidatorFunction<any> {
  return (key: string, data: unknown): data is Exact<any> => {
    const errors: ValidationError[] = [];
    for (const i in validators) {
      try {
        validators[i](`${key}`, data);
        return true;
      } catch (e) {
        errors.push(e);
      }
    }

    throw new ValidationError(key, errors.map(e => e.cause).join(" | "), data);
  };
}

function innerTuple(...validators: ValidatorFunction<any>[]): ValidatorFunction<any> {
  return (key: string, data: unknown): data is Exact<any> => {
    if (!Array.isArray(data)) {
      throw new ValidationError(key, "tuple", data);
    }

    const errors: ValidationError[] = [];
    for (const i in validators) {
      try {
        validators[i](`${key}[${i}]`, data[i]);
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

export function union<T1, T2>(validator1: ValidatorFunction<T1>, validator2: ValidatorFunction<T2>): ValidatorFunction<T1 | T2> {
  return innerUnion(validator1, validator2);
}

export function tuple<T1, T2>(validator1: ValidatorFunction<T1>, validator2: ValidatorFunction<T2>): ValidatorFunction<[T1, T2]> {
  return innerTuple(validator1, validator2);
}
