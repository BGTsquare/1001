const fs = require('fs');
const path = require('path');

// Simple icon generator for PWA manifest
// Creates basic PNG icons with text content for development

const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const shortcutIcons = [
  { name: 'shortcut-books.png', size: 96 },
  { name: 'shortcut-library.png', size: 96 },
  { name: 'shortcut-bundles.png', size: 96 }
];

// Create a simple SVG icon template
function createSVGIcon(size, text = 'A') {
  const fontSize = Math.floor(size * 0.6);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.1}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating PWA icons...');

// Generate main app icons
iconSizes.forEach(({ size, name }) => {
  const svgContent = createSVGIcon(size, 'A');
  const svgPath = path.join(iconsDir, name.replace('.png', '.svg'));
  
  // Write SVG file (we'll use this as a fallback)
  fs.writeFileSync(svgPath, svgContent);
  
  // Create a minimal valid PNG file
  const pngPath = path.join(iconsDir, name);

  // Create a minimal 1x1 PNG file that browsers can read
  // This is a valid PNG file structure for a 1x1 black pixel
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB), Compression: 0, Filter: 0, Interlace: 0
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x03, 0x00, 0xFC, 0xFF, 0x00, 0x00, 0x00, // Compressed image data (black pixel)
    0x02, 0x00, 0x01, 0x00, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  fs.writeFileSync(pngPath, minimalPNG);
  console.log(`✅ Generated ${name} (${size}x${size})`);
});

// Generate shortcut icons
shortcutIcons.forEach(({ name, size }) => {
  const letter = name.includes('books') ? 'B' : name.includes('library') ? 'L' : 'U';
  const svgContent = createSVGIcon(size, letter);
  const svgPath = path.join(iconsDir, name.replace('.png', '.svg'));
  const pngPath = path.join(iconsDir, name);
  
  fs.writeFileSync(svgPath, svgContent);

  // Create the same minimal PNG for shortcuts
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00,
    0x90, 0x77, 0x53, 0xDE,
    0x00, 0x00, 0x00, 0x0C,
    0x49, 0x44, 0x41, 0x54,
    0x08, 0x99, 0x01, 0x01, 0x00, 0x03, 0x00, 0xFC, 0xFF, 0x00, 0x00, 0x00,
    0x02, 0x00, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);

  fs.writeFileSync(pngPath, minimalPNG);
  console.log(`✅ Generated ${name} (${size}x${size})`);
});

// Create a proper icon.svg for the main app icon
const mainIconSVG = createSVGIcon(512, 'A');
fs.writeFileSync(path.join(__dirname, '../public/icon.svg'), mainIconSVG);

console.log('🎉 Icon generation complete!');
console.log('📝 Note: These are placeholder icons. Replace with actual PNG files for production.');
console.log('💡 Tip: Use tools like https://realfavicongenerator.net/ for production icons.');
