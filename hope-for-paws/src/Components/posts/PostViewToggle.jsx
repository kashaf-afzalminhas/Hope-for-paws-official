import React from 'react';
import { GalleryHorizontal, LayoutGrid } from 'lucide-react';

const PostViewToggle = ({ value, onChange, className = '' }) => (
  <div className={`inline-flex items-center gap-1 rounded-full bg-sand-light p-1 ${className}`}>
    <button type="button" onClick={() => onChange('grid')} aria-label="Grid view" aria-pressed={value === 'grid'} className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${value === 'grid' ? 'bg-white text-clay shadow-warm-sm' : 'text-ink-soft hover:text-ink'}`}>
      <LayoutGrid className="h-4 w-4" />
    </button>
    <button type="button" onClick={() => onChange('slide')} aria-label="Slide view" aria-pressed={value === 'slide'} className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${value === 'slide' ? 'bg-white text-clay shadow-warm-sm' : 'text-ink-soft hover:text-ink'}`}>
      <GalleryHorizontal className="h-4 w-4" />
    </button>
  </div>
);

export default PostViewToggle;