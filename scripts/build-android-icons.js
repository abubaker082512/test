const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const publicDir = path.join(process.cwd(), 'public');
  const sourceLogo = path.join(publicDir, 'winx-logo.png');
  const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

  console.log('Reading source logo:', sourceLogo);

  // 1. Squircle Badge (Standard ic_launcher.png)
  const squircleSvg = Buffer.from(`
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
      <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="url(#ring)" stroke-width="14" opacity="0.95" />
    </svg>
  `);

  // 2. Circular Badge (Round ic_launcher_round.png)
  const roundSvg = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgRound" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#0f2618" />
          <stop offset="60%" stop-color="#06120b" />
          <stop offset="100%" stop-color="#020603" />
        </radialGradient>
        <linearGradient id="ringRound" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00e65b" />
          <stop offset="50%" stop-color="#6dff38" />
          <stop offset="100%" stop-color="#00aa44" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="256" fill="url(#bgRound)" />
      <circle cx="256" cy="256" r="248" fill="none" stroke="url(#ringRound)" stroke-width="14" opacity="0.95" />
    </svg>
  `);

  // Resize source logo cleanly to fit inside the badges
  const resizedForSquircle = await sharp(sourceLogo)
    .resize(430, 350, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const resizedForRound = await sharp(sourceLogo)
    .resize(390, 316, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const squircleMaster = await sharp(squircleSvg)
    .composite([{ input: resizedForSquircle, gravity: 'center' }])
    .png({ quality: 95 })
    .toBuffer();

  const roundMaster = await sharp(roundSvg)
    .composite([{ input: resizedForRound, gravity: 'center' }])
    .png({ quality: 95 })
    .toBuffer();

  // Densities for Android mipmap
  const densities = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const { dir, size } of densities) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Standard squircle icon
    const squircleBuffer = await sharp(squircleMaster).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), squircleBuffer);

    // Round circular icon
    const roundBuffer = await sharp(roundMaster).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundBuffer);

    console.log(`Generated ${dir}: ic_launcher.png (${size}x${size}) and ic_launcher_round.png (${size}x${size})`);
  }

  // Update app_logo.png in drawable as well
  const drawableDir = path.join(resDir, 'drawable');
  fs.copyFileSync(sourceLogo, path.join(drawableDir, 'app_logo.png'));
  console.log('Updated android/app/src/main/res/drawable/app_logo.png');

  console.log('All Android mipmap icons and drawable assets updated successfully!');
}

run().catch(err => {
  console.error('Android icon generation error:', err);
  process.exit(1);
});
