import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

const htmlPath = path.join(distDir, 'index.html');
const ejsPath = path.join(distDir, 'index.ejs');

let html = await fs.readFile(htmlPath, 'utf-8');

// Vite emits asset URLs prefixed with "./" because `base: './'`.
// The express adapter mounts the static dir at `<basePath>/static` and the
// EJS template's `<base href="<basePath>/" />` makes relative URLs resolve
// correctly — but Vite's leading "./" prevents that. Strip it.
html = html.replace(/(src|href)="\.\/static\//g, '$1="static/');

await fs.writeFile(ejsPath, html, 'utf-8');
await fs.unlink(htmlPath);

console.log(`postbuild: wrote ${path.relative(process.cwd(), ejsPath)}`);
