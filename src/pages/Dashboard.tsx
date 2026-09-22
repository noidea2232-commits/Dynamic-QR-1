import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Activity,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
  Plus,
  QrCode,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table, Column } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { analyticsService } from '../services/analyticsService';
import { cardService } from '../services/cardService';
import { DashboardStats, Card } from '../types';
import { formatDate, getDynamicUrl } from '../utils';
import { useToast } from '../hooks/useToast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCards, setRecentCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Quick Create Card Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [statsData, cardsData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRecentCards(8),
      ]);
      setStats(statsData);
      setRecentCards(cardsData);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load dashboard metrics from Supabase';
      setLoadError(msg);
      error('Dashboard load error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const created = await cardService.createCard({
        destination_url: newDestinationUrl.trim() || undefined,
      });
      success(
        'Card Created Successfully',
        `${created.internal_card_no} with token ${created.public_token} created in Supabase`
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

  if (isLoading || (!stats && !loadError)) {
    return <LoadingState message="Loading live dashboard metrics from Supabase..." />;
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

  const cardColumns: Column<Card>[] = [
    {
      header: 'Card Number',
      accessorKey: 'internal_card_no',
      cell: card => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-900">{card.internal_card_no}</span>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {card.public_token}
          </span>
        </div>
      ),
    },
    {
      header: 'Dynamic URL',
      cell: card => {
        const url = getDynamicUrl(card.public_token);
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-brand-700 hover:text-brand-900 flex items-center gap-1 max-w-xs truncate"
            onClick={e => e.stopPropagation()}
          >
            <span className="truncate">{url}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        );
      },
    },
    {
      header: 'Destination URL',
      accessorKey: 'destination_url',
      cell: card => (
        <span className="text-xs font-mono text-slate-500 truncate max-w-xs block" title={card.destination_url}>
          {card.destination_url || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: card => <StatusBadge status={card.status} type="card" size="sm" />,
    },
    {
      header: 'Total Scans',
      accessorKey: 'total_scans',
      cell: card => (
        <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded text-xs">
          {card.total_scans || card.scan_count || 0}
        </span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: card => <span className="text-slate-500 text-xs">{formatDate(card.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Admin CRM Dashboard"
        description="Real-time production management of physical dynamic QR & NFC cards registered in Supabase."
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

      {/* Primary Key Stats Grid from Real Supabase Data */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Cards"
            value={stats.totalCards}
            icon={CreditCard}
            subtitle="Registered in Supabase cards table"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => navigate('/cards')}
          />
          <StatCard
            title="Active Cards"
            value={stats.activeCards}
            icon={CheckCircle2}
            subtitle="Ready for dynamic 302 redirects"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => navigate('/cards')}
          />
          <StatCard
            title="Total Scans"
            value={stats.totalScans}
            icon={Activity}
            subtitle="Real verified redirect events"
            iconBg="bg-brand-50"
            iconColor="text-brand-600"
            onClick={() => navigate('/cards')}
          />
          <StatCard
            title="Disabled Cards"
            value={stats.disabled}
            icon={Ban}
            subtitle="Blocked by Edge Function"
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
            onClick={() => navigate('/cards')}
          />
        </div>
      )}

      {/* Secondary Status Breakdown Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-emerald-900 font-medium">Ready Cards</div>
              <div className="text-lg font-bold text-emerald-950 font-mono">{stats.activeCards}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-amber-900 font-medium">Pending Destination</div>
              <div className="text-lg font-bold text-amber-950 font-mono">{stats.linkPending}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-rose-50/50">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-rose-900 font-medium">Disabled Cards</div>
              <div className="text-lg font-bold text-rose-950 font-mono">{stats.disabled}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Cards Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Cards</h2>
            <p className="text-xs text-slate-500">Real database records from Supabase public.cards</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cards')}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            View All Cards ({stats?.totalCards || 0})
          </Button>
        </div>

        <Table
          columns={cardColumns}
          data={recentCards}
          keyExtractor={card => card.id}
          onRowClick={card => navigate(`/cards/${card.id}`)}
        />
      </div>

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
              helperText="Where users will be redirected. Can be modified at any time without changing the QR/token."
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Dynamic Specifications:</div>
            <div>• Internal Card #: Auto-sequenced (e.g. CARD-0005)</div>
            <div>• Public Token: 8-char cryptographic random token</div>
            <div>• Dynamic URL: <code className="font-mono text-brand-700">https://dynamic-qr-1.vercel.app/c/&#123;TOKEN&#125;</code></div>
            <div>• Initial Status: READY (Scan count starts at 0)</div>
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
    </div>
  );
};
