import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.prisma');

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

console.log(`🔧 Preparing Prisma schema for: ${targetProvider.toUpperCase()}`);

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace provider in datasource db block
schemaContent = schemaContent.replace(
  /datasource\s+db\s+\{[\s\S]*?provider\s*=\s*"[^"]+"/,
  `datasource db {\n  provider = "${targetProvider}"`
);

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log(`✅ Prisma schema configured for provider = "${targetProvider}"`);
