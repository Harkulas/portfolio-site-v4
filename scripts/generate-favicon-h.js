const sharp = require('sharp');

async function main() {
  const fg = '#64FFDA';
  const centerBg = '#0A192F';

  const eraseSvg =
    `${
      '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'>' +
      // Cover the old letter first; keep it tight to avoid touching the hex border.
      '<circle cx=\'16\' cy=\'16\' r=\'7.25\' fill=\''
    }${centerBg}'/>` + `</svg>`;

  const hSvg =
    `${
      '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'>' +
      '<text x=\'16\' y=\'21.5\' text-anchor=\'middle\' font-family=\'Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif\' font-size=\'18\' font-weight=\'700\' fill=\''
    }${fg}'>H</text>` + `</svg>`;

  const base = sharp('public/favicon-32x32.orig.png');

  await base
    .composite([
      { input: Buffer.from(eraseSvg), top: 0, left: 0 },
      { input: Buffer.from(hSvg), top: 0, left: 0 },
    ])
    .png()
    .toFile('public/favicon-32x32.png');
  // eslint-disable-next-line no-console
  console.log('Wrote public/favicon-32x32.png');
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
