// Run from the project root: node tools/optimize-home-images.cjs [path-to-sharp]
// Original PNGs stay available for other pages and future edits.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');

async function main() {
  const root = path.resolve(__dirname, '..');
  const homepage = path.join(root, 'index.html');
  let html = fs.readFileSync(homepage, 'utf8');
  const output = path.join(root, 'images', 'optimized');
  fs.mkdirSync(output, { recursive: true });
  const tags = [...html.matchAll(/<img\b[^>]*>/gs)];
  let originalBytes = 0;
  let fullBytes = 0;
  let mobileBytes = 0;
  for (const { 0: tag } of tags) {
    const source = tag.match(/\bsrc="([^"]+)"/)[1];
    const name = path.basename(source).replace(/(?:-\d+)?\.(?:png|webp)$/, '');
    const original = path.join(root, 'images', `${name}.png`);
    const meta = await sharp(original).metadata();
    const widths = [...new Set([480, 800, 1200, meta.width].filter(w => w <= meta.width))].sort((a, b) => a - b);
    const variants = [];
    for (const width of widths) {
      const relative = `images/optimized/${name}-${width}.webp`;
      await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(path.join(root, relative));
      variants.push({ width, relative, bytes: fs.statSync(path.join(root, relative)).size });
    }
    const sizes = tag.match(/\bsizes="([^"]+)"/)?.[1] || '(max-width: 850px) calc(100vw - 2.5rem), 560px';
    const fallback = variants.find(v => v.width >= 1200) || variants.at(-1);
    let updated = tag.replace(/\s+(?:srcset|sizes)="[^"]*"/g, '');
    updated = updated.replace(/\bsrc="[^"]+"/, `src="${fallback.relative}"\n                  srcset="${variants.map(v => `${v.relative} ${v.width}w`).join(', ')}"\n                  sizes="${sizes}"`);
    updated = updated.replace(/\bwidth="\d+"/, `width="${meta.width}"`).replace(/\bheight="\d+"/, `height="${meta.height}"`);
    if (!/\bfetchpriority="high"/.test(updated) && !/\bloading=/.test(updated)) updated = updated.replace(/\s*\/>$/, ' loading="lazy" />');
    if (!/\bdecoding=/.test(updated)) updated = updated.replace(/\s*\/>$/, ' decoding="async" />');
    html = html.replace(tag, updated);
    originalBytes += fs.statSync(original).size;
    fullBytes += variants.at(-1).bytes;
    mobileBytes += variants.find(v => v.width >= 800)?.bytes || variants.at(-1).bytes;
    console.log(`${name}: ${Math.round(variants.at(-1).bytes / 1024)} KB at original resolution`);
  }
  fs.writeFileSync(homepage, html);
  console.log(JSON.stringify({ images: tags.length, originalBytes, fullBytes, mobileBytes, reductionPercent: +(100 * (1 - fullBytes / originalBytes)).toFixed(1) }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
