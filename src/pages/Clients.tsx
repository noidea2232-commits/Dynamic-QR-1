import React, { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  Edit2,
  Archive,
  Building2,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  FileText,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Table, Column } from '../components/ui/Table';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SearchInput } from '../components/ui/SearchInput';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { clientService } from '../services/clientService';
import { Client, ClientStatus } from '../types';
import { formatDate } from '../utils';
import { useToast } from '../hooks/useToast';

export const Clients: React.FC = () => {
  const { success, error } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [archivingClient, setArchivingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isWipeAllOpen, setIsWipeAllOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    phone: '',
    email: '',
    notes: '',
    status: 'Active' as ClientStatus,
  });

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      error('Failed to load clients', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Apply search & status filter
  useEffect(() => {
    let result = [...clients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.business_name.toLowerCase().includes(q) ||
          c.contact_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    setFilteredClients(result);
  }, [clients, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      business_name: '',
      contact_name: '',
      phone: '',
      email: '',
      notes: '',
      status: 'Active',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      business_name: client.business_name,
      contact_name: client.contact_name,
      phone: client.phone,
      email: client.email,
      notes: client.notes || '',
      status: client.status,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.contact_name) {
      error('Please fill required fields (Business Name & Contact Name)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData);
        success('Client updated', `Saved changes for ${formData.business_name}`);
      } else {
        await clientService.createClient(formData);
        success('Client created', `Added ${formData.business_name} successfully`);
      }
      setIsAddEditModalOpen(false);
      await loadClients();
    } catch (err) {
      error('Action failed', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingClient) return;
    setIsSubmitting(true);
    try {
      await clientService.archiveClient(archivingClient.id);
      success('Client archived', `${archivingClient.business_name} has been archived`);
      setArchivingClient(null);
      await loadClients();
    } catch (err) {
      error('Failed to archive', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsSubmitting(true);
    try {
      await clientService.deleteClient(clientToDelete.id);
      success('Client Deleted', `Removed ${clientToDelete.business_name}`);
      setClientToDelete(null);
      await loadClients();
    } catch (err) {
      error('Failed to delete client', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWipeAllClients = async () => {
    setIsSubmitting(true);
    try {
      await clientService.wipeAllClients();
      success('Clients Wiped', 'All client records have been cleared.');
      setIsWipeAllOpen(false);
      await loadClients();
    } catch (err) {
      error('Failed to wipe clients', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Client>[] = [
    {
      header: 'Business Name',
      accessorKey: 'business_name',
      cell: client => (
        <div>
          <span className="font-semibold text-slate-900 block">{client.business_name}</span>
          {client.notes && (
            <span className="text-xs text-slate-400 line-clamp-1">{client.notes}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Contact',
      accessorKey: 'contact_name',
      cell: client => (
        <div>
          <span className="text-slate-800 font-medium block">{client.contact_name}</span>
          <span className="text-xs text-slate-500">{client.email}</span>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: client => <span className="font-mono text-xs text-slate-600">{client.phone}</span>,
    },
    {
      header: 'Cards',
      accessorKey: 'card_count',
      cell: client => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-slate-100 text-slate-800">
          {client.card_count || 0}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: client => <StatusBadge status={client.status} type="client" size="sm" />,
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: client => <span className="text-xs text-slate-500">{formatDate(client.created_at)}</span>,
    },
    {
      header: 'Actions',
      cell: client => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setViewingClient(client)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="View Client"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(client)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Client"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {client.status !== 'Archived' && (
            <button
              onClick={() => setArchivingClient(client)}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Archive Client"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setClientToDelete(client)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Client Permanently"
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
        title="Clients Management"
        description="Register and manage business accounts, contact details, and card allocations."
        actions={
          <div className="flex items-center gap-2">
            {clients.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWipeAllOpen(true)}
                leftIcon={<Trash2 className="w-4 h-4 text-rose-600" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Wipe Clients Data
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
              Add Client
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by business, contact, email..."
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Statuses ({clients.length})</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading clients data..." />
      ) : (
        <Table
          columns={columns}
          data={filteredClients}
          keyExtractor={c => c.id}
          emptyState={
            <EmptyState
              icon={Building2}
              title="No clients found"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'No clients match your filter criteria. Try adjusting your search query.'
                  : 'Start by adding your first business client to assign physical PVC cards.'
              }
              actionLabel={searchQuery || statusFilter !== 'all' ? undefined : 'Add First Client'}
              onAction={handleOpenAdd}
              actionIcon={<Plus className="w-4 h-4" />}
            />
          }
        />
      )}

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingClient ? 'Edit Client Details' : 'Add New Client'}
        description={
          editingClient
            ? `Update profile and contact information for ${editingClient.business_name}`
            : 'Enter business information to create a new client account.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveClient} className="space-y-4">
          <Input
            label="Business Name"
            required
            placeholder="e.g. ABC Salon & Spa"
            value={formData.business_name}
            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person Name"
              required
              placeholder="e.g. Sarah Jenkins"
              value={formData.contact_name}
              onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="contact@business.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Internal Notes
            </label>
            <textarea
              rows={3}
              placeholder="Special instructions, card finishes, physical delivery notes..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingClient ? 'Save Changes' : 'Create Client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Client Details Modal */}
      {viewingClient && (
        <Modal
          isOpen={!!viewingClient}
          onClose={() => setViewingClient(null)}
          title={viewingClient.business_name}
          description="Client account summary & details"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Account Status</span>
              <StatusBadge status={viewingClient.status} type="client" />
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{viewingClient.contact_name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{viewingClient.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{viewingClient.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>{viewingClient.card_count || 0} PVC cards linked</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Registered: {formatDate(viewingClient.created_at)}</span>
              </div>
            </div>

            {viewingClient.notes && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs text-amber-900">
                <div className="font-semibold mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  Notes:
                </div>
                <p className="leading-relaxed">{viewingClient.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const client = viewingClient;
                  setViewingClient(null);
                  handleOpenEdit(client);
                }}
              >
                Edit Client
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setViewingClient(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!archivingClient}
        onClose={() => setArchivingClient(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Client"
        message={`Are you sure you want to archive "${archivingClient?.business_name}"? This client will be marked as Archived.`}
        confirmText="Archive Client"
        isLoading={isSubmitting}
      />

      {/* Delete Client Dialog */}
      <ConfirmDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDeleteClient}
        title={`Delete "${clientToDelete?.business_name}"`}
        message={`Are you sure you want to permanently delete client "${clientToDelete?.business_name}"?`}
        confirmText="Delete Client"
        isLoading={isSubmitting}
      />

      {/* Wipe All Clients Dialog */}
      <ConfirmDialog
        isOpen={isWipeAllOpen}
        onClose={() => setIsWipeAllOpen(false)}
        onConfirm={handleConfirmWipeAllClients}
        title="Wipe All Client Profiles"
        message="Are you sure you want to permanently delete all client accounts and business profiles? This action cannot be undone."
        confirmText="Wipe All Clients"
        isLoading={isSubmitting}
      />
    </div>
  );
};
