'use client';

import { useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import CopyBtn from '@/components/shared/CopyBtn';
import { trackCopy } from '@/lib/actions/copy';

interface CodeCopyBlockProps {
  content: string;
  language?: string | null;
  postId: string;
  maxLength?: number;
}

export default function CodeCopyBlock({
  content,
  language,
  postId,
  maxLength = 300,
}: CodeCopyBlockProps) {
  const isClickingRef = useRef(false);

  const handleNativeCopy = async () => {
    if (isClickingRef.current) return;
    try {
      await trackCopy(postId);
    } catch {
      /* fallback */
    }
  };

  const codeToDisplay =
    maxLength > 0 && content.length > maxLength
      ? content.slice(0, maxLength) + '...'
      : content;

  return (
    <div className="post-code-block" onCopy={handleNativeCopy}>
      <div className="post-code-header">
        <span className="post-code-lang">{language || 'Code'}</span>
        <CopyBtn
          text={content}
          postId={postId}
          onCopyStart={() => {
            isClickingRef.current = true;
            setTimeout(() => {
              isClickingRef.current = false;
            }, 500);
          }}
        />
      </div>
      <div className="post-code-content">
        <pre
          dangerouslySetInnerHTML={{
            __html: hljs.highlightAuto(codeToDisplay).value,
          }}
        />
      </div>
    </div>
  );
}
