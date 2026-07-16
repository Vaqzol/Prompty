'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { trackCopy } from '@/lib/actions/copy';

export default function ActionCopyBtn({ text, postId, initialCount }: { text: string, postId: string, initialCount: number }) {
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(initialCount);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCount(prev => prev + 1);
      setTimeout(() => setCopied(false), 2000);
      await trackCopy(postId);
    } catch { /* fallback */ }
  };

  return (
    <button className="action-btn" onClick={handleCopy} style={copied ? { color: '#22c55e' } : {}}>
      <Copy size={18} /> {count}
    </button>
  );
}
