'use client';

import { useState } from 'react';
import { trackCopy } from '@/lib/actions/copy';
import { Copy, Check } from 'lucide-react';

export default function PromptCopyBlock({ text, postId }: { text: string, postId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackCopy(postId);
    } catch { /* fallback */ }
  };

  return (
    <div className="post-prompt-text">
      <button 
        className="post-prompt-indicator"
        onClick={handleCopy}
        title="คัดลอก Prompt"
      >
        {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
      </button>
      <p>{text}</p>
    </div>
  );
}
