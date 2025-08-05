import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts'],            // Your entry file
    format: ['esm', 'cjs'],         // Must include both
    dts: true,                      // Generate .d.ts
    clean: true,
    minify: false,
    sourcemap: true,
});
