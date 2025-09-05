import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ResetPasswordEmailParams {
  displayName: string;
  resetUrl: string;
}

export async function renderResetPasswordEmail(params: ResetPasswordEmailParams): Promise<string> {
  const templatePath = path.join(__dirname, 'templates', 'reset-password.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateHtml);

  const logoUrl = 'https://i.imgur.com/nzdfwS7.png';

  return template({ ...params, logoUrl });
}
