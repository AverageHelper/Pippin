import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { visualizer } from "rollup-plugin-visualizer";
import analyze from "rollup-plugin-analyzer";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import json from "@rollup/plugin-json";

const isProduction = process.env["NODE_ENV"] === "production";

export default defineConfig({
	plugins: [
		// Transpile source
		esbuild({
			tsconfig: "./tsconfig.prod.json",
			sourceMap: !isProduction,
			minify: isProduction
		}), // translate TypeScript to JS
		commonjs({ extensions: [".js", ".ts"] }), // translate CommonJS to ESM
		json(), // translate JSON

		// Find external dependencies
		nodeResolve({
			exportConditions: ["node"],
			preferBuiltins: true
		}),

		// Statistics
		analyze({ filter: () => false }), // only top-level summary
		visualizer()
	],
	onwarn(warning, defaultHandler) {
		// Ignore "`this` has been rewritten to `undefined`" warnings.
		// They usually relate to modules that were transpiled from
		// TypeScript, and check their context by querying the value
		// of global `this`.
		// TODO: PR @averagehelper/job-queue to fix this
		if (warning.code === "THIS_IS_UNDEFINED") return;

		defaultHandler(warning);
	},
	external: [
		// Circular, uses eval
		"discord.js",

		// Circular
		"undici",
		"winston-transport",
		"winston"
	],
	input: "src/main.ts",
	output: {
		file: "dist/server.js",
		format: "commonjs",
		inlineDynamicImports: true,
		sourcemap: isProduction ? undefined : "inline"
	}
});
