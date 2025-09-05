import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
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
        displayHeaderFooter: true,
        margin: {
          top: '40px',
          bottom: '100px', // espacio para el footer
        },
        footerTemplate: `
          <div style="font-size:16px; width:100%; text-align:center; color:#444; padding:6px 0; font-family: Arial, sans-serif;">
            - Pagos por transferencia o depósito bancario incluyen un 4% de interés sobre el Total<br/>
            - Costos extra de envío a cargo del Cliente<br/>
            - Precios en pesos sujetos a modificación por tipo de cambio al día de pago
          </div>
        `,
        headerTemplate: `<div></div>`,
      })) as Buffer;

      return pdfBuffer;
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }
}
