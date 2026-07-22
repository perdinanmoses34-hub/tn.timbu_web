const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with subtle gradient -->
  <rect width="512" height="512" rx="110" fill="url(#bg-gradient)"/>
  
  <defs>
    <linearGradient id="bg-gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0B132B"/>
    </linearGradient>
    <linearGradient id="gold-gradient" x1="100" y1="100" x2="400" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="glow-gradient" x1="256" y1="100" x2="256" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Outer Ring Accent -->
  <circle cx="256" cy="256" r="210" stroke="url(#gold-gradient)" stroke-width="8" stroke-dasharray="12 12" opacity="0.6"/>
  <circle cx="256" cy="256" r="190" stroke="url(#gold-gradient)" stroke-width="4" opacity="0.3"/>

  <!-- Light Beam Glow behind Cross -->
  <ellipse cx="256" cy="240" rx="140" ry="160" fill="url(#glow-gradient)"/>

  <!-- Church Cross -->
  <!-- Vertical Beam -->
  <rect x="232" y="110" width="48" height="260" rx="12" fill="url(#gold-gradient)"/>
  <!-- Horizontal Beam -->
  <rect x="156" y="180" width="200" height="48" rx="12" fill="url(#gold-gradient)"/>

  <!-- Center Heart & Flame Embellishment -->
  <path d="M256 220 C256 200, 230 190, 220 205 C210 220, 230 240, 256 255 C282 240, 302 220, 292 205 C282 190, 256 200, 256 220 Z" fill="#EF4444" opacity="0.95"/>

  <!-- Bottom Text Badge -->
  <text x="256" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">GBI ROCK</text>
  <text x="256" y="450" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" fill="#FCD34D" text-anchor="middle" letter-spacing="6">JUANDA</text>
</svg>
`;

const svgMaskable = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid background for safe-zone maskable icons -->
  <rect width="512" height="512" fill="#0F172A"/>
  
  <defs>
    <linearGradient id="gold-gradient" x1="100" y1="100" x2="400" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>

  <!-- Scaled inside 80% safe zone -->
  <g transform="translate(51, 51) scale(0.8)">
    <circle cx="256" cy="256" r="200" stroke="url(#gold-gradient)" stroke-width="6" opacity="0.4"/>
    <rect x="232" y="100" width="48" height="260" rx="12" fill="url(#gold-gradient)"/>
    <rect x="156" y="170" width="200" height="48" rx="12" fill="url(#gold-gradient)"/>
    <text x="256" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">GBI ROCK</text>
    <text x="256" y="450" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" fill="#FCD34D" text-anchor="middle" letter-spacing="6">JUANDA</text>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Save raw SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

  // Generate PNGs
  const bufferStandard = Buffer.from(svgIcon);
  const bufferMaskable = Buffer.from(svgMaskable);

  await sharp(bufferStandard).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(bufferStandard).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(bufferStandard).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(bufferStandard).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));

  await sharp(bufferMaskable).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(bufferMaskable).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));

  console.log('✅ Icons generated successfully in /public!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
