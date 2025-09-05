import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'], // Punto de entrada principal
  outDir: 'dist', // Carpeta de salida
  format: ['esm'], // Usamos ES Modules
  target: 'node22', // Cambia si usas otra versión de Node
  splitting: false, // No necesitas splitting para backend
  sourcemap: true,
  minify: true, // Minifica el código
  clean: true,
  dts: false, // Pon true si quieres archivos .d.ts
  tsconfig: './tsconfig.json', // Usa tus paths desde aquí
});
