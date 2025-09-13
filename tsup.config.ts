import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["index.mts"],
    format: ["esm", "cjs"],
    dts: true,
    minify: true,
    target: "esnext",
    bundle: true,
    platform: "node"
});
