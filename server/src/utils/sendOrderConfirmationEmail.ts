import env from '@config/env';
import transporter from '@config/nodemailer.config';
import { OrderUserResponseDto } from '@dto/order.dto';
import { ShippingMethod, PaymentMethod } from '@enums/order.enum';
import { formatCurrency } from '@utils/formatCurrency';

interface SendOrderConfirmationEmailOptions {
  to: string;
  order: OrderUserResponseDto;
  pdfBuffer: Buffer;
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

export async function sendOrderConfirmationEmail({ to, order, pdfBuffer }: SendOrderConfirmationEmailOptions) {
  // Formatear montos y fecha para la plantilla
  const itemsFormatted = order.items.map((item) => ({
    ...item,
    priceUSDAtPurchaseFormatted: formatCurrency(item.priceUSDAtPurchase, 'en-US', 'USD'),
    subTotalFormatted: formatCurrency(item.subTotal, 'en-US', 'USD'),
  }));
  const totalAmountFormatted = formatCurrency(order.totalAmount, 'en-US', 'USD');
  const createdAtFormatted = formatDateToArg(order.createdAt);
  const showBankTransferExpense =
    order.paymentMethod === PaymentMethod.BankTransfer && order.bankTransferExpense !== undefined;
  const bankTransferExpenseFormatted = showBankTransferExpense
    ? formatCurrency(order.bankTransferExpense!, 'en-US', 'USD')
    : undefined;
  const isParcelCompany = order.shippingMethod === ShippingMethod.ParcelCompany;
  const isMotorcycle = order.shippingMethod === ShippingMethod.Motorcycle;

  // Logo URL
  const logoUrl = 'https://i.imgur.com/nzdfwS7.png';

  await transporter.sendMail({
    from: `Todo Armazones Argentina <${env.EMAIL_USER}>`,
    to,
    subject: `Confirmación de pedido #${order.orderNumber}`,
    // @ts-expect-error - nodemailer with handlebars template property not typed
    template: 'order-confirmation',
    context: {
      ...order,
      logoUrl,
      shippingMethodLabel: translateShippingMethod(order.shippingMethod as ShippingMethod),
      paymentMethodLabel: translatePaymentMethod(order.paymentMethod as PaymentMethod),
      items: itemsFormatted,
      totalAmountFormatted,
      createdAtFormatted,
      showBankTransferExpense,
      bankTransferExpenseFormatted,
      isParcelCompany,
      isMotorcycle,
    },
    attachments: [
      {
        filename: `orden-${order.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
