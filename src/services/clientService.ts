import { Client, ClientStatus } from '../types';
import { db } from './storage';

export const clientService = {
  async getClients(): Promise<Client[]> {
    const clients = db.getClients();
    const cards = db.getCards();

    // Dynamically calculate card counts
    return clients.map(client => ({
      ...client,
      card_count: cards.filter(c => c.client_id === client.id).length,
    }));
  },

  async getClientById(id: string): Promise<Client | null> {
    const clients = await this.getClients();
    return clients.find(c => c.id === id) || null;
  },

  async createClient(data: {
    business_name: string;
    contact_name: string;
    phone: string;
    email: string;
    notes?: string;
    status?: ClientStatus;
  }): Promise<Client> {
    const clients = db.getClients();
    const newClient: Client = {
      id: `cli_${Date.now().toString(36)}`,
      business_name: data.business_name.trim(),
      contact_name: data.contact_name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      notes: data.notes?.trim() || '',
      status: data.status || 'Active',
      created_at: new Date().toISOString(),
      card_count: 0,
    };

    db.saveClients([newClient, ...clients]);

    db.logActivity({
      action: 'New Client Created',
      description: `Client "${newClient.business_name}" registered by admin`,
      type: 'client',
      entity_id: newClient.id,
    });

    return newClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const clients = db.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Client with ID ${id} not found`);
    }

    const updated = {
      ...clients[index],
      ...updates,
    };

    clients[index] = updated;
    db.saveClients(clients);

    // Update client_name in cards if business_name changed
    if (updates.business_name) {
      const cards = db.getCards();
      const updatedCards = cards.map(card =>
        card.client_id === id ? { ...card, client_name: updates.business_name! } : card
      );
      db.saveCards(updatedCards);
    }

    db.logActivity({
      action: 'Client Updated',
      description: `Client details updated for "${updated.business_name}"`,
      type: 'client',
      entity_id: updated.id,
    });

    return updated;
  },

  async archiveClient(id: string): Promise<Client> {
    return this.updateClient(id, { status: 'Archived' });
  },

  async deleteClient(id: string): Promise<void> {
    const clients = db.getClients().filter(c => c.id !== id);
    db.saveClients(clients);

    db.logActivity({
      action: 'Client Deleted',
      description: `Client record was removed`,
      type: 'client',
      entity_id: id,
    });
  },

  async wipeAllClients(): Promise<void> {
    db.saveClients([]);
    db.logActivity({
      action: 'Clients Wiped',
      description: 'All client profiles were cleared',
      type: 'client',
    });
  },
};
