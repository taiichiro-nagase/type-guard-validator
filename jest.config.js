module.exports = {
  transform: {
    ".[jt]s": "ts-jest"
  },
  testRegex: "\\.spec\\.ts$",
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  collectCoverage: true,
  globals: {
    "ts-jest": {
      diagnostics: {
        ignoreCodes: [151001]
      }
    }
  }
};
