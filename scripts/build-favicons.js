const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function createIcoBuffer(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function run() {
  const publicDir = path.join(process.cwd(), 'public');
  const source = path.join(publicDir, 'winx-logo.png');

  console.log('Reading source emerald logo:', source);

  // Luxury obsidian-emerald casino squircle badge
  const svgBadge = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#0f2618" />
          <stop offset="60%" stop-color="#06120b" />
          <stop offset="100%" stop-color="#020603" />
        </radialGradient>
        <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00e65b" />
          <stop offset="50%" stop-color="#6dff38" />
          <stop offset="100%" stop-color="#00aa44" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#bg)" />
      <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="url(#ring)" stroke-width="12" opacity="0.9" />
    </svg>
  `);

  // Resize source logo to fit cleanly centered with comfortable margins
  const resizedLogo = await sharp(source)
    .resize(430, 350, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const base512 = await sharp(svgBadge)
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png({ quality: 95 })
    .toBuffer();

  console.log('Base 512x512 icon generated:', base512.length, 'bytes');

  // Generate all required formats and sizes
  const s16 = await sharp(base512).resize(16, 16).png().toBuffer();
  const s32 = await sharp(base512).resize(32, 32).png().toBuffer();
  const s48 = await sharp(base512).resize(48, 48).png().toBuffer();
  const s64 = await sharp(base512).resize(64, 64).png().toBuffer();
  const s180 = await sharp(base512).resize(180, 180).png().toBuffer();
  const s192 = await sharp(base512).resize(192, 192).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), s16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), s32);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), s48);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), s64);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), s180);
  fs.writeFileSync(path.join(publicDir, 'app-icon.png'), base512);

  const iconsDir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), s192);
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), base512);

  // Standard Windows and Chrome ICO container with 4 embedded resolutions
  const icoBuf = createIcoBuffer([s16, s32, s48, s64], [16, 32, 48, 64]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

  console.log('All favicons, app icons, and favicon.ico generated successfully!');
}

run().catch(err => {
  console.error('Build favicons error:', err);
  process.exit(1);
});
