# Type Guard Validator

![npm](https://img.shields.io/npm/v/type-guard-validator)
![GitHub](https://img.shields.io/github/license/taiichiro-nagase/type-guard-validator)
![CircleCI](https://img.shields.io/circleci/build/github/taiichiro-nagase/type-guard-validator/develop)
![Coveralls](https://img.shields.io/coveralls/github/taiichiro-nagase/type-guard-validator)

**type-guard-validator** provides type-safe & light-weight object validation by TypeScript [User-Defined Type Guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates).

```typescript
import { number, string, nullOr, undefinedOr, array, object, literal, union } from "type-guard-validator";

interface Message {
  timestamp: number;
  body: string;
}

interface User {
  id: string;
  role: "admin" | "user";
  email: string | null;
  messages: Message[];
}

const messageValidator = object<Message>({
  timestamp: number,
  body: string
});

const userValidator = object<User>({
  id: string,
  role: union(literal("admin"), literal("user")),
  email: nullOr(string),
  messages: array(messageValidator)
});
```

The validator can be defined based on `interface` or `type`.
The definition of a validator is checked as statically by TypeScript's type system and compiler reports errors if define wrong validation rule.
The validator behaves as a *type predicates* function.

```typescript
const response = {
  id: "taiichiro-nagase",
  role: "admin",
  email: "taiichiro.nagase@gmail.com",
  messages: []
};

if (userValidator(".", response)) {
  // `response` can behaves as `User` in this parenthesis
  console.log(`${response.id} is ${response.role}`); // output: taiichiro-nagase is admin
}
```

`ValidationError` is thrown if the validator detects type errors.

```typescript
const response = {
  id: "taiichiro-nagase",
  role: "unknown", // invalid role
  // email: "taiichiro.nagase@gmail.com", // missing `email` field
  messages: []
};

userValidator("response", response);

// ValidationError:
//   response.role is not "admin" | "user": "unknown"
//   response.email is not null or string: undefined
```

`typeOf` function returns `false` instead of throwing an error if validation failed.

```typescript
if (typeOf(userValidator)(response)) {
  // `response` can behaves as `User` in this parenthesis
  console.log(`${response.id} is ${response.role}`); // output: taiichiro-nagase is admin
} else {
  console.log("response is not user");
}
```

`valueOf` function returns actual value or null.

```typescript
const user = valueOf(userValudator)(response); // `user` is `User | null`
```

`assertOf` function behaves as assert function.

```typescript
assertOf(userValudator)(response);
// `response` can behaves as `User` after the function
```

### Prerequisites

Lowest TypeScript support starts at version 3.7.5

```bash
npm install --save-dev typescript@^3.7.5
```

### Installing

```bash
npm install type-guard-validator
```
