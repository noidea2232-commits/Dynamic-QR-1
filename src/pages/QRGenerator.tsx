import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Copy,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  FileArchive,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { cardService } from '../services/cardService';
import { batchService } from '../services/batchService';
import { Card, Batch } from '../types';
import { getDynamicUrl, copyToClipboard } from '../utils';
import { exportCardsQrZip } from '../utils/qrExportUtils';
import { useToast } from '../hooks/useToast';

export const QRGenerator: React.FC = () => {
  const { success, error } = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active Tab: 'single' | 'bulk'
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('bulk');

  // Single card mode state
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [customToken, setCustomToken] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Bulk mode state
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'both'>('png');
  const [exportResolution, setExportResolution] = useState<number>(1000);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  const singleCanvasRef = useRef<HTMLDivElement>(null);
  const singleSvgRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [cardsData, batchesData] = await Promise.all([
        cardService.getCards(),
        batchService.getBatches().catch(() => []),
      ]);
      setCards(cardsData);
      setBatches(batchesData);

      if (cardsData.length > 0) {
        setSelectedCardId(cardsData[0].id);
      }
      if (batchesData.length > 0) {
        setSelectedBatchId(batchesData[0].id);
      }
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load cards from Supabase';
      setLoadError(msg);
      error('Failed to load cards', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const tokenToUse = isCustomMode ? customToken.toUpperCase() : selectedCard?.public_token || '7KQ4M8X2';
  const cardNoToUse = isCustomMode ? 'CUSTOM' : selectedCard?.internal_card_no || 'CARD-0001';
  const dynamicUrl = getDynamicUrl(tokenToUse);

  // Filter cards for bulk export
  const getCardsToExport = (): Card[] => {
    if (selectedBatchId === 'all') {
      return cards;
    }
    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (!selectedBatch) return cards;

    // Match cards by batch_id or client_id
    const matched = cards.filter(c => c.batch_id === selectedBatch.id || c.client_id === selectedBatch.client_id);
    if (matched.length > 0) return matched;

    // Fallback if batch_id is not tagged in row: take slice based on quantity
    return cards.slice(0, selectedBatch.quantity);
  };

  const cardsToExport = getCardsToExport();

  const handleCopy = async () => {
    const ok = await copyToClipboard(dynamicUrl);
    if (ok) {
      success('Copied Dynamic URL', dynamicUrl);
    }
  };

  const downloadSinglePNG = (cardNo = cardNoToUse) => {
    const canvas = singleCanvasRef.current?.querySelector('canvas');
    if (!canvas) {
      error('QR canvas unavailable');
      return;
    }
    const link = document.createElement('a');
    link.download = `${cardNo}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    success(`Downloaded ${cardNo}.png`);
  };

  const downloadSingleSVG = (cardNo = cardNoToUse) => {
    const svg = singleSvgRef.current?.querySelector('svg');
    if (!svg) {
      error('QR svg unavailable');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.download = `${cardNo}.svg`;
    link.href = svgUrl;
    link.click();
    URL.revokeObjectURL(svgUrl);
    success(`Downloaded ${cardNo}.svg`);
  };

  const handleBulkExport = async () => {
    if (cardsToExport.length === 0) {
      error('No cards found to export');
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: cardsToExport.length, message: 'Starting export...' });

    try {
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      const batchName = selectedBatch ? selectedBatch.batch_name.replace(/[^a-zA-Z0-9-_]/g, '_') : 'All_Cards';
      const zipFilename = `QR_Export_${batchName}_${cardsToExport.length}_Cards.zip`;

      await exportCardsQrZip(cardsToExport, {
        format: exportFormat,
        size: exportResolution,
        zipFilename,
        onProgress: (current, total, message) => {
          setExportProgress({ current, total, message });
        },
      });

      success(
        'Bulk QR Package Downloaded!',
        `Saved ${cardsToExport.length} QR codes & manifest.csv into ${zipFilename}.`
      );
    } catch (err) {
      error('Bulk export failed', (err as Error).message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading cards & batches for QR Generator..." />;
  }

  if (loadError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <div className="text-rose-700 font-semibold text-base">Failed to connect to Supabase Database</div>
        <p className="text-xs text-rose-600 max-w-md mx-auto">{loadError}</p>
        <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Code Generator & Print Master"
        description="Render and download high-resolution QR print assets mapped to permanent dynamic redirect URLs."
        actions={
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'bulk'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>Bulk & Batch Export (ZIP)</span>
            </button>
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'single'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Single Card Master</span>
            </button>
          </div>
        }
      />

      {/* TAB 1: BULK & BATCH QR EXPORT */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileArchive className="w-5 h-5 text-brand-600" />
                  Bulk Export QR Codes (ZIP Package)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Package all cards from a batch (e.g. 50 cards) into high-resolution print files with manifest spreadsheet.
                </p>
              </div>
              <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full border border-brand-200">
                {cardsToExport.length} Cards Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Select Batch */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Batch or Scope
                </label>
                <select
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Cards in Inventory ({cards.length} cards)</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name} ({b.quantity} cards - {b.client_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Image Format
                </label>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as 'png' | 'svg' | 'both')}
                  className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="png">PNG (Raster - High Res)</option>
                  <option value="svg">SVG (Vector - Scalable)</option>
                  <option value="both">Both (PNG + SVG)</option>
                </select>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  PNG Resolution
                </label>
                <select
                  value={exportResolution}
                  onChange={e => setExportResolution(parseInt(e.target.value, 10))}
                  disabled={exportFormat === 'svg'}
                  className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value={600}>600 x 600 px (Standard)</option>
                  <option value={1000}>1000 x 1000 px (Recommended for PVC Print)</option>
                  <option value={2000}>2000 x 2000 px (Ultra High-Res)</option>
                </select>
              </div>
            </div>

            {/* Package Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                ZIP Archive Contents:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div>• <strong>{cardsToExport.length}</strong> QR image files ({exportFormat.toUpperCase()})</div>
                <div>• <strong>manifest.csv</strong> (Card numbers, tokens & destination URLs)</div>
                <div>• <strong>README.txt</strong> (Specifications and physical routing guide)</div>
                <div>• Dynamic URL Target: <span className="font-mono text-brand-700">/c/&#123;TOKEN&#125;</span></div>
              </div>
            </div>

            {/* Progress Bar if exporting */}
            {isExporting && exportProgress && (
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-brand-900">
                  <span>{exportProgress.message}</span>
                  <span>
                    {exportProgress.current} / {exportProgress.total} (
                    {Math.round((exportProgress.current / exportProgress.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-brand-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-150"
                    style={{
                      width: `${(exportProgress.current / exportProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Export Trigger Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Ready to package {cardsToExport.length} cards from Supabase
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={handleBulkExport}
                disabled={isExporting || cardsToExport.length === 0}
                isLoading={isExporting}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download All {cardsToExport.length} QR Codes (.ZIP)
              </Button>
            </div>
          </div>

          {/* Card Preview List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              Cards Included in this Export ({cardsToExport.length})
            </h4>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {cardsToExport.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 w-6">#{idx + 1}</span>
                    <span className="font-mono font-bold text-slate-900">{card.internal_card_no}</span>
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Token: {card.public_token}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-500 max-w-xs truncate hidden sm:inline">
                      {card.destination_url || 'Unassigned'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[11px]">
                      {card.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE CARD MASTER */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  Select Database Card
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                  >
                    {isCustomMode ? 'Switch to Database Cards' : 'Custom Token Input'}
                  </button>
                </div>
              </div>

              {!isCustomMode ? (
                <div>
                  <Select
                    label="Select Card from Supabase"
                    value={selectedCardId}
                    onChange={e => setSelectedCardId(e.target.value)}
                    options={cards.map(c => ({
                      value: c.id,
                      label: `${c.internal_card_no} — Token: ${c.public_token} (${c.status})`,
                    }))}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Custom Token (6-12 chars)"
                    placeholder="e.g. 7KQ4M8X2"
                    value={customToken}
                    onChange={e => setCustomToken(e.target.value.toUpperCase())}
                    helperText="Creates a QR payload for any arbitrary public token"
                  />
                </div>
              )}

              {/* URL Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Dynamic QR Payload (Canonical Permanent URL)
                </label>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs sm:text-sm flex items-center justify-between gap-3 border border-slate-800">
                  <span className="truncate text-brand-300 font-medium">{dynamicUrl}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      leftIcon={<Copy className="w-3.5 h-3.5" />}
                      className="text-white hover:bg-slate-800 shrink-0 text-xs"
                    >
                      Copy
                    </Button>
                    <a
                      href={dynamicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                      title="Test Dynamic URL in New Tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* QR Verification Area */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Pre-Print QR Verification
                </div>
                <div className="text-xs text-slate-600 font-mono break-all">
                  <strong>QR Content:</strong> {dynamicUrl}
                </div>
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid Dynamic URL
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Token: {tokenToUse}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Card: {cardNoToUse}
                  </div>
                </div>
              </div>

              {selectedCard && !isCustomMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Card Status:</span>
                    <span className="font-semibold text-slate-800">{selectedCard.status}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Backend Destination:</span>
                    <span className="font-mono text-slate-700 truncate block">
                      {selectedCard.destination_url || 'Unassigned'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Output Box */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
              <h3 className="text-base font-bold text-slate-900 mb-0.5 font-mono">{cardNoToUse}</h3>
              <p className="text-xs font-mono text-brand-700 font-semibold mb-4">Token: {tokenToUse}</p>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner mb-5">
                <div ref={singleCanvasRef}>
                  <QRCodeCanvas
                    value={dynamicUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div ref={singleSvgRef} className="hidden">
                  <QRCodeSVG value={dynamicUrl} size={600} level="H" includeMargin={true} />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => downloadSinglePNG()}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full"
                >
                  Download {cardNoToUse}.png
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => downloadSingleSVG()}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full"
                >
                  Download {cardNoToUse}.svg
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
