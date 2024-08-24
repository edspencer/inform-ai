import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^ai/rsc$": "<rootDir>/node_modules/ai/rsc/dist",
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  modulePaths: ["<rootDir>"],
  transformIgnorePatterns: ["/node_modules/(?!react18-json-view)"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default jestConfig;
