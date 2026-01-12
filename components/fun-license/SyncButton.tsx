'use client';

import { useFormStatus } from 'react-dom';
import { RefreshCw } from 'lucide-react';

export default function SyncButton() {
  const { pending } = useFormStatus();

  return (
    <button 
        disabled={pending}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded font-bold transition-all disabled:opacity-50 border border-zinc-700"
    >
        <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
        {pending ? 'SYNCING...' : 'CHECK AGAIN'}
    </button>
  );
}