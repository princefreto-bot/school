import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const logoPath = path.join(projectRoot, 'public', 'logo.svg');

async function main() {
  console.log('Generating web favicons...');
  // 1. Web Favicons
  const publicDir = path.join(projectRoot, 'public');
  
  // favicon.svg
  fs.copyFileSync(logoPath, path.join(publicDir, 'favicon.svg'));
  
  // favicon-96x96.png
  await sharp(logoPath).resize(96, 96).toFile(path.join(publicDir, 'favicon-96x96.png'));
  
  // apple-touch-icon.png
  await sharp(logoPath).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
  
  // web-app-manifest-192x192.png
  await sharp(logoPath).resize(192, 192).toFile(path.join(publicDir, 'web-app-manifest-192x192.png'));
  
  // web-app-manifest-512x512.png
  await sharp(logoPath).resize(512, 512).toFile(path.join(publicDir, 'web-app-manifest-512x512.png'));
  
  // favicon.ico (we make a 48x48 png and save it as favicon.ico)
  await sharp(logoPath).resize(48, 48).toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Generating Android launcher icons...');
  // 2. Android Icons
  const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
  const mipmaps = [
    { name: 'mipmap-mdpi', legacySize: 48, adaptiveSize: 108 },
    { name: 'mipmap-hdpi', legacySize: 72, adaptiveSize: 162 },
    { name: 'mipmap-xhdpi', legacySize: 96, adaptiveSize: 216 },
    { name: 'mipmap-xxhdpi', legacySize: 144, adaptiveSize: 324 },
    { name: 'mipmap-xxxhdpi', legacySize: 192, adaptiveSize: 432 },
  ];

  for (const mipmap of mipmaps) {
    const dirPath = path.join(resDir, mipmap.name);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // legacy ic_launcher.png
    await sharp(logoPath)
      .resize(mipmap.legacySize, mipmap.legacySize)
      .toFile(path.join(dirPath, 'ic_launcher.png'));

    // legacy ic_launcher_round.png (cropped to circle)
    const radius = mipmap.legacySize / 2;
    const circleSvg = Buffer.from(
      `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`
    );
    await sharp(logoPath)
      .resize(mipmap.legacySize, mipmap.legacySize)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // adaptive ic_launcher_foreground.png (centered with padding to fit in safe-zone)
    const logoSize = Math.round(mipmap.adaptiveSize * 0.65);
    const logoResized = await sharp(logoPath)
      .resize(logoSize, logoSize)
      .toBuffer();

    await sharp({
      create: {
        width: mipmap.adaptiveSize,
        height: mipmap.adaptiveSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent
      }
    })
    .composite([{ input: logoResized, gravity: 'center' }])
    .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));
  }

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
