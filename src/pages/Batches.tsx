import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  QrCode,
  Eye,
  Building2,
  Link as LinkIcon,
  Hash,
  Sparkles,
  Download,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Table, Column } from '../components/ui/Table';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { batchService } from '../services/batchService';
import { clientService } from '../services/clientService';
import { cardService } from '../services/cardService';
import { Batch, Client, Card } from '../types';
import { formatDate } from '../utils';
import { exportCardsQrZip } from '../utils/qrExportUtils';
import { useToast } from '../hooks/useToast';
import { APP_CONFIG } from '../lib/constants';

export const Batches: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Created Modal
  const [newlyCreatedBatch, setNewlyCreatedBatch] = useState<{ batch: Batch; cards: Card[] } | null>(null);

  // Batch Delete State
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export State
  const [isExportingBatchId, setIsExportingBatchId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    destination_url: 'https://g.page/r/example-review/review',
    quantity: 50,
    batch_name: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [batchesData, clientsData, cardsData] = await Promise.all([
        batchService.getBatches(),
        clientService.getClients(),
        cardService.getCards().catch(() => []),
      ]);
      setBatches(batchesData);
      setClients(clientsData);
      setAllCards(cardsData);
      if (clientsData.length > 0 && !formData.client_id) {
        setFormData(prev => ({ ...prev, client_id: clientsData[0].id }));
      }
    } catch (err) {
      error('Failed to load batches', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      client_id: clients[0]?.id || '',
      destination_url: 'https://g.page/r/example-review/review',
      quantity: 50,
      batch_name: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      error('Please select a client');
      return;
    }
    if (!formData.destination_url) {
      error('Please provide the Google Review URL');
      return;
    }
    if (formData.quantity < 1 || formData.quantity > 500) {
      error('Quantity must be between 1 and 500');
      return;
    }

    setIsSubmitting(true);
    try {
      const { batch, generatedCards } = await batchService.createBatch(formData);
      success(
        'Batch Generated Successfully in Supabase!',
        `Created batch "${batch.batch_name}" with ${generatedCards.length} live cards.`
      );
      setIsCreateModalOpen(false);
      setNewlyCreatedBatch({ batch, cards: generatedCards });
      await loadData();
    } catch (err) {
      error('Batch generation failed', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportBatchQRs = async (batch: Batch, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExportingBatchId(batch.id);

    try {
      // Find cards matching this batch from live cards or refresh
      let batchCards = allCards.filter(c => c.batch_id === batch.id || c.client_id === batch.client_id);
      if (batchCards.length === 0) {
        // Fetch latest cards from Supabase
        const freshCards = await cardService.getCards();
        batchCards = freshCards.filter(c => c.batch_id === batch.id || c.client_id === batch.client_id);
      }

      // If still empty, take the most recent N cards matching quantity
      if (batchCards.length === 0 && allCards.length > 0) {
        batchCards = allCards.slice(0, batch.quantity);
      }

      if (batchCards.length === 0) {
        error('No cards found for this batch', 'Unable to find matching card records.');
        return;
      }

      const zipName = `${batch.batch_name.replace(/[^a-zA-Z0-9-_]/g, '_')}_${batchCards.length}_Cards_QRs.zip`;
      await exportCardsQrZip(batchCards, {
        format: 'png',
        size: 1000,
        zipFilename: zipName,
      });

      success('Batch QR Export Ready', `Downloaded ${zipName} containing ${batchCards.length} QR codes & manifest.csv.`);
    } catch (err) {
      error('QR Export Failed', (err as Error).message);
    } finally {
      setIsExportingBatchId(null);
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    setIsDeleting(true);
    try {
      await batchService.deleteBatch(batchToDelete.id, true);
      success('Batch Deleted', `Removed batch "${batchToDelete.batch_name}"`);
      setBatchToDelete(null);
      await loadData();
    } catch (err) {
      error('Delete failed', (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Batch>[] = [
    {
      header: 'Batch ID & Name',
      accessorKey: 'batch_name',
      cell: batch => (
        <div>
          <span className="font-semibold text-slate-900 block">{batch.batch_name}</span>
          <span className="font-mono text-xs text-slate-400">{batch.id}</span>
        </div>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'client_name',
      cell: batch => (
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{batch.client_name || 'Client'}</span>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessorKey: 'quantity',
      cell: batch => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
          <Hash className="w-3 h-3" />
          {batch.quantity} Cards
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: batch => <StatusBadge status={batch.status} type="batch" size="sm" />,
    },
    {
      header: 'Google Review Destination',
      accessorKey: 'destination_url',
      cell: batch => (
        <div className="max-w-xs truncate text-xs font-mono text-slate-500" title={batch.destination_url}>
          {batch.destination_url || '—'}
        </div>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: batch => <span className="text-xs text-slate-500">{formatDate(batch.created_at)}</span>,
    },
    {
      header: 'Actions',
      cell: batch => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleExportBatchQRs(batch)}
            disabled={isExportingBatchId === batch.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md text-xs font-semibold border border-brand-200 transition-colors"
            title="Download all QR codes in this batch as ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingBatchId === batch.id ? 'Exporting...' : 'Export QRs (.ZIP)'}</span>
          </button>
          <button
            onClick={() => navigate('/cards')}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Cards in Inventory"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/qr-generator')}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Open QR Generator"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBatchToDelete(batch)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Batch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical Card Batches"
        description="Generate bulk batches of dynamic PVC cards with unique public tokens and linked review destinations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/qr-generator')}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              Bulk QR Exporter
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Create Batch (50 Cards)
            </Button>
          </div>
        }
      />

      {/* Info Banner on Dynamic Routing architecture */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Bulk 50-Card Dynamic QR + NFC Generation</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Every batch automatically creates live database cards with unique cryptographic tokens (
                <code className="bg-slate-950 px-1.5 py-0.5 rounded text-brand-300 font-mono text-[11px]">
                  {APP_CONFIG.dynamicBaseUrl}/c/&#123;PUBLIC_TOKEN&#125;
                </code>
                ) and allows 1-click bulk QR ZIP downloading.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/qr-generator')}
            className="bg-slate-800/80 text-white border-slate-600 hover:bg-slate-700 shrink-0"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Bulk QR Export
          </Button>
        </div>
      </div>

      {/* Batches Table */}
      {isLoading ? (
        <LoadingState message="Loading card batches..." />
      ) : (
        <Table
          columns={columns}
          data={batches}
          keyExtractor={b => b.id}
          emptyState={
            <EmptyState
              icon={Layers}
              title="No batches generated"
              description="Create a batch to generate cards for a client in bulk with unique public tokens."
              actionLabel="Create 50-Card Batch"
              onAction={handleOpenCreate}
              actionIcon={<Plus className="w-4 h-4" />}
            />
          }
        />
      )}

      {/* Create Batch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate New Card Batch"
        description="Select client, quantity (default 50), and initial Google Review destination URL."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <Select
              label="Select Client"
              required
              value={formData.client_id}
              onChange={e => setFormData({ ...formData, client_id: e.target.value })}
              options={clients.map(c => ({
                value: c.id,
                label: `${c.business_name} (${c.contact_name})`,
              }))}
            />
          </div>

          <div>
            <Input
              label="Batch Name (Optional)"
              placeholder="e.g. ABC-Salon-Spring-Promo"
              value={formData.batch_name}
              onChange={e => setFormData({ ...formData, batch_name: e.target.value })}
              helperText="Leave empty to auto-generate based on client name"
            />
          </div>

          <div>
            <Input
              label="Google Review URL (Initial Destination)"
              required
              type="url"
              placeholder="https://g.page/r/example-review/review"
              value={formData.destination_url}
              onChange={e => setFormData({ ...formData, destination_url: e.target.value })}
              helperText="The review URL users land on when scanning the dynamic card link"
              leftIcon={<LinkIcon className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="Card Quantity to Generate"
              type="number"
              min={1}
              max={500}
              required
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
              helperText="Generates individual cards directly in Supabase with unique 8-character tokens"
              leftIcon={<Hash className="w-4 h-4" />}
            />
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Batch Generation Details:</div>
            <div>• Generates {formData.quantity} physical cards registered in Supabase</div>
            <div>• Each card will receive a unique token (e.g. 7KQ4M8X2)</div>
            <div>• QR / NFC payload: <span className="font-mono text-brand-700">{APP_CONFIG.dynamicBaseUrl}/c/&#123;TOKEN&#125;</span></div>
            <div>• Includes instant 1-click Bulk QR ZIP export after creation</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Layers className="w-4 h-4" />}>
              Generate {formData.quantity} Cards in Supabase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post-Creation Success / Bulk Export Modal */}
      {newlyCreatedBatch && (
        <Modal
          isOpen={!!newlyCreatedBatch}
          onClose={() => setNewlyCreatedBatch(null)}
          title="Batch Created Successfully!"
          description={`Created "${newlyCreatedBatch.batch.batch_name}" with ${newlyCreatedBatch.cards.length} live cards.`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">All {newlyCreatedBatch.cards.length} cards are live in Supabase!</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Card sequence: {newlyCreatedBatch.cards[0]?.internal_card_no} — {newlyCreatedBatch.cards[newlyCreatedBatch.cards.length - 1]?.internal_card_no}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div><strong>Batch:</strong> {newlyCreatedBatch.batch.batch_name}</div>
              <div><strong>Client:</strong> {newlyCreatedBatch.batch.client_name}</div>
              <div><strong>Destination:</strong> <code className="font-mono text-slate-700">{newlyCreatedBatch.batch.destination_url}</code></div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={async () => {
                  await exportCardsQrZip(newlyCreatedBatch.cards, {
                    zipFilename: `${newlyCreatedBatch.batch.batch_name}_${newlyCreatedBatch.cards.length}_QRs.zip`,
                  });
                  success('Downloaded Batch QR Package', 'ZIP archive saved to your downloads.');
                }}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Download All {newlyCreatedBatch.cards.length} QR Codes (.ZIP)
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setNewlyCreatedBatch(null);
                  navigate('/cards');
                }}
                leftIcon={<Eye className="w-4 h-4" />}
                className="w-full"
              >
                View Cards in Inventory
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Batch Confirmation */}
      <ConfirmDialog
        isOpen={!!batchToDelete}
        onClose={() => setBatchToDelete(null)}
        onConfirm={handleConfirmDeleteBatch}
        title="Delete Batch & Cards"
        message={`Are you sure you want to delete batch "${batchToDelete?.batch_name}"? This will also remove the ${batchToDelete?.quantity} cards generated in this batch.`}
        confirmText="Delete Batch"
        isLoading={isDeleting}
      />
    </div>
  );
};
