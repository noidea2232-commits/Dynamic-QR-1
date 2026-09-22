import { CardStatus, ClientStatus, BatchStatus } from '../types';

export const APP_CONFIG = {
  appName: 'CardSync CRM',
  tagline: 'Dynamic QR + NFC Card Infrastructure',
  version: '2.0.0-production',
  dynamicBaseUrl:
    import.meta.env.VITE_DYNAMIC_BASE_URL || 'https://dynamic-qr-1.vercel.app',
  dynamicPathPrefix: '/c/',
  defaultGoogleReviewUrl: 'https://example.com/google-review-test',
};

export const CARD_STATUS_CONFIG: Record<CardStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'Draft': {
    label: 'Draft',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  'Link Pending': {
    label: 'Link Pending',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'Ready': {
    label: 'Ready',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  'Printed': {
    label: 'Printed',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  'Delivered': {
    label: 'Delivered',
    color: 'text-teal-800',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  'Sold': {
    label: 'Sold',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'Disabled': {
    label: 'Disabled',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  'Archived': {
    label: 'Archived',
    color: 'text-zinc-600',
    bg: 'bg-zinc-100',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
};

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string; border: string }> = {
  'Active': {
    label: 'Active',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'Inactive': {
    label: 'Inactive',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  'Archived': {
    label: 'Archived',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

export const BATCH_STATUS_CONFIG: Record<BatchStatus, { label: string; color: string; bg: string; border: string }> = {
  'Draft': {
    label: 'Draft',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  'Processing': {
    label: 'Processing',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  'Completed': {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'Archived': {
    label: 'Archived',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

export const ALL_CARD_STATUSES: CardStatus[] = [
  'Ready',
  'Disabled',
  'Draft',
  'Link Pending',
  'Printed',
  'Delivered',
  'Sold',
  'Archived',
];

export function normalizeCardStatus(statusStr: string | null | undefined): CardStatus {
  if (!statusStr) return 'Ready';
  const clean = statusStr.toUpperCase().replace(/[\s_-]+/g, '_');
  switch (clean) {
    case 'READY':
      return 'Ready';
    case 'DISABLED':
      return 'Disabled';
    case 'DRAFT':
      return 'Draft';
    case 'LINK_PENDING':
    case 'LINKPENDING':
      return 'Link Pending';
    case 'PRINTED':
      return 'Printed';
    case 'DELIVERED':
      return 'Delivered';
    case 'SOLD':
      return 'Sold';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'Ready';
  }
}

export function toDbStatus(status: CardStatus | string): string {
  const clean = status.toUpperCase().replace(/[\s_-]+/g, '_');
  switch (clean) {
    case 'READY':
      return 'READY';
    case 'DISABLED':
      return 'DISABLED';
    case 'DRAFT':
      return 'DRAFT';
    case 'LINK_PENDING':
    case 'LINKPENDING':
      return 'LINK_PENDING';
    case 'PRINTED':
      return 'PRINTED';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'SOLD':
      return 'SOLD';
    case 'ARCHIVED':
      return 'ARCHIVED';
    default:
      return 'READY';
  }
}
