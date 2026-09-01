import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Mail, MoreHorizontal, Share2, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ShareLinkButton = ({ resourceType, resourceId, onShareCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const getShareDetails = () => {
    const path = resourceType === 'adoption'
      ? `/adoption/${resourceId}`
      : resourceType === 'product'
        ? `/product/${resourceId}`
        : `/posts/${resourceId}`;
    return {
      url: new URL(path, window.location.origin).href,
      title: resourceType === 'product' ? 'Hope For Paws product' : 'Hope For Paws listing',
    };
  };

  const recordShare = async () => {
    const endpoint = resourceType === 'adoption' ? 'adoptions' : resourceType === 'product' ? 'products' : 'posts';
    try {
      const response = await axios.post(`${API_BASE_URL}/${endpoint}/${resourceId}/share`);
      onShareCount?.(response.data.shareCount);
    } catch (error) {
      console.error('Error recording share:', error);
    }
  };

  const handleOpen = (event) => {
    event.stopPropagation();
    if (!resourceId) return;
    setIsOpen(true);
  };

  const handleCopy = async () => {
    if (sharing) return;
    const { url } = getShareDetails();
    setSharing(true);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      await recordShare();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this link to share:', url);
      await recordShare();
    } finally {
      setSharing(false);
    }
  };

  const handleNativeShare = async () => {
    const { url, title } = getShareDetails();
    if (!navigator.share) return;
    try {
      await navigator.share({ title, url });
      await recordShare();
      setIsOpen(false);
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Error sharing:', error);
    }
  };

  const handleExternalShare = (event, shareUrl) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    void recordShare();
  };

  const { url } = getShareDetails();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent('Hope For Paws');
  const gmailShareUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&su=${encodedTitle}&body=${encodedUrl}`;

  const shareDialog = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setIsOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Share link" className="w-full max-w-md rounded-2xl border border-sand bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-body text-lg font-bold text-ink">Share this link</h2>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-ink-soft hover:bg-sand-light" aria-label="Close share options"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-sand bg-sand-light p-3">
          <input readOnly value={url} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-ink focus:ring-0" aria-label="Share URL" />
          <button type="button" onClick={handleCopy} disabled={sharing} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-clay px-3 py-2 text-xs font-semibold text-white hover:bg-clay-deep disabled:opacity-60">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" onClick={(event) => handleExternalShare(event, `https://wa.me/?text=${encodedUrl}`)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-bold text-white">WhatsApp</button>
          <button type="button" onClick={(event) => handleExternalShare(event, gmailShareUrl)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6b493d] px-3 py-2.5 text-xs font-bold text-white"><Mail className="h-4 w-4" /> Email</button>
          {navigator.share && <button type="button" onClick={handleNativeShare} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sand bg-white px-3 py-2.5 text-xs font-bold text-ink hover:bg-sand-light"><MoreHorizontal className="h-4 w-4" /> More</button>}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button type="button" onClick={handleOpen} className="inline-flex items-center gap-1.5 rounded-full bg-sand-light px-3.5 py-1.5 text-xs font-body font-semibold text-ink transition-all hover:bg-sand/60" aria-label="Share">
        <Share2 className="h-4 w-4 text-ink-soft" />
        Share
      </button>
      {shareDialog && createPortal(shareDialog, document.body)}
    </>
  );
};

export default ShareLinkButton;
