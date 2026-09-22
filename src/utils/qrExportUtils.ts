import JSZip from 'jszip';
import QRCode from 'qrcode';
import { Card } from '../types';
import { getDynamicUrl } from './index';

export interface QrExportOptions {
  format?: 'png' | 'svg' | 'both';
  size?: number;
  zipFilename?: string;
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Generate a high-resolution PNG Data URL for a given URL string
 */
export async function generateQrPngDataUrl(url: string, size = 1000): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generate an SVG string for a given URL string
 */
export async function generateQrSvgString(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Convert base64 data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Trigger file download directly in the browser
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export a collection of cards into a single ZIP archive containing high-res QR codes and CSV manifest
 */
export async function exportCardsQrZip(
  cards: Card[],
  options: QrExportOptions = {}
): Promise<{ success: boolean; total: number; zipFilename: string }> {
  if (!cards || cards.length === 0) {
    throw new Error('No cards provided for QR export.');
  }

  const {
    format = 'png',
    size = 1000,
    zipFilename = `QR_Batch_Export_${cards.length}_Cards_${new Date().toISOString().slice(0, 10)}.zip`,
    onProgress,
  } = options;

  const zip = new JSZip();
  const total = cards.length;

  // 1. Build CSV manifest lines
  const csvRows: string[] = [
    'Internal Card No,Public Token,Dynamic URL,Backend Destination URL,Status,Total Scans,Created At',
  ];

  // 2. Generate each QR code and add to ZIP
  for (let i = 0; i < total; i++) {
    const card = cards[i];
    const dynamicUrl = getDynamicUrl(card.public_token);
    const cardNo = card.internal_card_no || `CARD-${String(i + 1).padStart(4, '0')}`;

    if (onProgress) {
      onProgress(i + 1, total, `Rendering ${cardNo} (${i + 1}/${total})...`);
    }

    // Add PNG if requested
    if (format === 'png' || format === 'both') {
      const pngDataUrl = await generateQrPngDataUrl(dynamicUrl, size);
      const pngBlob = dataUrlToBlob(pngDataUrl);
      zip.file(`${cardNo}.png`, pngBlob);
    }

    // Add SVG if requested
    if (format === 'svg' || format === 'both') {
      const svgString = await generateQrSvgString(dynamicUrl);
      zip.file(`${cardNo}.svg`, svgString);
    }

    // Append CSV Row
    const escapedDest = `"${(card.destination_url || '').replace(/"/g, '""')}"`;
    csvRows.push(
      `${cardNo},${card.public_token},${dynamicUrl},${escapedDest},${card.status},${card.total_scans || 0},${card.created_at || ''}`
    );
  }

  // 3. Add manifest CSV to root of ZIP
  const csvContent = csvRows.join('\r\n');
  zip.file('manifest.csv', csvContent);

  // 4. Add a README text file
  const readmeContent = `DYNAMIC QR & NFC BATCH EXPORT
=================================
Total Cards: ${total}
Generated At: ${new Date().toISOString()}
Format: ${format.toUpperCase()}
Resolution: ${size}x${size}px

Instructions:
1. Each QR code file (e.g. CARD-0001.png) permanently points to its canonical dynamic redirect URL.
2. The destination URL can be changed in the dashboard anytime without re-printing.
3. Use 'manifest.csv' to cross-reference card numbers, tokens, and current destination links.
`;
  zip.file('README.txt', readmeContent);

  if (onProgress) {
    onProgress(total, total, 'Compressing ZIP package...');
  }

  // 5. Generate ZIP Blob and trigger download
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  triggerFileDownload(zipBlob, zipFilename);

  return {
    success: true,
    total,
    zipFilename,
  };
}
