const sharp = require('sharp');
const fs = require('fs');

function distSum(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

async function main() {
  const bg = [10, 25, 47]; // #0A192F
  const faviconH = 'public/favicon-32x32.png'; // current H version
  const target = 'src/images/favicons/favicon-32x32.png';

  const { data: favData, info } = await sharp(faviconH).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  if (info.width !== 32 || info.height !== 32) {
    throw new Error(`Expected ${faviconH} to be 32x32`);
  }

  // Extract only the "letter" pixels from the H favicon.
  const hRgba = Buffer.alloc(favData.length);
  favData.copy(hRgba);
  for (let i = 0; i < favData.length; i += 4) {
    const r = favData[i];
    const g = favData[i + 1];
    const b = favData[i + 2];
    const a = favData[i + 3];

    const isLetter = a >= 200 && distSum([r, g, b], bg) >= 10;
    if (!isLetter) {hRgba[i + 3] = 0;}
  }

  const hLayer = sharp(hRgba, { raw: { width: 32, height: 32, channels: 4 } }).png();

  const eraseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="7.25" fill="${'#0A192F'}" />
</svg>`;

  const tmpPath = 'src/images/favicons/favicon-32x32.h-tmp.png';
  await sharp(target)
    .ensureAlpha()
    .composite([
      { input: Buffer.from(eraseSvg), top: 0, left: 0 },
      { input: await hLayer.toBuffer(), top: 0, left: 0 },
    ])
    .png()
    .toFile(tmpPath);

  fs.copyFileSync(tmpPath, target);
  fs.unlinkSync(tmpPath);
  // eslint-disable-next-line no-console
  console.log(`Updated ${target} to H`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
