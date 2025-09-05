import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import env from './env';
import logger from './logger';
import { AppError } from '@utils/AppError';

// Configura tu transporte SMTP
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Verificar conexión SMTP
transporter.verify((error) => {
  if (error) {
    logger.error('Error al conectar con el SMTP:', error);
    throw new AppError('No se pudo conectar con el servidor SMTP', 500, 'error', true, { cause: error.message });
  } else {
    logger.info('Conexión SMTP lista para enviar emails');
  }
});

// Siempre buscar templates en dist/templates
const templatesPath = path.resolve(process.cwd(), 'dist/templates');

// Configuración de Handlebars
const handlebarOptions = {
  viewEngine: {
    extname: '.hbs',
    partialsDir: templatesPath,
    layoutsDir: templatesPath,
    defaultLayout: '', // Puedes cambiarlo a 'main' si usás layouts
  },
  viewPath: templatesPath,
  extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

export default transporter;
