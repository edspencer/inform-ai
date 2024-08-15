import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

export default [
  {
    input: "src/ui/main.css",
    output: [{ file: "dist/main.css", format: "es" }],
    plugins: [
      postcss({
        extract: true,
        minimize: false,
      }),
    ],
  },
  {
    input: "./src/index.ts",
    output: [
      {
        file: "./dist/index.esm.js",
        format: "esm",
      },
      {
        file: "./dist/index.cjs.js",
        format: "cjs",
      },
    ],
    external: ["react", "react-dom"],
    plugins: [
      postcss({
        extract: true,
        minimize: true,
      }),
      peerDepsExternal(), // Automatically externalize peer dependencies
      resolve(), // Resolve modules from node_modules
      commonjs(), // Convert CommonJS modules to ES6
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
    watch: {
      include: "src/**",
    },
  },
];
