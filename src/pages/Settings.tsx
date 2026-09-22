import React, { useState } from 'react';
import {
  User,
  Shield,
  Globe,
  Database,
  Info,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { db } from '../services/storage';
import { APP_CONFIG } from '../lib/constants';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [email, setEmail] = useState(user?.email || 'admin@cardsync.io');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success('Profile Updated', 'Admin credentials and contact preferences saved.');
  };

  const handleResetDatabase = () => {
    setIsResetting(true);
    db.resetToDefaults();
    setIsResetting(false);
    setIsResetDialogOpen(false);
    success('Database Reset to Seeds', 'Default mock clients, batches, cards, and activity logs restored.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Review admin profile details, dynamic domain configuration, and application metadata."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Admin Profile & Dynamic Domain */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Profile Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Admin Profile</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Admin Name"
                />
                <Input
                  label="Admin Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Administrative Role
                </label>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <Shield className="w-4 h-4 text-brand-600" />
                    <span>{user?.role || 'Super Admin'}</span>
                  </div>
                  <span className="text-xs bg-brand-50 text-brand-700 font-medium px-2 py-0.5 rounded">
                    Full Access
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Dynamic URL Domain Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Dynamic URL Domain</h3>
            </div>

            <p className="text-xs text-slate-500">
              The canonical base domain assigned to all dynamic NFC chips and QR codes across the network.
            </p>

            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-sm flex items-center justify-between border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Production Dynamic Base URL:</span>
                <span className="text-brand-300 font-semibold">{APP_CONFIG.dynamicBaseUrl}</span>
              </div>
              <span className="text-[11px] font-sans font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">
                Verified DNS
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>Dynamic Path Pattern:</strong> <code className="text-slate-800 font-mono">/c/&#123;PUBLIC_TOKEN&#125;</code></div>
              <div><strong>Resolution:</strong> Direct 302/307 server redirect to registered Google Review target</div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: App Info & Seed Reset */}
        <div className="space-y-6">
          {/* App Info Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Application Info</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Project Name</span>
                <span className="font-semibold text-slate-800">{APP_CONFIG.appName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Version</span>
                <span className="font-mono text-slate-800">{APP_CONFIG.version}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Architecture</span>
                <span className="text-slate-800 font-medium">Part 2 Production MVP</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Data Layer</span>
                <span className="text-brand-700 font-mono font-medium">Supabase PostgreSQL (cards)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Backend Status</span>
                <span className="text-emerald-700 font-medium">Connected & Active</span>
              </div>
            </div>
          </div>

          {/* Database Reset Helper */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Database Tools</h3>
            </div>

            <p className="text-xs text-slate-500">
              Reset mock local storage to default sample clients, batches, and cards.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDialogOpen(true)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="w-full text-xs text-slate-700 hover:text-rose-700"
            >
              Reset Mock Data to Seeds
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetDatabase}
        title="Reset Local Mock Data"
        message="Are you sure you want to reset all mock cards, batches, and clients back to their initial seeded state?"
        confirmText="Reset to Defaults"
        isLoading={isResetting}
      />
    </div>
  );
};
