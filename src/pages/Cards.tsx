import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Copy,
  Eye,
  Edit2,
  Plus,
  QrCode,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Table, Column } from '../components/ui/Table';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { SearchInput } from '../components/ui/SearchInput';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { cardService } from '../services/cardService';
import { Card, CardStatus } from '../types';
import { formatDate, getDynamicUrl, copyToClipboard } from '../utils';
import { ALL_CARD_STATUSES } from '../lib/constants';
import { useToast } from '../hooks/useToast';

export const Cards: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal for Create Card
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Modal for Edit Destination / Status Change
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDestinationUrl, setEditDestinationUrl] = useState('');
  const [editStatus, setEditStatus] = useState<CardStatus>('Ready');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const cardsData = await cardService.getCards();
      setCards(cardsData);
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

  // Filter effect
  useEffect(() => {
    let result = [...cards];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.internal_card_no.toLowerCase().includes(q) ||
          c.public_token.toLowerCase().includes(q) ||
          c.destination_url.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredCards(result);
  }, [cards, searchQuery, statusFilter]);

  const handleCopy = async (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getDynamicUrl(card.public_token);
    const copied = await copyToClipboard(url);
    if (copied) {
      success('Copied Dynamic URL', url);
    } else {
      error('Failed to copy URL');
    }
  };

  const handleOpenEdit = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCard(card);
    setEditDestinationUrl(card.destination_url);
    setEditStatus(card.status);
    setIsEditModalOpen(true);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const created = await cardService.createCard({
        destination_url: newDestinationUrl.trim() || undefined,
      });
      success(
        'Card Created Successfully',
        `${created.internal_card_no} with token ${created.public_token} registered in Supabase`
      );
      setIsCreateModalOpen(false);
      setNewDestinationUrl('');
      await loadData();
    } catch (err) {
      error('Failed to create card', (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    setIsSaving(true);
    try {
      if (editDestinationUrl.trim() !== selectedCard.destination_url.trim()) {
        await cardService.updateCardDestination(selectedCard.id, editDestinationUrl.trim());
      }
      if (editStatus !== selectedCard.status) {
        await cardService.updateCardStatus(selectedCard.id, editStatus);
      }
      success('Card Updated', `Saved destination and status for ${selectedCard.internal_card_no}`);
      setIsEditModalOpen(false);
      await loadData();
    } catch (err) {
      error('Update failed', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Card>[] = [
    {
      header: 'Card Number',
      accessorKey: 'internal_card_no',
      cell: card => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900">{card.internal_card_no}</span>
        </div>
      ),
    },
    {
      header: 'Public Token',
      accessorKey: 'public_token',
      cell: card => (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {card.public_token}
        </span>
      ),
    },
    {
      header: 'Dynamic URL',
      cell: card => {
        const dynUrl = getDynamicUrl(card.public_token);
        return (
          <div className="max-w-xs truncate font-mono text-xs text-brand-700 font-medium" title={dynUrl}>
            {dynUrl}
          </div>
        );
      },
    },
    {
      header: 'Destination URL',
      accessorKey: 'destination_url',
      cell: card => (
        <div className="max-w-xs truncate text-xs font-mono text-slate-500" title={card.destination_url || 'Unset'}>
          {card.destination_url || <span className="text-slate-400 italic">None (Unassigned)</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: card => <StatusBadge status={card.status} type="card" size="sm" />,
    },
    {
      header: 'Scans',
      accessorKey: 'total_scans',
      cell: card => (
        <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-50 rounded">
          {card.total_scans || card.scan_count || 0}
        </span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: card => <span className="text-xs text-slate-500">{formatDate(card.created_at)}</span>,
    },
    {
      header: 'Actions',
      cell: card => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => handleCopy(card, e)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Copy Dynamic URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <a
            href={getDynamicUrl(card.public_token)}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Test Dynamic URL in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => navigate(`/cards/${card.id}`)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Card Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(card, e)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Destination / Status"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cards Inventory"
        description="Live physical PVC cards registered in the Supabase database. Real-time dynamic redirect & status management."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/qr-generator')}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              QR Generator
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Card
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search */}
          <div>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search card #, token, destination..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Statuses ({cards.length})</option>
              {ALL_CARD_STATUSES.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredCards.length}</strong> of{' '}
            <strong className="text-slate-800">{cards.length}</strong> real database cards
          </span>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-brand-600 hover:text-brand-800 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Cards Table or Error State */}
      {isLoading ? (
        <LoadingState message="Loading cards from Supabase database..." />
      ) : loadError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <div className="text-rose-700 font-semibold text-base">Failed to load cards from Supabase</div>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Connection
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredCards}
          keyExtractor={c => c.id}
          onRowClick={c => navigate(`/cards/${c.id}`)}
          emptyState={
            <EmptyState
              icon={CreditCard}
              title="No cards found"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'No cards match your current search and filter criteria.'
                  : 'No cards in the database yet. Click "Create Card" to add your first physical card.'
              }
              actionLabel={
                searchQuery || statusFilter !== 'all'
                  ? undefined
                  : 'Create First Card'
              }
              onAction={() => setIsCreateModalOpen(true)}
              actionIcon={<Plus className="w-4 h-4" />}
            />
          }
        />
      )}

      {/* Create Card Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Dynamic Card"
        description="Generates a unique internal card number and cryptographically secure random public token in Supabase."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCard} className="space-y-4">
          <div>
            <Input
              label="Destination URL (Optional)"
              type="url"
              value={newDestinationUrl}
              onChange={e => setNewDestinationUrl(e.target.value)}
              placeholder="https://example.com"
              helperText="Where users will be redirected. Can be assigned or updated at any time."
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Dynamic Card Specifications:</div>
            <div>• Internal Card #: Auto-incrementing (e.g. CARD-0005)</div>
            <div>• Public Token: Secure 8-character random token (e.g. X8KQ29LM)</div>
            <div>• Dynamic URL: Canonical <code className="font-mono text-brand-700">https://dynamic-qr-1.vercel.app/c/&#123;TOKEN&#125;</code></div>
            <div>• Status: Defaults to READY with scan count 0</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Card in Database
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Edit Modal */}
      {selectedCard && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit ${selectedCard.internal_card_no}`}
          description={`Update destination URL or status for token ${selectedCard.public_token}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveCard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Permanent Dynamic URL (NFC & QR payload)
              </label>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between">
                <span>{getDynamicUrl(selectedCard.public_token)}</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-sans">
                  Fixed
                </span>
              </div>
            </div>

            <div>
              <Input
                label="Destination URL"
                type="url"
                required
                value={editDestinationUrl}
                onChange={e => setEditDestinationUrl(e.target.value)}
                placeholder="https://example.com"
                helperText="Where users are forwarded when accessing the dynamic link"
              />
            </div>

            <div>
              <Select
                label="Card Lifecycle Status"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as CardStatus)}
                options={ALL_CARD_STATUSES.map(st => ({ value: st, label: st }))}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Changes to Supabase
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
