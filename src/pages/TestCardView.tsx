import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ExternalLink,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Building2,
  Sparkles,
  Radio,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { cardService } from '../services/cardService';
import { Card } from '../types';
import { getDynamicUrl, copyToClipboard } from '../utils';
import { useToast } from '../hooks/useToast';

export const TestCardView: React.FC = () => {
  const { publicToken } = useParams<{ publicToken: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cleanToken = (publicToken || '').trim().toUpperCase();

  useEffect(() => {
    const fetchCard = async () => {
      if (!cleanToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const found = await cardService.getCardByToken(cleanToken);
        setCard(found);
        if (found) {
          await cardService.recordCardScan(cleanToken);
        }
      } catch (err) {
        console.error('Error looking up token:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [cleanToken]);

  const dynamicUrl = cleanToken ? getDynamicUrl(cleanToken) : '';

  const handleCopyUrl = async () => {
    if (!dynamicUrl) return;
    const ok = await copyToClipboard(dynamicUrl);
    if (ok) {
      success('Copied Dynamic URL', dynamicUrl);
    } else {
      error('Failed to copy URL');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <LoadingState message="Extracting dynamic token & verifying scan..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-400 hover:text-white hover:bg-slate-900"
          >
            Admin Dashboard
          </Button>
          <span className="text-[11px] font-mono bg-brand-950 text-brand-300 border border-brand-700/60 px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-xs">
            PHASE 1 QR TEST
          </span>
        </div>

        {/* Scan Status Banner */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-semibold text-sm text-emerald-300">
              QR TOKEN RECEIVED ✓
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800">
            Token: {cleanToken}
          </span>
        </div>

        {/* Phase 1 Architecture Notice */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs space-y-1.5 shadow-md">
          <div className="flex items-center gap-1.5 font-semibold text-brand-400">
            <Sparkles className="w-4 h-4" />
            <span>Phase 1 Frontend Dynamic URL Verification</span>
          </div>
          <p className="leading-relaxed text-slate-400 text-[11px]">
            This test page proves that your physical QR / NFC scan successfully hit the permanent dynamic URL and transferred the correct public token to the application.
          </p>
        </div>

        {/* Main Card / Token Identity Container */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Token Received Highlight Header */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Token Received
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-brand-400 tracking-tight">
                {cleanToken || 'NO-TOKEN'}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Status
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                QR TOKEN RECEIVED ✓
              </span>
            </div>
          </div>

          {/* Dynamic URL display */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Dynamic URL
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <span className="font-mono text-xs sm:text-sm text-slate-200 break-all font-medium">
                {dynamicUrl}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
                className="text-white hover:bg-slate-800 shrink-0 text-xs"
              >
                Copy URL
              </Button>
            </div>
          </div>

          {/* If card was found in current local session */}
          {card ? (
            <div className="space-y-5 pt-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Matched Inventory Card</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono text-white">{card.internal_card_no}</span>
                    <StatusBadge status={card.status} type="card" />
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Assigned Client</span>
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1 sm:justify-end">
                    <Building2 className="w-3.5 h-3.5 text-brand-400" />
                    {card.client_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Current Destination URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Current Destination (Google Review Target)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    Live Destination
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/50 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs sm:text-sm text-emerald-200 break-all">
                    {card.destination_url}
                  </span>
                  <a
                    href={card.destination_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-emerald-400 hover:text-emerald-200 rounded-md transition-colors shrink-0"
                    title="Open Destination Link in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Original URL if different */}
              {card.original_url && card.original_url !== card.destination_url && (
                <div className="space-y-1 text-xs text-slate-400">
                  <span>Original Destination at Creation:</span>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 break-all">
                    {card.original_url}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unregistered token notice */
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Token received successfully.</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Public token {cleanToken} was received. Register or create this card in the Admin Dashboard to assign a destination URL.
              </p>
            </div>
          )}

          {/* QR Code & Scan verification box */}
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 shadow-md">
              <QRCodeCanvas value={dynamicUrl} size={130} level="H" includeMargin={true} />
            </div>

            <div className="space-y-2 text-xs text-slate-300 w-full">
              <div className="flex items-center gap-2 text-brand-400 font-semibold">
                <Radio className="w-4 h-4" />
                <span>QR Encoding Verification</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                This QR code encodes only the permanent dynamic URL <code className="text-brand-300 font-mono">{dynamicUrl}</code>. It never needs to be reprinted.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                {card ? (
                  <a
                    href={card.destination_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <span>Test Destination Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/scanner')}
                    className="bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                  >
                    Open CRM Scanner
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                >
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
