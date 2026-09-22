import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  ArrowLeft,
  Activity,
  Sparkles,
  RefreshCw,
  QrCode,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Ban,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { cardService } from '../services/cardService';
import { Card, CardStatus } from '../types';
import { formatDate, formatRelativeTime, getDynamicUrl, copyToClipboard } from '../utils';
import { ALL_CARD_STATUSES } from '../lib/constants';
import { useToast } from '../hooks/useToast';

export const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit Destination Modal
  const [isEditDestModalOpen, setIsEditDestModalOpen] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');
  const [isSavingDest, setIsSavingDest] = useState(false);

  // Change Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusInput, setStatusInput] = useState<CardStatus>('Ready');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Delete Card State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<HTMLDivElement>(null);

  const loadCard = async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await cardService.getCardById(id);
      if (data) {
        setCard(data);
        setDestinationInput(data.destination_url);
        setStatusInput(data.status);
      } else {
        setCard(null);
      }
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load card from database';
      setLoadError(msg);
      error('Error loading card', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCard();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Loading card details from Supabase..." />;
  }

  if (loadError || !card) {
    return (
      <ErrorState
        title="Card Not Found"
        message={loadError || `No card record found in Supabase matching identifier "${id}".`}
        onRetry={() => navigate('/cards')}
      />
    );
  }

  const dynamicUrl = getDynamicUrl(card.public_token);

  const handleCopyUrl = async () => {
    const ok = await copyToClipboard(dynamicUrl);
    if (ok) {
      success('Copied to Clipboard', dynamicUrl);
    } else {
      error('Failed to copy URL');
    }
  };

  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput.trim()) {
      error('Destination URL cannot be empty');
      return;
    }

    setIsSavingDest(true);
    try {
      const updated = await cardService.updateCardDestination(card.id, destinationInput.trim());
      setCard(updated);
      success(
        'Destination updated successfully in database.',
        'The physical QR, token, and dynamic URL remain unchanged.'
      );
      setIsEditDestModalOpen(false);
    } catch (err) {
      error('Failed to update destination', (err as Error).message);
    } finally {
      setIsSavingDest(false);
    }
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStatus(true);
    try {
      const updated = await cardService.updateCardStatus(card.id, statusInput);
      setCard(updated);
      success('Status Changed in Supabase', `Card status updated to ${statusInput}`);
      setIsStatusModalOpen(false);
    } catch (err) {
      error('Failed to update status', (err as Error).message);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleToggleStatusQuick = async () => {
    const nextStatus: CardStatus = card.status === 'Disabled' ? 'Ready' : 'Disabled';
    try {
      const updated = await cardService.updateCardStatus(card.id, nextStatus);
      setCard(updated);
      success(`Card ${nextStatus === 'Disabled' ? 'Disabled' : 'Enabled'}`, `Status updated in Supabase to ${nextStatus}`);
    } catch (err) {
      error('Failed to toggle status', (err as Error).message);
    }
  };

  const downloadPNG = () => {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (!canvas) {
      error('QR canvas not ready');
      return;
    }
    const link = document.createElement('a');
    link.download = `${card.internal_card_no}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    success(`Downloaded ${card.internal_card_no}.png`);
  };

  const downloadSVG = () => {
    const svg = qrSvgRef.current?.querySelector('svg');
    if (!svg) {
      error('QR svg not ready');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.download = `${card.internal_card_no}.svg`;
    link.href = svgUrl;
    link.click();
    URL.revokeObjectURL(svgUrl);
    success(`Downloaded ${card.internal_card_no}.svg`);
  };

  const handleSimulateScan = async () => {
    const updated = await cardService.recordCardScan(card.public_token);
    if (updated) {
      setCard(updated);
      success('Scan Recorded in Supabase!', `Total scans incremented to ${updated.total_scans}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!card) return;
    setIsDeleting(true);
    try {
      await cardService.deleteCard(card.id);
      success('Card Deleted', `Permanently removed ${card.internal_card_no} from Supabase.`);
      navigate('/cards');
    } catch (err) {
      error('Delete failed', (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cards')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="mb-3 text-slate-500 hover:text-slate-900"
        >
          Back to Cards
        </Button>
        <PageHeader
          title={`Card ${card.internal_card_no}`}
          description={`Hardware PVC card registered in Supabase with security token ${card.public_token}`}
          badge={<StatusBadge status={card.status} type="card" />}
          actions={
            <div className="flex items-center gap-2">
              <a
                href={dynamicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
                title="Test dynamic redirect in new tab"
              >
                <span>Test Live Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Button
                variant={card.status === 'Disabled' ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggleStatusQuick}
                leftIcon={card.status === 'Disabled' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
              >
                {card.status === 'Disabled' ? 'Enable Card' : 'Disable Card'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusModalOpen(true)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Change Status
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditDestModalOpen(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Destination
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete Card
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Grid: Card Specs / Routing & QR Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, URL routing & Meta */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permanent Dynamic URL Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Permanent Physical Dynamic URL (NFC Chip & QR Code Payload)
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs text-slate-400 block mb-1">Encoded on physical PVC chip & QR:</span>
                <span className="font-mono text-base sm:text-lg text-white font-semibold break-all selection:bg-brand-500 selection:text-white">
                  {dynamicUrl}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyUrl}
                leftIcon={<Copy className="w-4 h-4" />}
                className="shrink-0 bg-brand-600 hover:bg-brand-500 text-white"
              >
                Copy URL
              </Button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              ⚡ <strong>Zero Re-print Guarantee:</strong> This URL is burned into the physical PVC NFC card and QR pattern. It never changes even when destination is updated.
            </p>
          </div>

          {/* Destination Routing Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-600" />
                  Current Destination URL
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  When a customer taps or scans, the Supabase Edge Function redirects them here.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDestModalOpen(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Update Destination
              </Button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <span className="font-mono text-xs sm:text-sm text-slate-800 break-all">
                {card.destination_url || <span className="text-slate-400 italic">No destination configured</span>}
              </span>
              {card.destination_url && (
                <a
                  href={card.destination_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md transition-colors shrink-0"
                  title="Open Destination in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Created Date:</span>
                <span className="font-medium text-slate-700 block">{formatDate(card.created_at)}</span>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Last Database Update:</span>
                <span className="text-slate-700 font-medium block">{formatRelativeTime(card.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* QR Pre-Print Verification Area */}
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
                Valid dynamic URL
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Token: {card.public_token}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Card: {card.internal_card_no}
              </div>
            </div>
          </div>

          {/* Detailed Attributes Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Supabase Card Attributes & Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  Internal Card Number
                </span>
                <span className="font-mono font-bold text-slate-900 text-base">{card.internal_card_no}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  Public Security Token
                </span>
                <span className="font-mono font-bold text-brand-700 text-base">{card.public_token}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  Database Record ID (UUID)
                </span>
                <span className="font-mono text-xs text-slate-600 truncate block">{card.id}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  Current Lifecycle Status
                </span>
                <div className="pt-0.5">
                  <StatusBadge status={card.status} type="card" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  Created Date
                </span>
                <span className="text-slate-700">{formatDate(card.created_at)}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  Total Verified Scans
                </span>
                <span className="font-mono font-bold text-slate-900 text-base">{card.total_scans || card.scan_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Physical QR Preview & Print Asset Generator */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4 text-brand-600" />
              Physical QR Code Asset
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Encoded with: <span className="font-mono text-slate-700">/c/{card.public_token}</span>
            </p>

            {/* QR Canvas Container */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner mb-4">
              <div ref={qrCanvasRef}>
                <QRCodeCanvas
                  value={dynamicUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              {/* Hidden SVG for vector download */}
              <div ref={qrSvgRef} className="hidden">
                <QRCodeSVG value={dynamicUrl} size={500} level="H" includeMargin={true} />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                onClick={downloadPNG}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Download {card.internal_card_no}.png
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSVG}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Download {card.internal_card_no}.svg
              </Button>
            </div>

            {/* Test Scan Simulation button */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <a
                href={dynamicUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <span>Open Live Dynamic URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSimulateScan}
                leftIcon={<Activity className="w-3.5 h-3.5 text-brand-600" />}
                className="w-full text-xs text-slate-600 hover:text-slate-900"
              >
                Simulate 1 Scan Event (+1)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Destination Modal */}
      <Modal
        isOpen={isEditDestModalOpen}
        onClose={() => setIsEditDestModalOpen(false)}
        title="Edit Card Destination URL"
        description={`Update where users will land when tapping or scanning ${card.internal_card_no}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveDestination} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Card Permanent Dynamic URL
            </label>
            <div className="p-2.5 rounded-lg bg-slate-100 font-mono text-xs text-slate-600">
              {dynamicUrl}
            </div>
          </div>

          <div>
            <Input
              label="New Destination URL"
              type="url"
              required
              value={destinationInput}
              onChange={e => setDestinationInput(e.target.value)}
              placeholder="https://example.com"
              helperText="The dynamic URL will forward to this new destination without changing the physical QR"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDestModalOpen(false)}
              disabled={isSavingDest}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingDest}>
              Update Destination in Supabase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Change Card Status"
        description={`Modify card lifecycle state for ${card.internal_card_no}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveStatus} className="space-y-4">
          <div>
            <Select
              label="Lifecycle Status"
              value={statusInput}
              onChange={e => setStatusInput(e.target.value as CardStatus)}
              options={ALL_CARD_STATUSES.map(st => ({ value: st, label: st }))}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isSavingStatus}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingStatus}>
              Save Status in Supabase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Card Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete Card ${card.internal_card_no}`}
        message={`Are you sure you want to permanently delete card "${card.internal_card_no}" (Token: ${card.public_token}) from the Supabase database? This action cannot be undone.`}
        confirmText="Delete Card"
        isLoading={isDeleting}
      />
    </div>
  );
};
