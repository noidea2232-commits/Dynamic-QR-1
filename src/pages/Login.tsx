import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { APP_CONFIG } from '../lib/constants';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@cardsync.io');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      success('Welcome back!', 'Authenticated as CRM Administrator');
      navigate('/dashboard');
    } catch {
      error('Authentication failed', 'Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 text-slate-950">
            <QrCode className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          {APP_CONFIG.appName}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-300 font-medium">
          Admin CRM for Dynamic QR & NFC Physical Cards
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 backdrop-blur-xl sm:px-10">
          <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-brand-950/60 border border-brand-800/40 text-brand-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              <strong>Phase 1 Mock Mode:</strong> Sign in with pre-filled credentials.
            </span>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Admin Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="admin@cardsync.io"
                className="bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 py-2.5"
              >
                Sign In to Dashboard
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-mono">
              Dynamic Domain: <span className="text-slate-400">{APP_CONFIG.dynamicBaseUrl}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
