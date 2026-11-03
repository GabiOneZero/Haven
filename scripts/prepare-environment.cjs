const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const outputPath = path.join(
  root,
  'src',
  'environments',
  'environment.config.generated.ts'
);

function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const contents = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  const values = {};

  for (const [index, rawLine] of contents.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator < 1) {
      throw new Error(`Invalid .env entry on line ${index + 1}.`);
    }

    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }

  return values;
}

const fileValues = readEnvFile();
const supabaseUrl = process.env.SUPABASE_URL || fileValues.SUPABASE_URL;
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  fileValues.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env or the process environment.'
  );
}

try {
  new URL(supabaseUrl);
} catch {
  throw new Error('SUPABASE_URL must be a valid URL.');
}

const generatedConfig = `export const supabaseConfig = ${JSON.stringify(
  {
    supabaseUrl,
    supabasePublishableKey
  },
  null,
  2
)};\n`;

fs.writeFileSync(outputPath, generatedConfig, 'utf8');
console.log('Supabase environment configuration prepared.');
