import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const INPUT_DIR = path.resolve('assets/appstore_screenshots/input');
const OUTPUT_BASE = path.resolve('assets/appstore_screenshots/output');

type Size = { width: number; height: number; name: string };

// Προτεινόμενη βασική διάσταση για iPhone (App Store): 1284x2778 (portrait)
const TARGET_SIZES: Size[] = [
  { width: 1284, height: 2778, name: '1284x2778' },
  { width: 2778, height: 1284, name: '2778x1284' },
  { width: 1242, height: 2688, name: '1242x2688' },
  { width: 2688, height: 1242, name: '2688x1242' },
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function resizeOne(inputPath: string, outDir: string, size: Size) {
  const fileName = path.basename(inputPath);
  const baseName = fileName.replace(path.extname(fileName), '');
  const outPath = path.join(outDir, `${baseName}_${size.name}.jpg`);

  await sharp(inputPath)
    .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

async function main() {
  ensureDir(INPUT_DIR);
  for (const s of TARGET_SIZES) {
    ensureDir(path.join(OUTPUT_BASE, s.name));
  }

  const files = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

  if (files.length === 0) {
    console.log(`Δεν βρέθηκαν εικόνες στον φάκελο: ${INPUT_DIR}`);
    console.log('Ρίξε εδώ τις εικόνες σου και ξανατρέξε τη διαδικασία.');
    return;
  }

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    for (const size of TARGET_SIZES) {
      const outDir = path.join(OUTPUT_BASE, size.name);
      console.log(`Μετατροπή ${file} -> ${size.name}`);
      await resizeOne(inputPath, outDir, size);
    }
  }

  console.log('Ολοκληρώθηκε η μετατροπή όλων των εικόνων.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


