import { DashboardStats, Card, DailyScanStat } from '../types';
import { cardService } from './cardService';

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const cards = await cardService.getCards();

    const totalCards = cards.length;
    const activeCards = cards.filter(c => ['Ready', 'Printed', 'Delivered', 'Sold'].includes(c.status)).length;
    const linkPending = cards.filter(c => c.status === 'Link Pending' || !c.destination_url).length;
    const printed = cards.filter(c => c.status === 'Printed').length;
    const delivered = cards.filter(c => c.status === 'Delivered').length;
    const sold = cards.filter(c => c.status === 'Sold').length;
    const disabled = cards.filter(c => c.status === 'Disabled').length;
    const totalScans = cards.reduce((acc, c) => acc + (c.total_scans || c.scan_count || 0), 0);

    return {
      totalCards,
      activeCards,
      linkPending,
      printed,
      delivered,
      sold,
      disabled,
      totalScans,
      scansToday: totalScans > 0 ? totalScans : 0,
    };
  },

  async getRecentCards(limit = 5): Promise<Card[]> {
    const cards = await cardService.getCards();
    return cards.slice(0, limit);
  },

  async getMostScannedCards(limit = 6): Promise<Card[]> {
    const cards = await cardService.getCards();
    return [...cards].sort((a, b) => (b.total_scans || 0) - (a.total_scans || 0)).slice(0, limit);
  },

  async getDailyScanTrend(): Promise<DailyScanStat[]> {
    const cards = await cardService.getCards();
    const totalScans = cards.reduce((acc, c) => acc + (c.total_scans || c.scan_count || 0), 0);

    const days: DailyScanStat[] = [];
    const baseDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({
        date: label,
        scans: i === 0 ? totalScans : 0,
      });
    }

    return days;
  },
};
