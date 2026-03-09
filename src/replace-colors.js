const fs = require('fs');
const path = require('path');

const replacements = [
  // Direct Sale colors (Yellow/Gold)
  ['rgba\\(247, 239, 138, 0\\.08\\)', 'color-mix(in srgb, var(--primary-ds-color) 8%, transparent)'],
  ['rgba\\(247, 239, 138, 0\\.1\\)', 'color-mix(in srgb, var(--primary-ds-color) 10%, transparent)'],
  ['rgba\\(247, 239, 138, 0\\.15\\)', 'color-mix(in srgb, var(--primary-ds-color) 15%, transparent)'],
  ['rgba\\(247, 239, 138, 0\\.9\\)', 'color-mix(in srgb, var(--primary-ds-color) 90%, white)'],
  ['rgba\\(212, 175, 55, 0\\.3\\)', 'color-mix(in srgb, var(--primary-ds-color) 30%, transparent)'],
  ['rgba\\(212, 175, 55, 0\\.4\\)', 'color-mix(in srgb, var(--primary-ds-color) 40%, transparent)'],
  ['rgba\\(212, 175, 55, 0\\.08\\)', 'color-mix(in srgb, var(--primary-ds-color) 8%, transparent)'],
  ['rgba\\(212, 175, 55, 0\\.2\\)', 'color-mix(in srgb, var(--primary-ds-color) 20%, transparent)'],
  ['#3d370e', 'color-mix(in srgb, var(--primary-ds-color) 30%, black)'],
  ['#8B7500', 'color-mix(in srgb, var(--primary-ds-color) 50%, black)'],
  ['#d4af37', 'var(--primary-ds-color)'],
  ['#fefce8', 'color-mix(in srgb, var(--primary-ds-color) 5%, white)'],
  ['#fef9c3', 'color-mix(in srgb, var(--primary-ds-color) 12%, white)'],
  ['#cda434', 'var(--primary-ds-color)'],
  // Auction colors (Blue)
  ['rgba\\(0, 99, 177, 0\\.15\\)', 'color-mix(in srgb, var(--primary-auction-color) 15%, transparent)'],
  ['rgba\\(0, 99, 177, 0\\.2\\)', 'color-mix(in srgb, var(--primary-auction-color) 20%, transparent)'],
  ['rgba\\(0, 99, 177, 0\\.1\\)', 'color-mix(in srgb, var(--primary-auction-color) 10%, transparent)'],
  ['rgba\\(0, 99, 177, 0\\.3\\)', 'color-mix(in srgb, var(--primary-auction-color) 30%, transparent)'],
  ['rgba\\(0, 99, 177, 0\\.4\\)', 'color-mix(in srgb, var(--primary-auction-color) 40%, transparent)'],
  ['rgba\\(0, 99, 177, 0\\.08\\)', 'color-mix(in srgb, var(--primary-auction-color) 8%, transparent)'],
  ['rgba\\(0, 99, 177, 0\\.06\\)', 'color-mix(in srgb, var(--primary-auction-color) 6%, transparent)'],
  ['#0063b1', 'var(--primary-auction-color)'],
  ['#004c8c', 'color-mix(in srgb, var(--primary-auction-color) 70%, black)'],
  // Tender colors (Green)
  ['rgba\\(16, 185, 129, 0\\.35\\)', 'color-mix(in srgb, var(--primary-tender-color) 35%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.25\\)', 'color-mix(in srgb, var(--primary-tender-color) 25%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.15\\)', 'color-mix(in srgb, var(--primary-tender-color) 15%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.2\\)', 'color-mix(in srgb, var(--primary-tender-color) 20%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.1\\)', 'color-mix(in srgb, var(--primary-tender-color) 10%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.3\\)', 'color-mix(in srgb, var(--primary-tender-color) 30%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.4\\)', 'color-mix(in srgb, var(--primary-tender-color) 40%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.08\\)', 'color-mix(in srgb, var(--primary-tender-color) 8%, transparent)'],
  ['rgba\\(16, 185, 129, 0\\.06\\)', 'color-mix(in srgb, var(--primary-tender-color) 6%, transparent)'],
  ['#10b981', 'var(--primary-tender-color)'],
  ['#059669', 'color-mix(in srgb, var(--primary-tender-color) 80%, black)'],
  ['#047857', 'color-mix(in srgb, var(--primary-tender-color) 60%, black)'],
  ['#ecfdf5', 'color-mix(in srgb, var(--primary-tender-color) 5%, white)'],
  ['#d1fae5', 'color-mix(in srgb, var(--primary-tender-color) 15%, white)'],
  ['#064e3b', 'color-mix(in srgb, var(--primary-tender-color) 30%, black)'],
];

const files = [
  "components/cards/DirectSaleCard.tsx",
  "components/cards/TenderCard.tsx",
  "components/cards/AuctionCard.tsx",
  "components/direct-sale-sidebar/MultipurposeDirectSaleSidebar.tsx",
  "components/live-direct-sales/Home1LiveDirectSales.tsx",
  "components/live-auction/LiveAuctionSidebar.tsx",
  "components/live-auction/Home1LiveAuction.tsx",
  "components/tenders-sidebar/MultipurposeTenderSidebar.tsx",
  "components/live-tender/Home1LiveTender.tsx"
];

files.forEach(filePart => {
  const file = path.join(__dirname, filePart);
  if (!fs.existsSync(file)) {
      console.log('Skipping missing file:', file);
      return;
  }
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  replacements.forEach(([regexStr, replacement]) => {
    let regex = new RegExp(regexStr, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('No matches found in:', file);
  }
});
