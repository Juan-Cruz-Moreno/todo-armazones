import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Directorio de destino unificado para todos los templates
const destTemplatesDir = path.resolve(__dirname, '../dist/templates');

// Copiar templates de utils (para PDFs)
const utilsTemplatesDir = path.resolve(__dirname, '../src/utils/templates');
copyRecursive(utilsTemplatesDir, destTemplatesDir);
console.log(`✅ Templates de PDF copiados de "${utilsTemplatesDir}" a "${destTemplatesDir}"`);

// Copiar templates de config (para emails) al mismo destino
const configTemplatesDir = path.resolve(__dirname, '../src/config/templates');
copyRecursive(configTemplatesDir, destTemplatesDir);
console.log(`✅ Templates de email copiados de "${configTemplatesDir}" a "${destTemplatesDir}"`);
