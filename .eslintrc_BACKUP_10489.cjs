// This is a CommonJS file used by ESLint
// We're using module.exports instead of export default

// @ts-nocheck
/* eslint-disable */

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true
  },
  plugins: [
    "@typescript-eslint"
  ],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
<<<<<<< HEAD
  "rules": {
    // Temporarily disable strict type checking rules
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/no-unsafe-enum-comparison": "off",
    "@typescript-eslint/no-redundant-type-constituents": "off",
    "@typescript-eslint/await-thenable": "off",
=======
  rules: {
>>>>>>> origin/attendee
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        "prefer": "type-imports",
        "fixStyle": "inline-type-imports"
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": {
          "attributes": false
        }
      }
    ]
  }
};
