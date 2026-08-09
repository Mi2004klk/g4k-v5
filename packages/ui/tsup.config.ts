import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/api/index.ts', 'src/components/index.ts', 'src/hooks/index.ts', 'src/theme/index.ts', 'src/types/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
});
