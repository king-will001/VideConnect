import fs from 'node:fs/promises';
import path from 'node:path';

import { parsePublishableKey } from '@clerk/shared/keys';

const envFiles = ['.env.local', '.env'];

function normalizeEnvValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

async function loadEnvFiles() {
  for (const envFile of envFiles) {
    const fullPath = path.join(process.cwd(), envFile);

    try {
      const content = await fs.readFile(fullPath, 'utf8');

      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        const separatorIndex = trimmed.indexOf('=');

        if (separatorIndex === -1) {
          continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = normalizeEnvValue(trimmed.slice(separatorIndex + 1));

        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        continue;
      }

      throw error;
    }
  }
}

function parseChunkConfig(source, label) {
  const match = source.match(
    /\.u=e=>""\+\(\(\{([\s\S]*?)\}\)\[e\]\|\|e\)\+"([^"]+)"\+\w\.h\(\)\.slice\(0,6\)\+"([^"]+)"/,
  );
  const hashMatch = source.match(/\.h=\(\)=>"([a-f0-9]+)"/i);

  if (!match || !hashMatch) {
    throw new Error(`Unable to parse chunk map from ${label}`);
  }

  const [, rawMap, infix, suffix] = match;
  const [, fullHash] = hashMatch;
  const chunkNameMap = JSON.parse(`{${rawMap.replace(/(\d+):/g, '"$1":')}}`);
  const referencedChunkIds = [
    ...new Set(
      [...source.matchAll(/\.e\("(\d+)"\)/g)].map((chunkMatch) => chunkMatch[1]),
    ),
  ];

  return {
    chunkNameMap,
    referencedChunkIds,
    infix,
    hashPrefix: fullHash.slice(0, 6),
    suffix,
  };
}

function buildChunkFilenames(source, label) {
  const { chunkNameMap, referencedChunkIds, infix, hashPrefix, suffix } = parseChunkConfig(
    source,
    label,
  );

  const chunkIds = new Set([
    ...Object.keys(chunkNameMap),
    ...referencedChunkIds,
  ]);

  return [...chunkIds]
    .sort((left, right) => Number(left) - Number(right))
    .map(
      (chunkId) =>
        `${chunkNameMap[chunkId] ?? chunkId}${infix}${hashPrefix}${suffix}`,
    );
}

async function downloadAsset(source, target) {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Failed to download ${source}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(target, buffer);
}

await loadEnvFiles();

const publicAssetDir = path.join(process.cwd(), 'public', 'clerk-assets');
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

const frontendApi = parsePublishableKey(publishableKey)?.frontendApi;

if (!frontendApi) {
  throw new Error('Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

await fs.rm(publicAssetDir, {
  recursive: true,
  force: true,
});

await fs.mkdir(publicAssetDir, {
  recursive: true,
});

const entryAssets = [
  {
    source: `https://${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
    filename: 'clerk.browser.js',
  },
  {
    source: `https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`,
    filename: 'ui.browser.js',
  },
];

for (const asset of entryAssets) {
  await downloadAsset(asset.source, path.join(publicAssetDir, asset.filename));
}

const clerkBrowserSource = await fs.readFile(
  path.join(publicAssetDir, 'clerk.browser.js'),
  'utf8',
);
const clerkUiSource = await fs.readFile(
  path.join(publicAssetDir, 'ui.browser.js'),
  'utf8',
);

const chunkAssets = [
  ...buildChunkFilenames(clerkBrowserSource, 'clerk.browser.js'),
  ...buildChunkFilenames(clerkUiSource, 'ui.browser.js'),
];

for (const filename of [...new Set(chunkAssets)]) {
  await downloadAsset(
    `https://${frontendApi}/npm/${filename.includes('_ui_') ? '@clerk/ui@1' : '@clerk/clerk-js@6'}/dist/${filename}`,
    path.join(publicAssetDir, filename),
  );
}

console.log('Clerk assets synced to public/clerk-assets');
