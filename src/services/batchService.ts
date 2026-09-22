import { Batch, Card } from '../types';
import { db } from './storage';
import { clientService } from './clientService';
import { cardService } from './cardService';

export const batchService = {
  async getBatches(): Promise<Batch[]> {
    return db.getBatches();
  },

  async getBatchById(id: string): Promise<Batch | null> {
    const batches = db.getBatches();
    return batches.find(b => b.id === id) || null;
  },

  async createBatch(data: {
    client_id: string;
    destination_url: string;
    quantity: number;
    batch_name?: string;
  }): Promise<{ batch: Batch; generatedCards: Card[] }> {
    const client = await clientService.getClientById(data.client_id);
    if (!client) {
      throw new Error(`Client ${data.client_id} not found`);
    }

    const batches = db.getBatches();
    const batchId = `batch_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const clientShortName = client.business_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const batchName = data.batch_name?.trim() || `${clientShortName}-Batch-${batches.length + 1}`;

    const newBatch: Batch = {
      id: batchId,
      client_id: client.id,
      client_name: client.business_name,
      batch_name: batchName,
      quantity: data.quantity,
      status: 'Completed',
      destination_url: data.destination_url.trim(),
      created_at: now,
    };

    // Bulk generate cards directly into Supabase database
    const generatedCards = await cardService.createCardsBulk({
      quantity: data.quantity,
      destination_url: data.destination_url.trim(),
      status: 'Ready',
      client_id: client.id,
      client_name: client.business_name,
      batch_id: batchId,
      batch_name: batchName,
    });

    // Save batch record
    db.saveBatches([newBatch, ...batches]);

    db.logActivity({
      action: 'Batch Created',
      description: `Batch "${batchName}" (${data.quantity} cards) generated in Supabase for ${client.business_name}`,
      type: 'batch',
      entity_id: newBatch.id,
    });

    return { batch: newBatch, generatedCards };
  },

  async deleteBatch(batchId: string, deleteCards = true): Promise<void> {
    const batches = db.getBatches();
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    if (deleteCards) {
      // Find cards associated with this batch in local storage or by batch_id
      const allCards = db.getCards();
      const batchCardIds = allCards.filter(c => c.batch_id === batchId).map(c => c.id);
      if (batchCardIds.length > 0) {
        try {
          await cardService.deleteCardsBulk(batchCardIds);
        } catch (err) {
          console.warn('Error deleting cards associated with batch from Supabase:', err);
        }
      }
    }

    const remaining = batches.filter(b => b.id !== batchId);
    db.saveBatches(remaining);

    db.logActivity({
      action: 'Batch Deleted',
      description: `Batch "${batch.batch_name}" was deleted`,
      type: 'batch',
      entity_id: batchId,
    });
  },

  async wipeAllBatches(): Promise<void> {
    db.saveBatches([]);
  },
};
