// jest.config.ts
import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    // "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  modulePaths: ["<rootDir>"],
  transformIgnorePatterns: ["/node_modules/(?!react18-json-view)"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

export default jestConfig;
