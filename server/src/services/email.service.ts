import transporter from '@config/nodemailer.config';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';

export class EmailService {
  /**
   * Envía el catálogo por email con el PDF adjunto
   */
  public async sendCatalogEmail(
    recipientEmail: string,
    pdfBuffer: Buffer,
    fileName: string,
    catalogInfo: {
      totalProducts: number;
      totalVariants: number;
      categoriesCount: number;
    },
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@todoarmazones.com',
        to: recipientEmail,
        subject: 'Tu catálogo de productos está listo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://i.imgur.com/nzdfwS7.png" alt="Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <h2 style="color: #333; text-align: center;">¡Tu catálogo está listo!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hemos generado tu catálogo personalizado con los productos seleccionados. 
              Encontrarás el archivo PDF adjunto a este email.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Resumen del catálogo:</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li><strong>${catalogInfo.categoriesCount}</strong> categorías incluidas</li>
                <li><strong>${catalogInfo.totalProducts}</strong> productos</li>
                <li><strong>${catalogInfo.totalVariants}</strong> variantes disponibles</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Si tienes alguna pregunta o necesitas modificaciones en el catálogo, 
              no dudes en contactarnos.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 14px;">
                Este email fue generado automáticamente. Por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      await transporter.sendMail(mailOptions);

      logger.info('Catálogo enviado por email exitosamente', {
        recipient: recipientEmail,
        fileName,
        ...catalogInfo,
      });
    } catch (error) {
      logger.error('Error al enviar catálogo por email', {
        error,
        recipient: recipientEmail,
        fileName,
      });
      throw new AppError('Error al enviar el catálogo por email', 500, 'error', true, {
        cause: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
