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
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { cardService } from '../services/cardService';
import { Card } from '../types';
import { getDynamicUrl, copyToClipboard } from '../utils';
import { useToast } from '../hooks/useToast';

export const QRGenerator: React.FC = () => {
  const { success, error } = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Single card mode state
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [customToken, setCustomToken] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const singleCanvasRef = useRef<HTMLDivElement>(null);
  const singleSvgRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const cardsData = await cardService.getCards();
      setCards(cardsData);

      if (cardsData.length > 0) {
        setSelectedCardId(cardsData[0].id);
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

  if (isLoading) {
    return <LoadingState message="Loading cards from Supabase for QR Generator..." />;
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
        title="QR Code Generator & Print Asset Master"
        description="Render and download high-resolution QR codes mapped directly to permanent dynamic redirect URLs."
      />

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
    </div>
  );
};
