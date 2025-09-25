import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer, { PDFOptions } from 'puppeteer';
import { CatalogDataDto } from '@dto/catalog.dto';
import { formatCurrency } from './formatCurrency';

type ProgressCallback = (step: string, progress: number, message: string) => void;

export async function generateCatalogPDF(catalogData: CatalogDataDto, onProgress?: ProgressCallback): Promise<Buffer> {
  onProgress?.('reading-template', 70, 'Leyendo template HTML');

  const templatePath = path.join(process.cwd(), 'src', 'utils', 'templates', 'catalog-pdf.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  onProgress?.('compiling-template', 72, 'Compilando template');
  const template = handlebars.compile(templateHtml);

  onProgress?.('registering-helpers', 74, 'Registrando helpers de Handlebars');

  // Registrar helpers de Handlebars
  handlebars.registerHelper('formatCurrency', (amount: number, locale?: string, currency?: string) => {
    return formatCurrency(amount, locale || 'en-US', currency || 'USD');
  });

  handlebars.registerHelper('eq', (a: unknown, b: unknown) => {
    return a === b;
  });

  // Helper para obtener el precio máximo de las variantes
  handlebars.registerHelper('maxPrice', (variants: Array<{ priceUSD: number }>) => {
    if (!variants || variants.length === 0) return 0;
    return Math.max(...variants.map((v) => v.priceUSD));
  });

  // Helper para obtener el precio máximo en ARS
  handlebars.registerHelper('maxPriceARS', (variants: Array<{ priceUSD: number }>, dollarBaseValue: number) => {
    if (!variants || variants.length === 0 || !dollarBaseValue) return formatCurrency(0, 'es-AR', 'ARS');
    const maxUSD = Math.max(...variants.map((v) => v.priceUSD));
    const priceARS = maxUSD * dollarBaseValue;
    return formatCurrency(priceARS, 'es-AR', 'ARS');
  });

  onProgress?.('preparing-data', 76, 'Preparando datos para el template');

  // Preparar datos para el template
  const html = template({
    ...catalogData,
    hasCategories: catalogData.categories.length > 0,
  });

  onProgress?.('html-generated', 78, 'HTML generado correctamente');

  onProgress?.('launching-browser', 80, 'Iniciando navegador Puppeteer');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 900000, // Aumentado a 15 minutos para evitar timeouts en generación de PDFs grandes
  });

  onProgress?.('creating-page', 82, 'Creando nueva página');

  const page = await browser.newPage();

  onProgress?.('configuring-page', 84, 'Configurando página y viewport');

  // Configurar timeout por defecto para la página
  await page.setDefaultTimeout(900000); // 15 minutos para operaciones de página

  // Configurar viewport y esperar por las imágenes
  await page.setViewport({ width: 1200, height: 800 });

  onProgress?.('loading-content', 86, 'Cargando contenido HTML en la página');

  // Configurar el contenido con mejor manejo de imágenes
  await page.setContent(html, {
    waitUntil: 'networkidle0', // Cambiado para esperar menos requests de red
  });

  onProgress?.('waiting-images', 88, 'Esperando carga completa de imágenes');

  // Esperar menos tiempo para imágenes, ya que networkidle0 ya espera
  await new Promise((resolve) => setTimeout(resolve, 5000));

  onProgress?.('preparing-pdf', 90, 'Preparando opciones de PDF');

  const pdfOptions: PDFOptions = {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    printBackground: true,
    preferCSSPageSize: true,
  };

  onProgress?.('generating-pdf', 92, 'Generando archivo PDF');

  const pdfBuffer = (await page.pdf(pdfOptions)) as Buffer;

  onProgress?.('closing-browser', 94, 'Cerrando navegador');

  await browser.close();

  onProgress?.('pdf-completed', 96, 'PDF generado exitosamente');

  return pdfBuffer;
}
