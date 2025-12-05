import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractFlies() {
  const inputPath = path.join(__dirname, '../src/assets/garbage-dump-with-flying-insects-and-rats.json');
  const outputPath = path.join(__dirname, '../src/assets/flies-only.json');

  console.log('Reading input file...');
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log(`Total layers in original: ${data.layers?.length || 0}`);
  console.log(`Total assets in original: ${data.assets?.length || 0}`);

  // Find the "flies" layer (it's a precomp reference)
  const fliesLayer = data.layers.find((layer: any) => {
    const name = (layer.nm || '').toLowerCase();
    return name.includes('flies') || name.includes('fly');
  });

  if (!fliesLayer) {
    console.error('❌ Could not find flies layer!');
    return;
  }

  console.log(`✅ Found flies layer: "${fliesLayer.nm}" (type: ${fliesLayer.ty}, refId: ${fliesLayer.refId})`);

  // Find the flies precomp asset
  const fliesAsset = data.assets.find((asset: any) => asset.id === fliesLayer.refId);
  
  if (!fliesAsset) {
    console.error(`❌ Could not find flies asset with id: ${fliesLayer.refId}`);
    return;
  }

  console.log(`✅ Found flies asset: "${fliesAsset.nm}" with ${fliesAsset.layers?.length || 0} sublayers`);
  
  if (fliesAsset.layers) {
    console.log('Sublayers in flies precomp:');
    fliesAsset.layers.forEach((layer: any, i: number) => {
      console.log(`  ${i}: "${layer.nm || 'unnamed'}" (type: ${layer.ty})`);
    });
  }

  // Collect ALL assets referenced by the flies precomp and its sublayers
  const usedAssetIds = new Set<string>();
  
  function collectAssetRefs(layer: any) {
    if (layer.refId) {
      usedAssetIds.add(layer.refId);
    }
    if (layer.layers) {
      layer.layers.forEach((subLayer: any) => collectAssetRefs(subLayer));
    }
  }

  // Collect from the flies precomp's sublayers
  if (fliesAsset.layers) {
    fliesAsset.layers.forEach((layer: any) => collectAssetRefs(layer));
  }

  // Also collect from the main flies layer itself
  collectAssetRefs(fliesLayer);

  console.log(`\nFound ${usedAssetIds.size} referenced asset IDs`);

  // Get all referenced assets (including nested precomps)
  const allReferencedAssets: any[] = [];
  const assetMap = new Map<string, any>();
  (data.assets || []).forEach((asset: any) => {
    assetMap.set(asset.id, asset);
  });

  // Recursively collect all assets
  function collectAllAssets(assetId: string, collected: Set<string>) {
    if (collected.has(assetId)) return;
    collected.add(assetId);
    
    const asset = assetMap.get(assetId);
    if (!asset) return;
    
    allReferencedAssets.push(asset);
    
    // If this asset has layers, check for more refs
    if (asset.layers) {
      asset.layers.forEach((layer: any) => {
        if (layer.refId && !collected.has(layer.refId)) {
          collectAllAssets(layer.refId, collected);
        }
      });
    }
  }

  const collected = new Set<string>();
  usedAssetIds.forEach(id => collectAllAssets(id, collected));

  console.log(`✅ Collected ${allReferencedAssets.length} total assets (including nested)`);

  // Take only half the flies (7 out of 14) and make each 40% bigger
  const selectedFlies = fliesAsset.layers.slice(0, 7); // Take first 7 flies
  
  // Scale each fly by 40% (1.4x)
  const scaleMultiplier = 1.4;
  const scaledFlies = selectedFlies.map((layer: any) => {
    const scaled = JSON.parse(JSON.stringify(layer)); // Deep clone
    
    // Scale the fly by adjusting the scale transform
    if (scaled.ks && scaled.ks.s) {
      const scale = scaled.ks.s;
      if (scale.a === 0 && scale.k) {
        // Static scale - multiply by 1.4
        if (Array.isArray(scale.k) && scale.k.length >= 2) {
          scale.k[0] = (scale.k[0] || 100) * scaleMultiplier;
          scale.k[1] = (scale.k[1] || 100) * scaleMultiplier;
        } else if (typeof scale.k === 'number') {
          scale.k = scale.k * scaleMultiplier;
        }
      } else if (Array.isArray(scale)) {
        // Animated scale - multiply all keyframes by 1.4
        scale.forEach((keyframe: any) => {
          if (keyframe.s) {
            if (Array.isArray(keyframe.s) && keyframe.s.length >= 2) {
              keyframe.s[0] = (keyframe.s[0] || 100) * scaleMultiplier;
              keyframe.s[1] = (keyframe.s[1] || 100) * scaleMultiplier;
            } else if (typeof keyframe.s === 'number') {
              keyframe.s = keyframe.s * scaleMultiplier;
            }
          }
          if (keyframe.k) {
            if (Array.isArray(keyframe.k) && keyframe.k.length >= 2) {
              keyframe.k[0] = (keyframe.k[0] || 100) * scaleMultiplier;
              keyframe.k[1] = (keyframe.k[1] || 100) * scaleMultiplier;
            } else if (typeof keyframe.k === 'number') {
              keyframe.k = keyframe.k * scaleMultiplier;
            }
          }
        });
      }
    } else {
      // No scale property exists, add one
      if (!scaled.ks) scaled.ks = {};
      scaled.ks.s = {
        a: 0,
        k: [140, 140, 100] // 140% scale (1.4x)
      };
    }
    
    return scaled;
  });

  // Keep original canvas size but use the scaled flies
  const flyOnlyData = {
    v: data.v,
    fr: data.fr,
    ip: data.ip,
    op: data.op,
    w: data.w || 3840, // Keep original width
    h: data.h || 2160, // Keep original height
    nm: 'flies-only',
    ddd: data.ddd || 0,
    assets: allReferencedAssets,
    layers: scaledFlies, // Use the scaled fly layers (7 flies, 25% bigger)
    markers: data.markers || [],
  };

  // Write output
  console.log(`\nWriting to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(flyOnlyData, null, 2));
  console.log('✅ Extraction complete!');
  console.log(`\nResult: ${flyOnlyData.layers.length} layers, ${allReferencedAssets.length} assets`);
  console.log(`Output dimensions: ${flyOnlyData.w}x${flyOnlyData.h}`);
  console.log(`Animation frames: ${flyOnlyData.ip} to ${flyOnlyData.op} (${flyOnlyData.op - flyOnlyData.ip} frames)`);
}

extractFlies();
