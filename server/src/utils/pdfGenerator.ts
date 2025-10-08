import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { PDFDocument, rgb } from 'pdf-lib';
import { OrderResponseDto } from '@dto/order.dto';
import { ShippingMethod, PaymentMethod } from '@enums/order.enum';
import { formatCurrency } from '@utils/formatCurrency';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDateToArg(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);
}

function translateShippingMethod(method: ShippingMethod): string {
  switch (method) {
    case ShippingMethod.ParcelCompany:
      return 'Empresa de paquetería';
    case ShippingMethod.Motorcycle:
      return 'Moto';
    default:
      return method;
  }
}

function translatePaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.CashOnDelivery:
      return 'Efectivo contra entrega';
    case PaymentMethod.BankTransfer:
      return 'Transferencia bancaria o depósito';
    default:
      return method;
  }
}

export async function generateOrderPDF(orderData: OrderResponseDto): Promise<Buffer> {
  const templatePath = path.join(__dirname, 'templates', 'order-pdf.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateHtml);

  // Registrar helper para formatear moneda
  handlebars.registerHelper('formatCurrency', (value: number, locale: string, currency: string) => {
    return formatCurrency(value, locale, currency);
  });

  // Helpers para condicionales
  const isParcelCompany = orderData.shippingMethod === ShippingMethod.ParcelCompany;
  const isMotorcycle = orderData.shippingMethod === ShippingMethod.Motorcycle;
  const showBankTransferExpense =
    orderData.paymentMethod === PaymentMethod.BankTransfer && orderData.bankTransferExpense !== undefined;

  const logoBase64 = fs.readFileSync(path.join(__dirname, 'templates/assets', 'logo.png'), 'base64');
  // Logo URL
  const logoUrl = `data:image/png;base64,${logoBase64}`;

  // Formatear fecha
  const createdAtFormatted = formatDateToArg(orderData.createdAt);

  // Traducciones
  const shippingMethodLabel = translateShippingMethod(orderData.shippingMethod as ShippingMethod);
  const paymentMethodLabel = translatePaymentMethod(orderData.paymentMethod as PaymentMethod);

  // Formatear montos en USD
  const itemsFormatted = orderData.items.map((item) => ({
    ...item,
    priceUSDAtPurchase: formatCurrency(item.priceUSDAtPurchase, 'en-US', 'USD'),
    subTotal: formatCurrency(item.subTotal, 'en-US', 'USD'),
    productVariant: {
      ...item.productVariant,
      colorName: item.productVariant.color.name, // Extraemos específicamente color.name
      colorHex: item.productVariant.color.hex, // Extraemos específicamente color.hex
    },
  }));

  const subTotalAmountFormatted = formatCurrency(orderData.subTotal, 'en-US', 'USD');

  const totalAmountFormatted = formatCurrency(orderData.totalAmount, 'en-US', 'USD');
  const totalAmountARSFormatted = formatCurrency(orderData.totalAmountARS, 'es-AR', 'ARS');
  const bankTransferExpenseFormatted =
    orderData.bankTransferExpense !== undefined
      ? formatCurrency(orderData.bankTransferExpense, 'en-US', 'USD')
      : undefined;

  const exchangeRateFormatted = formatCurrency(orderData.exchangeRate, 'es-AR', 'ARS');

  const html = template({
    ...orderData,
    logoUrl,
    createdAt: createdAtFormatted,
    shippingMethodLabel,
    paymentMethodLabel,
    items: itemsFormatted,
    subTotal: subTotalAmountFormatted,
    totalAmount: totalAmountFormatted,
    totalAmountARS: totalAmountARSFormatted,
    isParcelCompany,
    isMotorcycle,
    showBankTransferExpense,
    bankTransferExpense: bankTransferExpenseFormatted,
    exchangeRate: exchangeRateFormatted,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    try {
      await page.setContent(html, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const pdfBuffer = (await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '70px', // Increased to provide space for order number and page number
          bottom: '20px',
        },
      })) as Buffer;

      // Load the PDF with pdf-lib to add order number and page numbers
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Embed a standard font
      const helveticaFont = await pdfDoc.embedFont('Helvetica');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Order number in top-right corner
        const orderText = `Orden #${orderData.orderNumber}`;
        const pageText = `Página ${i + 1} de ${totalPages}`;

        // Position for order number: top-right, with some margin
        const orderTextWidth = helveticaFont.widthOfTextAtSize(orderText, 10);
        const orderX = width - orderTextWidth - 20; // 20pt margin from right
        const orderY = height - 30; // 30pt from top

        // Position for page number: below order number
        const pageTextWidth = helveticaFont.widthOfTextAtSize(pageText, 10);
        const pageX = width - pageTextWidth - 20; // Align right
        const pageY = orderY - 15; // 15pt below order number

        // Draw order number
        page.drawText(orderText, {
          x: orderX,
          y: orderY,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });

        // Draw page number
        page.drawText(pageText, {
          x: pageX,
          y: pageY,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // Serialize the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

      return modifiedPdfBuffer;
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }
}
