import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ShareLinkButton = ({ resourceType, resourceId, onShareCount }) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async (event) => {
    event.stopPropagation();
    if (!resourceId || sharing) return;

    const path = resourceType === 'adoption' ? `/adoption/${resourceId}` : `/posts/${resourceId}`;
    const shareUrl = new URL(path, window.location.origin).href;
    setSharing(true);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this link to share:', shareUrl);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/${resourceType === 'adoption' ? 'adoptions' : 'posts'}/${resourceId}/share`);
      onShareCount?.(response.data.shareCount);
    } catch (error) {
      console.error('Error recording share:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center gap-1.5 rounded-full bg-sand-light px-3.5 py-1.5 text-xs font-body font-semibold text-ink transition-all hover:bg-sand/60 disabled:cursor-wait disabled:opacity-60"
      aria-label={copied ? 'Link copied' : 'Copy share link'}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4 text-ink-soft" />}
      {copied ? 'Link copied' : 'Share'}
      {!copied && <Copy className="h-3.5 w-3.5 text-ink-soft/70" />}
    </button>
  );
};

export default ShareLinkButton;
