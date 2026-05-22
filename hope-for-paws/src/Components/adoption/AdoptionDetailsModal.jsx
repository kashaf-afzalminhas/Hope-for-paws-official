import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { MapPin, MessageSquare, PawPrint, X } from 'lucide-react';
import {
  adoptionTagClass,
  adoptionTagMutedClass,
  getPostStatusBadge,
  getHealthFieldChipStyle,
  getPosterProfileId,
} from './adoptionTheme';

const AdoptionDetailsModal = ({
  post,
  onClose,
  imageFailed,
  onImageError,
  posterAvatarUrl,
  canChat,
  onChat,
}) => {
  if (!post) return null;

  const posterProfileId = getPosterProfileId(post);
  const statusBadge = getPostStatusBadge(post.status);
  const vaccinatedChip = post.vaccinated
    ? getHealthFieldChipStyle('vaccinated', post.vaccinated, post.status)
    : null;
  const neuteredChip = post.neuteredSpayed
    ? getHealthFieldChipStyle('neutered', post.neuteredSpayed, post.status)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adoption-details-title"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e8dcc8] bg-white px-6 py-4">
          <h2 id="adoption-details-title" className="text-xl font-bold text-[#4E3B31] sm:text-2xl">
            Pet details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#6F4C3E]/60 transition hover:bg-[#f5efe6] hover:text-[#4E3B31]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="border-b border-[#efe4d8] bg-[#faf6f0] px-6 py-4">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#faf6f0] to-[#efe4d8]">
              <div className="flex min-h-[200px] items-center justify-center">
                {imageFailed ? (
                  <div className="flex flex-col items-center py-16 text-[#6F4C3E]">
                    <PawPrint className="mb-3 h-12 w-12 text-[#a07855]/60" />
                    <p className="text-sm font-medium">Photo unavailable</p>
                  </div>
                ) : (
                  <img
                    src={post.imageUrl}
                    alt={`${post.name} – ${post.petType || 'pet'}`}
                    className="max-h-[min(50vh,400px)] w-full object-contain"
                    onError={onImageError}
                  />
                )}
              </div>
              <div className="pointer-events-none absolute right-3 top-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-md ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div>
              <h3 className="mb-2 text-2xl font-bold text-[#4E3B31] sm:text-3xl">{post.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {post.petType && <span className={adoptionTagClass}>{post.petType}</span>}
                {post.breed && <span className={adoptionTagMutedClass}>{post.breed}</span>}
                {post.age != null && post.age !== '' && (
                  <span className="text-base font-medium text-[#8B5A2B]">{post.age} old</span>
                )}
              </div>
            </div>

            {(vaccinatedChip || neuteredChip) && (
              <div className="flex flex-wrap gap-2">
                {vaccinatedChip && (
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${vaccinatedChip.className}`}>
                    {vaccinatedChip.label}
                  </span>
                )}
                {neuteredChip && (
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${neuteredChip.className}`}>
                    {neuteredChip.label}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 text-[#6F4C3E]">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#a07855]" />
              <span>{post.location || 'Location not specified'}</span>
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-[#4E3B31]">About {post.name}</h4>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-[#4E3B31]/75">
                {post.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#efe4d8] pt-4">
              <div className="flex min-w-0 items-center gap-2 text-sm text-[#6F4C3E]/80">
                {posterAvatarUrl ? (
                  <img
                    src={posterAvatarUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0e6d8] text-xs font-bold text-[#6b493d]">
                    {(post.userId?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate">
                  Posted by{' '}
                  {posterProfileId ? (
                    <Link
                      to={`/profile/public/${posterProfileId}`}
                      className="font-semibold text-[#6b493d] hover:underline"
                    >
                      {post.userId?.username || 'Anonymous'}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#6b493d]">
                      {post.userId?.username || 'Anonymous'}
                    </span>
                  )}
                </span>
              </div>
              {canChat && onChat && (
                <button
                  type="button"
                  onClick={onChat}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-[#6b493d]/10 px-3 py-1.5 text-xs font-medium text-[#6b493d] hover:bg-[#6b493d]/20"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AdoptionDetailsModal.propTypes = {
  post: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  imageFailed: PropTypes.bool,
  onImageError: PropTypes.func,
  posterAvatarUrl: PropTypes.string,
  canChat: PropTypes.bool,
  onChat: PropTypes.func,
};

export default AdoptionDetailsModal;
