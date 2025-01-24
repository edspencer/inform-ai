import typescript from "rollup-plugin-typescript2";
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
        minimize: true,
      }),
    ],
  },
  // ESM Build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [peerDepsExternal(), typescript({ useTsconfigDeclarationDir: true }), commonjs()],
    watch: {
      include: "src/**",
    },
  },
  // CommonJS Build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    plugins: [peerDepsExternal(), typescript({ useTsconfigDeclarationDir: true }), commonjs()],
    watch: {
      include: "src/**",
    },
  },
];
