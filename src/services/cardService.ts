import { Card, CardStatus } from '../types';
import { generatePublicToken, formatCardNumber, getDynamicUrl } from '../utils';
import { supabase } from '../lib/supabase';
import { normalizeCardStatus, toDbStatus } from '../lib/constants';

export interface CreateCardInput {
  destination_url?: string | null;
  client_id?: string;
  client_name?: string;
  batch_id?: string;
  batch_name?: string;
  status?: CardStatus;
}

export interface CreatedCardResult {
  id: string;
  internal_card_no: string;
  public_token: string;
  destination_url: string | null;
  status: CardStatus;
  scan_count: number;
  dynamic_url: string;
}

interface SupabaseCardRow {
  id: string;
  internal_card_no: string;
  public_token: string;
  destination_url: string | null;
  status: string;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

function mapRowToCard(row: SupabaseCardRow): Card {
  return {
    id: row.id,
    internal_card_no: row.internal_card_no,
    public_token: row.public_token,
    destination_url: row.destination_url || '',
    original_url: row.destination_url || '',
    status: normalizeCardStatus(row.status),
    scan_count: row.scan_count || 0,
    total_scans: row.scan_count || 0,
    dynamic_url: getDynamicUrl(row.public_token),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const cardService = {
  /**
   * Get all cards from Supabase public.cards table
   */
  async getCards(): Promise<Card[]> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards from Supabase:', error);
      throw new Error(`Failed to load cards: ${error.message}`);
    }

    return (data as SupabaseCardRow[] || []).map(mapRowToCard);
  },

  /**
   * Fetch single card by internal_card_no or UUID id
   */
  async getCardById(id: string): Promise<Card | null> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .or(`id.eq.${id},internal_card_no.ilike.${id}`)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching card ${id}:`, error);
      throw new Error(`Failed to load card: ${error.message}`);
    }

    if (!data) return null;
    return mapRowToCard(data as SupabaseCardRow);
  },

  /**
   * Fetch single card by public token
   */
  async getCardByToken(token: string): Promise<Card | null> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const cleanToken = token.trim().toUpperCase();

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .ilike('public_token', cleanToken)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching card by token ${token}:`, error);
      throw new Error(`Failed to load card: ${error.message}`);
    }

    if (!data) return null;
    return mapRowToCard(data as SupabaseCardRow);
  },

  /**
   * Create a real card in Supabase with unique internal_card_no and secure random public_token
   */
  async createCard(input?: string | CreateCardInput): Promise<CreatedCardResult> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    let rawDestination: string | null = null;
    if (typeof input === 'string') {
      rawDestination = input.trim();
    } else if (input?.destination_url) {
      rawDestination = input.destination_url.trim();
    }

    // Validate URL if provided
    let destinationUrl: string | null = null;
    if (rawDestination && rawDestination.length > 0) {
      try {
        const parsed = new URL(rawDestination);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Protocol must be http: or https:');
        }
        destinationUrl = rawDestination;
      } catch {
        throw new Error('Invalid destination URL. Must be a valid HTTP or HTTPS URL (e.g. https://example.com)');
      }
    }

    // Determine next sequential CARD-XXXX number from database
    const { data: existingCards, error: listError } = await supabase
      .from('cards')
      .select('internal_card_no');

    if (listError) {
      console.error('Error querying existing card numbers:', listError);
      throw new Error(`Failed to verify card sequence: ${listError.message}`);
    }

    let maxNum = 0;
    if (existingCards) {
      for (const row of existingCards) {
        const match = row.internal_card_no?.match(/CARD-(\d+)/i);
        if (match && match[1]) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) {
            maxNum = n;
          }
        }
      }
    }
    const internalCardNo = formatCardNumber(maxNum + 1);

    // Generate collision-safe random public token (8 chars uppercase)
    let token = generatePublicToken(8);
    let attempts = 0;
    while (attempts < 10) {
      attempts++;
      const { data: tokenCheck } = await supabase
        .from('cards')
        .select('id')
        .ilike('public_token', token)
        .maybeSingle();

      if (!tokenCheck) {
        break;
      }
      token = generatePublicToken(8);
    }

    const { data, error } = await supabase
      .from('cards')
      .insert({
        internal_card_no: internalCardNo,
        public_token: token,
        destination_url: destinationUrl,
        status: 'READY',
        scan_count: 0,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error inserting card to Supabase:', error);
      throw new Error(`Failed to create card: ${error?.message || 'Database insert failed'}`);
    }

    const cardRow = data as SupabaseCardRow;
    const dynamicUrl = getDynamicUrl(cardRow.public_token);

    return {
      id: cardRow.id,
      internal_card_no: cardRow.internal_card_no,
      public_token: cardRow.public_token,
      destination_url: cardRow.destination_url,
      status: normalizeCardStatus(cardRow.status),
      scan_count: cardRow.scan_count || 0,
      dynamic_url: dynamicUrl,
    };
  },

  /**
   * Update destination URL without changing token, card number, dynamic URL, or QR/NFC
   */
  async updateCardDestination(id: string, newDestinationUrl: string): Promise<Card> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const trimmed = newDestinationUrl.trim();
    if (!trimmed) {
      throw new Error('Destination URL cannot be empty.');
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Protocol must be http: or https:');
      }
    } catch {
      throw new Error('Invalid destination URL. Must be a valid HTTP or HTTPS URL (e.g. https://example.com)');
    }

    const { data, error } = await supabase
      .from('cards')
      .update({
        destination_url: trimmed,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${id},internal_card_no.ilike.${id}`)
      .select()
      .single();

    if (error || !data) {
      console.error(`Error updating destination for card ${id}:`, error);
      throw new Error(`Failed to update destination: ${error?.message || 'Card not found'}`);
    }

    return mapRowToCard(data as SupabaseCardRow);
  },

  /**
   * Update card status (READY / DISABLED / etc.)
   */
  async updateCardStatus(id: string, status: CardStatus): Promise<Card> {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const dbStatus = toDbStatus(status);

    const { data, error } = await supabase
      .from('cards')
      .update({
        status: dbStatus,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${id},internal_card_no.ilike.${id}`)
      .select()
      .single();

    if (error || !data) {
      console.error(`Error updating status for card ${id}:`, error);
      throw new Error(`Failed to update card status: ${error?.message || 'Card not found'}`);
    }

    return mapRowToCard(data as SupabaseCardRow);
  },

  /**
   * Increment scan count atomically via RPC and return updated card
   */
  async recordCardScan(token: string): Promise<Card | null> {
    if (!supabase) return null;

    const cleanToken = token.trim().toUpperCase();

    const { data, error } = await supabase.rpc('resolve_and_increment_scan', {
      token_input: cleanToken,
    });

    if (error) {
      console.error(`Error recording scan for token ${cleanToken}:`, error);
      return null;
    }

    if (data && data.length > 0) {
      const row = data[0];
      return {
        id: row.id,
        internal_card_no: row.internal_card_no,
        public_token: row.public_token,
        destination_url: row.destination_url || '',
        status: normalizeCardStatus(row.status),
        scan_count: row.scan_count || 0,
        total_scans: row.scan_count || 0,
        dynamic_url: getDynamicUrl(row.public_token),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return null;
  },
};
