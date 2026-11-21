import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal FileReader polyfill for Three.js GLTFExporter binary ArrayBuffer export in Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          if (typeof this.onloadend === 'function') this.onloadend();
        })
        .catch((err) => {
          this.error = err;
          if (typeof this.onerror === 'function') this.onerror(err);
        });
    }
    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          const base64 = Buffer.from(buf).toString('base64');
          const mime = blob.type || 'application/octet-stream';
          this.result = `data:${mime};base64,${base64}`;
          if (typeof this.onloadend === 'function') this.onloadend();
        })
        .catch((err) => {
          this.error = err;
          if (typeof this.onerror === 'function') this.onerror(err);
        });
    }
  };
}

import { createKnightAsset } from './knight-model.js';
import { GLTFExporter } from './vendor/GLTFExporter.js';
import { OBJExporter } from './vendor/OBJExporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'assets', 'models');

async function buildAssets() {
  await fs.mkdir(outDir, { recursive: true });

  const knight = createKnightAsset('royal');
  // Set heroic idle stance at rest and update world matrices
  knight.updateAnimation('idle', 0, 0.016, 0);
  knight.root.updateMatrixWorld(true);

  const gltfExporter = new GLTFExporter();

  // 1. Export Binary glTF (.glb)
  const glbBuffer = await new Promise((resolve, reject) => {
    gltfExporter.parse(
      knight.root,
      (result) => resolve(Buffer.from(result)),
      (err) => reject(err),
      { binary: true, onlyVisible: true }
    );
  });

  const glbPath = path.join(outDir, 'valorian-knight.glb');
  await fs.writeFile(glbPath, glbBuffer);

  // 2. Export Wavefront OBJ (.obj)
  const objExporter = new OBJExporter();
  const objText = objExporter.parse(knight.root);
  const objPath = path.join(outDir, 'valorian-knight.obj');
  await fs.writeFile(objPath, objText, 'utf8');

  console.log('Exported 3D Knight Assets successfully:');
  console.log(`  GLB: ${glbPath} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
  console.log(`  OBJ: ${objPath} (${(Buffer.byteLength(objText) / 1024).toFixed(1)} KB)`);
  console.log('  Mesh stats:', knight.stats);
}

buildAssets().catch((err) => {
  console.error(err);
  process.exit(1);
});
