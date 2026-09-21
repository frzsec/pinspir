import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const child = spawn('npx', ['drizzle-kit', 'generate'], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    FORCE_COLOR: '1'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
  // If it prompts, just send "Y\n" or whatever default it needs, 
  // or we can just see what it prints.
});

child.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
