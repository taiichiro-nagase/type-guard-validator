import { boolean, number, string, nullOr, undefinedOr, array, object, literal, union, tuple } from "../src/validator";

describe("validate", () => {
  it("validates correctly (string)", () => {
    expect(string("root", "")).toBe(true);
    expect(string("root", "string")).toBe(true);

    expect(() => string("root", null)).toThrowError("root is not string: null");
    expect(() => string("root", undefined)).toThrowError("root is not string: undefined");
    expect(() => string("root", 0)).toThrowError("root is not string: 0");
    expect(() => string("root", true)).toThrowError("root is not string: true");
    expect(() => string("root", {})).toThrowError("root is not string: {}");
    expect(() => string("root", [])).toThrowError("root is not string: []");
  });

  it("validates correctly (number)", () => {
    expect(number("root", 0)).toBe(true);
    expect(number("root", 1)).toBe(true);
    expect(number("root", -1)).toBe(true);

    expect(() => number("root", null)).toThrowError("root is not number: null");
    expect(() => number("root", undefined)).toThrowError("root is not number: undefined");
    expect(() => number("root", "a")).toThrowError("root is not number: \"a\"");
    expect(() => number("root", true)).toThrowError("root is not number: true");
    expect(() => number("root", {})).toThrowError("root is not number: {}");
    expect(() => number("root", [])).toThrowError("root is not number: []");
  });

  it("validates correctly (boolean)", () => {
    expect(boolean("root", true)).toBe(true);
    expect(boolean("root", false)).toBe(true);

    expect(() => boolean("root", null)).toThrowError("root is not boolean: null");
    expect(() => boolean("root", undefined)).toThrowError("root is not boolean: undefined");
    expect(() => boolean("root", 0)).toThrowError("root is not boolean: 0");
    expect(() => boolean("root", "a")).toThrowError("root is not boolean: \"a\"");
    expect(() => boolean("root", {})).toThrowError("root is not boolean: {}");
    expect(() => boolean("root", [])).toThrowError("root is not boolean: []");
  });

  it("validates correctly (object)", () => {
    interface Child {
      undefinedOrArrayOfUnionBooleanOrNumber: (boolean | number)[] | undefined;
      tupleOfBooleanOrLiteral: [boolean, true];
      optionalSring?: string;
    }
    interface Parent {
      string: string;
      nullOrNumber: number | null;
      undefinedOrBoolean: boolean | undefined;
      arrayOfString: string[];
      arrayOfNullOrBoolean: (boolean | null)[];
      literal: 1;
      unionLiteral: "http" | "https";
      children: Child[];
      tupleOfChildOrChildOrNull: [Child, Child | null];
    }

    const childValidator = object<Child>({
      undefinedOrArrayOfUnionBooleanOrNumber: undefinedOr(array(union(boolean, number))),
      tupleOfBooleanOrLiteral: tuple(boolean, literal(true)),
      optionalSring: undefinedOr(string)
    });
    const validator = object<Parent>({
      string: string,
      nullOrNumber: nullOr(number),
      undefinedOrBoolean: undefinedOr(boolean),
      arrayOfString: array(string),
      arrayOfNullOrBoolean: array(nullOr(boolean)),
      literal: literal(1),
      unionLiteral: union(literal("http"), literal("https")),
      children: array(childValidator),
      tupleOfChildOrChildOrNull: tuple(childValidator, nullOr(childValidator))
    });

    const data: Parent = {
      string: "a",
      nullOrNumber: 0,
      undefinedOrBoolean: true,
      arrayOfString: ["a", "b", "c"],
      arrayOfNullOrBoolean: [true, null, false],
      literal: 1,
      unionLiteral: "https",
      children: [{
        undefinedOrArrayOfUnionBooleanOrNumber: [true, 1, false, 0],
        tupleOfBooleanOrLiteral: [false, true],
        optionalSring: ""
      }],
      tupleOfChildOrChildOrNull: [{
        undefinedOrArrayOfUnionBooleanOrNumber: [true, 1, false, 0],
        tupleOfBooleanOrLiteral: [false, true],
        optionalSring: ""
      }, null]
    };

    expect(validator("root", data)).toBe(true);

    expect(() => validator("root", null)).toThrowError("root is not object: null");
    expect(() => validator("root", undefined)).toThrowError("root is not object: undefined");
    expect(() => validator("root", 0)).toThrowError("root is not object: 0");
    expect(() => validator("root", "a")).toThrowError("root is not object: \"a\"");
    expect(() => validator("root", true)).toThrowError("root is not object: true");
    expect(() => validator("root", [])).toThrowError("root is not object: []");
    expect(() => validator("root", { ...data, string: undefined })).toThrowError("root.string is not string: undefined");
    expect(() => validator("root", { ...data, unionLiteral: "test" })).toThrowError("root.unionLiteral is not \"http\" | \"https\": \"test\"");
    expect(() => validator("root", { ...data, tupleOfChildOrChildOrNull: [{}, undefined] })).toThrowError("root.tupleOfChildOrChildOrNull[0].tupleOfBooleanOrLiteral is not tuple: undefined\nroot.tupleOfChildOrChildOrNull[1] is not null or object: undefined");
  });

  it("validates correctly (array)", () => {
    expect(array(string)("root", [])).toBe(true);
    expect(array(string)("root", ["a", "b", "c"])).toBe(true);

    expect(() => array(string)("root", [1])).toThrowError("root[0] is not string: 1");
    expect(() => array(string)("root", [1, "a", true])).toThrowError("root[0] is not string: 1\nroot[2] is not string: true");
    expect(() => array(string)("root", null)).toThrowError("root is not array: null");
    expect(() => array(string)("root", undefined)).toThrowError("root is not array: undefined");
    expect(() => array(string)("root", 0)).toThrowError("root is not array: 0");
    expect(() => array(string)("root", "a")).toThrowError("root is not array: \"a\"");
    expect(() => array(string)("root", true)).toThrowError("root is not array: true");
    expect(() => array(string)("root", {})).toThrowError("root is not array: {}");
  });

  it("validates correctly (nullOr)", () => {
    expect(nullOr(string)("root", "a")).toBe(true);
    expect(nullOr(string)("root", null)).toBe(true);

    expect(() => nullOr(string)("root", undefined)).toThrowError("root is not null or string: undefined");
    expect(() => nullOr(string)("root", 0)).toThrowError("root is not null or string: 0");
    expect(() => nullOr(string)("root", true)).toThrowError("root is not null or string: true");
  });

  it("validates correctly (undefinedOr)", () => {
    expect(undefinedOr(number)("root", 0)).toBe(true);
    expect(undefinedOr(number)("root", undefined)).toBe(true);

    expect(() => undefinedOr(number)("root", null)).toThrowError("root is not undefined or number: null");
    expect(() => undefinedOr(number)("root", "a")).toThrowError("root is not undefined or number: \"a\"");
    expect(() => undefinedOr(number)("root", true)).toThrowError("root is not undefined or number: true");
  });

  it("validates correctly (union)", () => {
    expect(union(string, number)("root", "a")).toBe(true);
    expect(union(string, number)("root", 0)).toBe(true);

    expect(() => union(string, number)("root", null)).toThrowError("root is not string | number: null");
    expect(() => union(string, number)("root", undefined)).toThrowError("root is not string | number: undefined");
    expect(() => union(string, number)("root", true)).toThrowError("root is not string | number: true");
    expect(() => union(string, number)("root", {})).toThrowError("root is not string | number: {}");
    expect(() => union(string, number)("root", [])).toThrowError("root is not string | number: []");
  });

  it("validates correctly (tuple)", () => {
    expect(tuple(string, number)("root", ["a", 0])).toBe(true);

    expect(() => tuple(string, number)("root", null)).toThrowError("root is not tuple: null");
    expect(() => tuple(string, number)("root", undefined)).toThrowError("root is not tuple: undefined");
    expect(() => tuple(string, number)("root", true)).toThrowError("root is not tuple: true");
    expect(() => tuple(string, number)("root", {})).toThrowError("root is not tuple: {}");
    expect(() => tuple(string, number)("root", [])).toThrowError("root[0] is not string: undefined\nroot[1] is not number: undefined");
    expect(() => tuple(string, number)("root", [true, null])).toThrowError("root[0] is not string: true\nroot[1] is not number: null");
  });
});
