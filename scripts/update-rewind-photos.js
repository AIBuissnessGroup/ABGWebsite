#!/usr/bin/env node

/**
 * Script to regenerate the static REWIND_PHOTOS array in WinterTakeover.tsx
 * Run this when you add/remove images and want to update the production build.
 * 
 * Usage: node scripts/update-rewind-photos.js
 */

const fs = require('fs');
const path = require('path');

const rewindDir = path.join(__dirname, '..', 'public', 'images', 'rewind');
const componentPath = path.join(__dirname, '..', 'src', 'components', 'WinterTakeover.tsx');

// Read all images from the rewind directory
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

const files = fs.readdirSync(rewindDir)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  })
  .sort(); // Sort alphabetically for consistency

console.log(`Found ${files.length} images in /public/images/rewind/`);

// Generate the array content
const arrayContent = files.map(file => `  '/images/rewind/${file}',`).join('\n');

// Read the component file
let componentContent = fs.readFileSync(componentPath, 'utf-8');

// Find and replace the STATIC_REWIND_PHOTOS array
const startMarker = 'const STATIC_REWIND_PHOTOS = [';
const endMarker = '];';

const startIdx = componentContent.indexOf(startMarker);
if (startIdx === -1) {
  console.error('Could not find STATIC_REWIND_PHOTOS array in WinterTakeover.tsx');
  process.exit(1);
}

// Find the closing bracket after the start marker
const afterStart = startIdx + startMarker.length;
const endIdx = componentContent.indexOf(endMarker, afterStart);

if (endIdx === -1) {
  console.error('Could not find closing bracket for STATIC_REWIND_PHOTOS array');
  process.exit(1);
}

// Replace the array content
const newContent = 
  componentContent.substring(0, afterStart) + 
  '\n' + arrayContent + '\n' +
  componentContent.substring(endIdx);

fs.writeFileSync(componentPath, newContent);

console.log(`✅ Updated WinterTakeover.tsx with ${files.length} rewind photos`);
console.log('\nImages included:');
files.forEach(f => console.log(`  - ${f}`));
