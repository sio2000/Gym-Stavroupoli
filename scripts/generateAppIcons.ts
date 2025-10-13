/*
  Generate required iOS app icons without alpha channel.
  Creates solid-color PNGs for all iPhone/iPad slots + ios-marketing 1024x1024.
*/
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

type IconSpec = {
  idiom: 'iphone' | 'ipad' | 'ios-marketing';
  sizePt: number; // points
  scale: 1 | 2 | 3;
  filename: string;
};

const OUTPUT_DIR = path.resolve('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

const backgroundColor = '#00C08B'; // GetFit green; adjust if needed

const specs: IconSpec[] = [
  // iPhone
  { idiom: 'iphone', sizePt: 20, scale: 2, filename: 'Icon-20@2x.png' }, // 40
  { idiom: 'iphone', sizePt: 20, scale: 3, filename: 'Icon-20@3x.png' }, // 60
  { idiom: 'iphone', sizePt: 29, scale: 2, filename: 'Icon-29@2x.png' }, // 58
  { idiom: 'iphone', sizePt: 29, scale: 3, filename: 'Icon-29@3x.png' }, // 87
  { idiom: 'iphone', sizePt: 40, scale: 2, filename: 'Icon-40@2x.png' }, // 80
  { idiom: 'iphone', sizePt: 40, scale: 3, filename: 'Icon-40@3x.png' }, // 120
  { idiom: 'iphone', sizePt: 60, scale: 2, filename: 'Icon-60@2x.png' }, // 120 (required)
  { idiom: 'iphone', sizePt: 60, scale: 3, filename: 'Icon-60@3x.png' }, // 180

  // iPad
  { idiom: 'ipad', sizePt: 20, scale: 1, filename: 'Icon-20.png' }, // 20
  { idiom: 'ipad', sizePt: 20, scale: 2, filename: 'Icon-20@2x-ipad.png' }, // 40
  { idiom: 'ipad', sizePt: 29, scale: 1, filename: 'Icon-29.png' }, // 29
  { idiom: 'ipad', sizePt: 29, scale: 2, filename: 'Icon-29@2x-ipad.png' }, // 58
  { idiom: 'ipad', sizePt: 40, scale: 1, filename: 'Icon-40.png' }, // 40
  { idiom: 'ipad', sizePt: 40, scale: 2, filename: 'Icon-40@2x-ipad.png' }, // 80
  { idiom: 'ipad', sizePt: 76, scale: 1, filename: 'Icon-76.png' }, // 76
  { idiom: 'ipad', sizePt: 76, scale: 2, filename: 'Icon-76@2x.png' }, // 152 (required)
  { idiom: 'ipad', sizePt: 83.5, scale: 2, filename: 'Icon-83.5@2x.png' }, // 167 (required)

  // App Store (ios-marketing)
  { idiom: 'ios-marketing', sizePt: 1024, scale: 1, filename: 'Icon-1024.png' }, // must be 1024x1024, no alpha
];

async function ensureDir(p: string) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function generateIcon(px: number, out: string) {
  // Solid PNG without alpha channel (RGB only)
  const img = sharp({
    create: { width: px, height: px, channels: 3, background: backgroundColor },
  });
  await img.png({ compressionLevel: 9 }).toFile(out);
}

function toSizeString(pt: number) {
  // e.g., 60 -> "60x60"
  return `${pt}x${pt}`;
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  const contents: any = { images: [] as any[], info: { version: 1, author: 'xcode' } };

  for (const s of specs) {
    const px = Math.round(s.sizePt * s.scale);
    const outPath = path.join(OUTPUT_DIR, s.filename);
    await generateIcon(px, outPath);

    contents.images.push({
      idiom: s.idiom,
      size: toSizeString(s.sizePt),
      scale: `${s.scale}x`,
      filename: s.filename,
    });
  }

  const contentsPath = path.join(OUTPUT_DIR, 'Contents.json');
  await fs.promises.writeFile(contentsPath, JSON.stringify(contents, null, 2), 'utf8');

  // Simple console output
  // eslint-disable-next-line no-console
  console.log(`iOS App Icons generated at: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate icons:', err);
  process.exit(1);
});


