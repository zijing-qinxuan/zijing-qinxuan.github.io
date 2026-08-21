#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TOOL_ROOT = __dirname;
const REPOSITORY_ROOT = path.resolve(TOOL_ROOT, '..', '..');
const DEFAULT_SOURCE = path.join(TOOL_ROOT, 'original');
const DEFAULT_OUTPUT = path.join(TOOL_ROOT, 'output');
const DEFAULT_SITE_GALLERY = path.join(REPOSITORY_ROOT, 'assets', 'wedding-gallery');
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const VARIANTS = {
  thumb: {
    landscapeLongEdge: 1600,
    portraitLongEdge: 1400,
    quality: 80,
    minimumQuality: 60,
    maximumBytes: 500 * 1024,
    minimumLongEdge: 1000
  },
  large: {
    landscapeLongEdge: 3000,
    portraitLongEdge: 2500,
    quality: 85,
    minimumQuality: 64,
    maximumBytes: 1.5 * 1024 * 1024,
    minimumLongEdge: 1800
  }
};

function printHelp() {
  console.log(`Wedding gallery builder

Usage:
  npm run build-gallery
  node tools/wedding-gallery-builder/build-gallery.js [options]

Options:
  --source <directory>   Source image directory (default: original/)
  --output <directory>   Local preview output (default: output/)
  --site-dir <directory> Published site gallery directory
  --no-publish           Build only the local preview output
  --help                 Show this help
`);
}

function parseArguments(argv) {
  const options = {
    source: DEFAULT_SOURCE,
    output: DEFAULT_OUTPUT,
    siteDirectory: DEFAULT_SITE_GALLERY,
    publish: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') {
      printHelp();
      process.exit(0);
    }
    if (argument === '--no-publish') {
      options.publish = false;
      continue;
    }
    if (['--source', '--output', '--site-dir'].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a directory path.`);
      }
      index += 1;
      const resolved = path.resolve(process.cwd(), value);
      if (argument === '--source') options.source = resolved;
      if (argument === '--output') options.output = resolved;
      if (argument === '--site-dir') options.siteDirectory = resolved;
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

function runSips(argumentsList, sourceLabel) {
  const result = spawnSync('/usr/bin/sips', argumentsList, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    const details = (result.stderr || result.stdout || result.error?.message || '').trim();
    throw new Error(`Unable to process ${sourceLabel}${details ? `: ${details}` : '.'}`);
  }

  return result.stdout;
}

function verifySips() {
  if (process.platform !== 'darwin' || !fs.existsSync('/usr/bin/sips')) {
    throw new Error('This local builder requires macOS and the built-in /usr/bin/sips command.');
  }
}

function readImageDimensions(filePath) {
  const output = runSips(
    ['--getProperty', 'pixelWidth', '--getProperty', 'pixelHeight', filePath],
    path.basename(filePath)
  );
  const widthMatch = output.match(/pixelWidth:\s*(\d+)/);
  const heightMatch = output.match(/pixelHeight:\s*(\d+)/);
  const width = Number(widthMatch?.[1]);
  const height = Number(heightMatch?.[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid or damaged image: ${path.basename(filePath)}`);
  }

  return { width, height };
}

function collectSourceImages(sourceDirectory) {
  if (!fs.existsSync(sourceDirectory) || !fs.statSync(sourceDirectory).isDirectory()) {
    throw new Error(`Source directory does not exist: ${sourceDirectory}`);
  }

  const entries = fs.readdirSync(sourceDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'));
  const unsupported = entries.filter(
    (entry) => !SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
  );

  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported file format: ${unsupported.map((entry) => entry.name).join(', ')}. `
      + 'Use JPG, JPEG, or PNG images only.'
    );
  }

  const images = entries
    .map((entry) => path.join(sourceDirectory, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(
      path.basename(right),
      'en',
      { numeric: true, sensitivity: 'base' }
    ));

  if (images.length === 0) {
    throw new Error(`No JPG, JPEG, or PNG images found in ${sourceDirectory}.`);
  }

  return images;
}

function outputNames(index, total) {
  const digits = Math.max(2, String(total).length);
  const id = String(index + 1).padStart(digits, '0');
  if (index === 0) {
    return {
      id,
      thumb: `${id}-cover.jpg`,
      large: `${id}-cover-large.jpg`
    };
  }
  return {
    id,
    thumb: `${id}.jpg`,
    large: `${id}-large.jpg`
  };
}

function compressionQualities(start, minimum) {
  const qualities = [];
  for (let quality = start; quality >= minimum; quality -= 4) qualities.push(quality);
  if (qualities.at(-1) !== minimum) qualities.push(minimum);
  return qualities;
}

function convertToJpeg(sourcePath, outputPath, settings, orientation, sourceLongEdge) {
  const requestedLongEdge = orientation === 'landscape'
    ? settings.landscapeLongEdge
    : settings.portraitLongEdge;
  const qualities = compressionQualities(settings.quality, settings.minimumQuality);
  let longEdge = Math.min(requestedLongEdge, sourceLongEdge);
  const minimumLongEdge = Math.min(settings.minimumLongEdge, longEdge);
  let finalQuality = settings.quality;
  let fileSize = Number.POSITIVE_INFINITY;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  while (true) {
    for (const quality of qualities) {
      fs.rmSync(outputPath, { force: true });
      runSips([
        '--resampleHeightWidthMax', String(longEdge),
        '--setProperty', 'format', 'jpeg',
        '--setProperty', 'formatOptions', String(quality),
        sourcePath,
        '--out', outputPath
      ], path.basename(sourcePath));

      fileSize = fs.statSync(outputPath).size;
      finalQuality = quality;
      if (fileSize <= settings.maximumBytes) break;
    }

    if (fileSize <= settings.maximumBytes || longEdge <= minimumLongEdge) break;
    longEdge = Math.max(minimumLongEdge, Math.floor(longEdge * 0.9));
  }

  if (fileSize > settings.maximumBytes) {
    console.warn(
      `Warning: ${path.basename(outputPath)} is ${formatBytes(fileSize)}, `
      + `above the ${formatBytes(settings.maximumBytes)} target.`
    );
  }

  return {
    ...readImageDimensions(outputPath),
    bytes: fileSize,
    quality: finalQuality,
    longEdge
  };
}

function createDataFile(entries) {
  return `(() => {\n  const weddingGallery = ${JSON.stringify(entries, null, 2)};\n\n  window.weddingGallery = weddingGallery;\n})();\n`;
}

function copyDirectoryContents(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

function replaceDirectory(source, destination) {
  const parent = path.dirname(destination);
  const temporary = path.join(parent, `.${path.basename(destination)}.next-${process.pid}`);
  const backup = path.join(parent, `.${path.basename(destination)}.backup-${process.pid}`);
  fs.mkdirSync(parent, { recursive: true });
  fs.rmSync(temporary, { recursive: true, force: true });
  fs.rmSync(backup, { recursive: true, force: true });
  copyDirectoryContents(source, temporary);

  let hadExisting = false;
  try {
    if (fs.existsSync(destination)) {
      fs.renameSync(destination, backup);
      hadExisting = true;
    }
    fs.renameSync(temporary, destination);
    fs.rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    fs.rmSync(temporary, { recursive: true, force: true });
    if (hadExisting && !fs.existsSync(destination) && fs.existsSync(backup)) {
      fs.renameSync(backup, destination);
    }
    throw error;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function summarize(results, key) {
  const total = results.reduce((sum, result) => sum + result[key].bytes, 0);
  return {
    total,
    average: total / results.length
  };
}

function buildGallery(options) {
  verifySips();
  const sourceImages = collectSourceImages(options.source);
  const validatedImages = sourceImages.map((sourcePath) => ({
    sourcePath,
    ...readImageDimensions(sourcePath)
  }));
  const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wedding-gallery-builder-'));
  const stagingGallery = path.join(stagingRoot, 'gallery');
  const thumbDirectory = path.join(stagingGallery, 'thumb');
  const largeDirectory = path.join(stagingGallery, 'large');
  const results = [];

  try {
    fs.mkdirSync(thumbDirectory, { recursive: true });
    fs.mkdirSync(largeDirectory, { recursive: true });

    validatedImages.forEach((source, index) => {
      const names = outputNames(index, validatedImages.length);
      const orientation = source.width >= source.height ? 'landscape' : 'portrait';
      const sourceLongEdge = Math.max(source.width, source.height);
      const thumb = convertToJpeg(
        source.sourcePath,
        path.join(thumbDirectory, names.thumb),
        VARIANTS.thumb,
        orientation,
        sourceLongEdge
      );
      const large = convertToJpeg(
        source.sourcePath,
        path.join(largeDirectory, names.large),
        VARIANTS.large,
        orientation,
        sourceLongEdge
      );

      results.push({ names, orientation, thumb, large });
      console.log(
        `[${index + 1}/${validatedImages.length}] ${path.basename(source.sourcePath)} -> `
        + `${names.thumb} (${formatBytes(thumb.bytes)}), `
        + `${names.large} (${formatBytes(large.bytes)})`
      );
    });

    const dataEntries = results.map(({ names, thumb, large }) => ({
      id: names.id,
      thumb: `assets/wedding-gallery/thumb/${names.thumb}`,
      large: `assets/wedding-gallery/large/${names.large}`,
      width: thumb.width,
      height: thumb.height,
      largeWidth: large.width,
      largeHeight: large.height,
      alt: `Zeric and Lily wedding photo ${names.id}`
    }));
    fs.writeFileSync(
      path.join(stagingGallery, 'wedding-gallery-data.js'),
      createDataFile(dataEntries),
      'utf8'
    );

    replaceDirectory(stagingGallery, options.output);
    if (options.publish) replaceDirectory(stagingGallery, options.siteDirectory);

    const thumbSummary = summarize(results, 'thumb');
    const largeSummary = summarize(results, 'large');
    console.log('\nGallery build complete.');
    console.log(`Images: ${results.length}`);
    console.log(`Preview output: ${options.output}`);
    console.log(`Thumb total / average: ${formatBytes(thumbSummary.total)} / ${formatBytes(thumbSummary.average)}`);
    console.log(`Large total / average: ${formatBytes(largeSummary.total)} / ${formatBytes(largeSummary.average)}`);
    if (options.publish) console.log(`Website output: ${options.siteDirectory}`);
    else console.log('Website assets were not changed (--no-publish).');
  } finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
}

try {
  buildGallery(parseArguments(process.argv.slice(2)));
} catch (error) {
  console.error(`Gallery build failed: ${error.message}`);
  process.exitCode = 1;
}
