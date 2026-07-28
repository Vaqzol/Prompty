'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { trackCopy } from '@/lib/actions/copy';

interface CopyBtnProps {
  text: string;
  postId: string;
  onCopyStart?: () => void;
}

export default function CopyBtn({ text, postId, onCopyStart }: CopyBtnProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      onCopyStart?.();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackCopy(postId);
    } catch {
      /* fallback */
    }
  };

  return (
    <button
      className="post-code-copy"
      onClick={handleCopy}
      style={copied ? { color: '#22c55e' } : {}}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  );
}
