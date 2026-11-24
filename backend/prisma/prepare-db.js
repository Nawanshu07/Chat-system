import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const schemaPath = fileURLToPath(new URL('schema.prisma', import.meta.url));
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('Set DATABASE_URL in the backend environment.');

const sqlite = databaseUrl.startsWith('file:');
if (sqlite) {
  const dbPath = path.resolve(path.dirname(schemaPath), databaseUrl.slice(5).split('?')[0]);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.closeSync(fs.openSync(dbPath, 'a'));
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const provider = sqlite ? 'sqlite' : 'postgresql';
const prepared = schema.replace(/(datasource db\s*\{\s*provider\s*=\s*)"[^"]+"/, '$1"' + provider + '"');
if (prepared !== schema) fs.writeFileSync(schemaPath, prepared);
console.log('Preparing Xwhispers for ' + provider);
