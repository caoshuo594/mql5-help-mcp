const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'MQL5_HELP');
if (!fs.existsSync(dest)) fs.mkdirSync(dest);

const keep = new Set(['src','build','node_modules','package.json','tsconfig.json','mcp_server.py','MQL5_HELP']);

const items = fs.readdirSync(root, { withFileTypes: true });
let moved = 0;
for (const it of items) {
  const name = it.name;
  if (keep.has(name)) continue;
  if (it.isFile() && path.extname(name).toLowerCase() === '.md') continue;
  // skip scripts folder
  if (name === 'scripts') continue;

  const srcPath = path.join(root, name);
  const destPath = path.join(dest, name);
  try {
    fs.renameSync(srcPath, destPath);
    moved++;
    console.log('Moved:', name);
  } catch (e) {
    console.error('Failed to move', name, e.message);
  }
}
console.log(`Done. Moved ${moved} items to ${dest}`);
