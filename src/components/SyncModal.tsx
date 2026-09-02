import React, { useState } from 'react';
import { SyncConfig, SyncState, JournalEntry } from '../types';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  Download, 
  Upload, 
  X, 
  Key, 
  ShieldCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import { exportJournalsAsJSON, exportJournalsAsMarkdown } from '../utils/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  syncState: SyncState;
  entries: JournalEntry[];
  onUpdateSyncConfig: (config: SyncConfig) => void;
  onTriggerSync: () => Promise<void>;
  onImportEntries: (imported: JournalEntry[]) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  syncState,
  entries,
  onUpdateSyncConfig,
  onTriggerSync,
  onImportEntries,
}) => {
  const [inputCode, setInputCode] = useState(syncConfig.syncCode);
  const [deviceName, setDeviceName] = useState(syncConfig.deviceName);
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncConfig.syncCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveConfig = async () => {
    const updated: SyncConfig = {
      ...syncConfig,
      syncCode: inputCode.trim().toUpperCase(),
      deviceName: deviceName.trim() || 'My Device',
    };
    onUpdateSyncConfig(updated);
    setIsSyncing(true);
    setStatusMsg('Vault updated. Synchronizing with cloud...');
    await onTriggerSync();
    setIsSyncing(false);
    setStatusMsg('Vault synchronized successfully!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleGenerateNewCode = async () => {
    try {
      const res = await fetch('/api/sync/generate-code', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.syncCode) {
          setInputCode(data.syncCode);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMsg('Syncing with cloud...');
    await onTriggerSync();
    setIsSyncing(false);
    setStatusMsg('Synced!');
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportEntries(parsed);
          setStatusMsg(`Successfully restored ${parsed.length} entries!`);
        } else {
          alert('Invalid backup format.');
        }
      } catch {
        alert('Could not parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#ffffff] rounded-2xl border border-[#ded5c6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#fbf9f5] border-b border-[#eee5d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#edf5f0] border border-[#cedfd5] flex items-center justify-center text-[#4a6b5d] shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#27302a]">
                Multi-Device Cloud Sync
              </h3>
              <p className="text-xs text-[#7d7362]">
                Seamlessly sync your private journals across all your browsers & devices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7c7365] hover:bg-[#f1ebe0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-[#fdfcf9]">
          {statusMsg && (
            <div className="p-3 rounded-xl bg-[#edf5f0] border border-[#c3dfce] text-xs font-medium text-[#2d523e] flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-[#4a6b5d]" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Sync Passkey Box */}
          <div className="p-4 rounded-xl bg-[#f7f4ec] border border-[#e2d9ca]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5a5040] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#d4af37]" />
                Your Cloud Vault Passkey
              </label>
              <button
                type="button"
                onClick={handleGenerateNewCode}
                className="text-[11px] font-medium text-[#4a6b5d] hover:underline"
              >
                Generate New Key
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. VERDANT-SANCTUARY-8924"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#dfd5c5] font-mono text-sm font-bold text-[#2d3630] tracking-wider focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
              />
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-white border border-[#dfd5c5] text-[#554d3f] hover:bg-[#f1ebe0] transition-colors"
                title="Copy Passkey"
              >
                {isCopied ? <Check className="w-4 h-4 text-[#4a6b5d]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="mt-2 text-[11px] text-[#7d7261] leading-normal">
              Enter this identical passkey on your other phone or laptop to instantly synchronize all journal entries and photo attachments.
            </p>
          </div>

          {/* Device Name Field */}
          <div>
            <label className="block text-xs font-medium text-[#5a5040] mb-1.5">
              Device Identifier
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. MacBook Pro, iPhone Safari"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#dfd5c5] text-xs text-[#2d3630] focus:outline-none focus:ring-1 focus:ring-[#4a6b5d]"
              />
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-xl bg-[#4a6b5d] text-white text-xs font-medium hover:bg-[#3d594d] transition-colors shadow-xs"
              >
                Save & Connect
              </button>
            </div>
          </div>

          {/* Sync Status & Stats */}
          <div className="p-4 rounded-xl bg-white border border-[#e5dcce] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f0ebd9] flex items-center justify-center text-[#4a6b5d]">
                <CloudCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#2d3630]">
                  {entries.length} Entries in Local Sanctuary
                </p>
                <p className="text-[11px] text-[#867b6b]">
                  {syncConfig.lastSyncTimestamp
                    ? `Last synced: ${new Date(syncConfig.lastSyncTimestamp).toLocaleTimeString()}`
                    : 'Ready to sync with lightweight backend'}
                </p>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#dfd5c5] text-xs font-medium text-[#4b4336] hover:bg-[#f1ebe0] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* Backup & Export Options */}
          <div className="pt-3 border-t border-[#ede4d7]">
            <p className="text-xs font-semibold text-[#5a5040] mb-2.5">
              Data Ownership & Offline Archives
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => exportJournalsAsJSON(entries)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white border border-[#dfd5c5] text-xs text-[#52483a] hover:bg-[#faf7f0] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#4a6b5d]" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => exportJournalsAsMarkdown(entries)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white border border-[#dfd5c5] text-xs text-[#52483a] hover:bg-[#faf7f0] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#b07d62]" />
                <span>Export MD</span>
              </button>
              <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white border border-[#dfd5c5] text-xs text-[#52483a] hover:bg-[#faf7f0] transition-colors cursor-pointer col-span-2 sm:col-span-1">
                <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#fbf9f5] border-t border-[#eee5d8] flex items-center justify-between text-xs text-[#7d7261]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4a6b5d]" />
            End-to-End Vault Isolated
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#f0ebd9] text-[#4b4336] font-medium hover:bg-[#e4ddc8]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
