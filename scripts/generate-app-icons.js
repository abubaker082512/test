const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

async function generateIcons() {
  const source = path.join(__dirname, '../public/winx-pro-3d-icon.jpg')
  const publicDir = path.join(__dirname, '../public')
  const iconsDir = path.join(__dirname, '../public/icons')

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  console.log('Generating app icons from:', source)

  // 512x512 PWA and Android Launcher icon
  await sharp(source)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(iconsDir, 'icon-512.png'))
  console.log('Created: public/icons/icon-512.png')

  // 192x192 PWA Mobile icon
  await sharp(source)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(iconsDir, 'icon-192.png'))
  console.log('Created: public/icons/icon-192.png')

  // 180x180 Apple Touch Icon
  await sharp(source)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  console.log('Created: public/apple-touch-icon.png')

  // 64x64 Browser Favicon
  await sharp(source)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'))
  console.log('Created: public/favicon.png')

  // Also create a 512x512 copy as app-icon.png for direct access
  await sharp(source)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'app-icon.png'))
  console.log('Created: public/app-icon.png')

  console.log('All app icons generated successfully!')
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
