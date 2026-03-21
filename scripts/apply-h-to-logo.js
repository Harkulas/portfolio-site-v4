const sharp = require('sharp');
const fs = require('fs');

function distSum(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

async function main() {
  const faviconPath = 'public/favicon-32x32.png'; // current H version
  const logoPath = 'src/images/logo.png'; // used by gatsby-plugin-manifest

  const bg = [10, 25, 47]; // matches your existing favicon/logo palette

  // Build an H-only transparent layer by keeping pixels that are "not background".
  const { data: favData, info: favInfo } = await sharp(faviconPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  if (favInfo.width !== 32 || favInfo.height !== 32) {
    throw new Error(`Expected ${faviconPath} to be 32x32, got ${favInfo.width}x${favInfo.height}`);
  }

  const letterRgba = Buffer.alloc(favData.length);
  favData.copy(letterRgba);

  for (let i = 0; i < favData.length; i += 4) {
    const r = favData[i];
    const g = favData[i + 1];
    const b = favData[i + 2];
    const a = favData[i + 3];

    // Keep only the "letter-ish" pixels; everything else becomes transparent.
    const isLetter = a >= 200 && distSum([r, g, b], bg) >= 10;
    if (!isLetter) {
      letterRgba[i + 3] = 0;
    }
  }

  const hLayer = sharp(letterRgba, { raw: { width: 32, height: 32, channels: 4 } })
    .resize(100, 100, { kernel: sharp.kernel.cubic })
    .png();

  // Erase the old "B" on the logo by painting a background circle in the center.
  const logo = sharp(logoPath).ensureAlpha();
  const logoMeta = await logo.metadata();
  if (logoMeta.width !== 100 || logoMeta.height !== 100) {
    throw new Error(`Expected ${logoPath} to be 100x100, got ${logoMeta.width}x${logoMeta.height}`);
  }

  // Paint over the center area where the letter sits.
  const eraseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="24" fill="${'#0A192F'}" />
</svg>`;

  const tmpPath = 'src/images/logo.h-tmp.png';
  await logo
    .composite([
      { input: Buffer.from(eraseSvg), top: 0, left: 0 },
      { input: await hLayer.toBuffer(), top: 0, left: 0 },
    ])
    .png()
    .toFile(tmpPath);

  fs.copyFileSync(tmpPath, logoPath);
  fs.unlinkSync(tmpPath);

  // eslint-disable-next-line no-console
  console.log(`Updated ${logoPath} with H letter`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
