// utils/renderTemplate.ts
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.ejs`);
  return ejs.renderFile(templatePath, data);
}
