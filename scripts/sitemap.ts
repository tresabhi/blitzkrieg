import { tankDefinitions } from '../src/core/blitzkrieg/tankDefinitions';

// random vercel bug forces require import
const { writeFileSync } = require('fs');

console.log('Building sitemap...');

const awaitedTankDefinitions = await tankDefinitions;
const values = Object.values(awaitedTankDefinitions);
const txt = values
  .map((tank) => `https://blitz-krieg.vercel.app/tools/tankopedia/${tank.id}/`)
  .join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${values
  .map(
    (tank) =>
      `<url><loc>https://blitz-krieg.vercel.app/tools/tankopedia/${tank.id}/</loc></url>`,
  )
  .join('\n')}
</urlset>`;

writeFileSync('public/sitemap.txt', txt);
writeFileSync('public/sitemap.xml', xml);

console.log(`Built sitemap for ${values.length} tanks`);
