import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, MessageSquare, PawPrint } from 'lucide-react';
import { useRequireAuth } from '../AuthGuard.jsx';
import {
  adoptionCardShellClass,
  adoptionContentClass,
  adoptionImageAspectClass,
  adoptionImageWrapClass,
  adoptionTagClass,
  adoptionTagMutedClass,
  getPostStatusBadge,
  getHealthFieldChipStyle,
  formatAdoptionDate,
} from './adoptionTheme.js';

const HealthChip = ({ label, className }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
  >
    {label}
  </span>
);

HealthChip.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};

const AdoptionCard = ({
  post,
  imageUrl,
  imageFailed = false,
  onImageError,
  descriptionLines = 3,
  className = '',
  listedDate,
  showHealth = true,
  showStatus = true,
  poster,
  meta,
  imageOverlay,
  children,
}) => {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const statusBadge = getPostStatusBadge(post?.status);
  const lineClamp =
    descriptionLines === 2 ? 'line-clamp-2' : descriptionLines === 4 ? 'line-clamp-4' : 'line-clamp-3';
  
  // Support both old (imageUrl) and new (imageUrls array) formats
  const getDisplayImage = () => {
    if (imageUrl) return imageUrl;
    if (post?.imageUrls && post.imageUrls.length > 0) return post.imageUrls[0];
    if (post?.imageUrl) return post.imageUrl;
    return null;
  };
  
  const displayImage = getDisplayImage();
  const listed = listedDate || (post?.createdAt ? formatAdoptionDate(post.createdAt) : '');

  return (
    <article className={`${adoptionCardShellClass} ${className}`.trim()}>
      <div className={adoptionImageWrapClass}>
        <div className={adoptionImageAspectClass}>
          {imageFailed || !displayImage ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-[#8B5A2B]/70">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white/60">
                <PawPrint className="h-7 w-7 text-[#a07855]" aria-hidden />
              </div>
              <p className="text-sm font-medium">Photo unavailable</p>
            </div>
          ) : (
            <img
              src={displayImage}
              alt={post?.name ? `${post.name} – ${post.petType || 'pet'}` : 'Adoption pet'}
              className="h-full w-full object-contain p-1 transition-transform duration-500 hover:scale-[1.02]"
              loading="lazy"
              onError={onImageError}
            />
          )}
        </div>
        {imageOverlay}
        {showStatus && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-md backdrop-blur-sm ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
        )}
      </div>

      <div className={adoptionContentClass}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-xl leading-tight text-[#4E3B31]">{post?.name}</h3>
          {post?.petType && <span className={adoptionTagClass}>{post.petType}</span>}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {post?.breed && <span className={adoptionTagMutedClass}>{post.breed}</span>}
          {post?.age != null && post.age !== '' && (
            <span className="text-sm font-medium text-[#8B5A2B]">{post.age} old</span>
          )}
        </div>

        {showHealth && (post?.vaccinated || post?.neuteredSpayed) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.vaccinated && (
              <HealthChip
                {...getHealthFieldChipStyle('vaccinated', post.vaccinated, post?.status)}
              />
            )}
            {post.neuteredSpayed && (
              <HealthChip
                {...getHealthFieldChipStyle('neutered', post.neuteredSpayed, post?.status)}
              />
            )}
          </div>
        )}

        <div className="mb-3 flex items-start gap-2 text-sm text-[#6F4C3E]/85">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#a07855]" aria-hidden />
          <span>{post?.location || 'Location not specified'}</span>
        </div>

        {post?.description && (
          <p className={`mb-4 flex-1 text-sm leading-relaxed text-[#4E3B31]/75 ${lineClamp}`}>
            {post.description}
          </p>
        )}

        {poster?.show !== false && (poster?.username || poster?.profileId) && (
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#efe4d8] pb-4">
            <div className="flex min-w-0 items-center gap-2 text-sm text-[#6F4C3E]/80">
              {poster.avatarUrl ? (
                <img
                  src={poster.avatarUrl}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover ring-2 ring-white"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e6d8] text-xs font-bold text-[#6b493d]">
                  {(poster.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate">
                Posted by{' '}
                {poster.profileId ? (
                  <Link
                    to={`/profile/public/${poster.profileId}`}
                    className="font-semibold text-[#6b493d] hover:underline underline-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth('view this user\'s profile')) e.preventDefault();
                    }}
                  >
                    {poster.username || 'Anonymous'}
                  </Link>
                ) : (
                  <span className="font-semibold text-[#6b493d]">{poster.username || 'Anonymous'}</span>
                )}
              </span>
            </div>
            {poster.onChat && (
              <button
                type="button"
                onClick={poster.onChat}
                className="flex shrink-0 items-center gap-1 rounded-full bg-[#6b493d]/10 px-3 py-1.5 text-xs font-medium text-[#6b493d] transition hover:bg-[#6b493d]/20"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
            )}
          </div>
        )}

        {meta}

        {listed && !children && (
          <p className="mt-auto text-xs text-[#6F4C3E]/50">Listed {listed}</p>
        )}

        {children && <div className="mt-auto space-y-2.5 pt-1">{children}</div>}
      </div>
    </article>
  );
};

AdoptionCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    petType: PropTypes.string,
    breed: PropTypes.string,
    vaccinated: PropTypes.string,
    neuteredSpayed: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    status: PropTypes.string,
    imageUrl: PropTypes.string,
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    userId: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }).isRequired,
  imageUrl: PropTypes.string,
  imageFailed: PropTypes.bool,
  onImageError: PropTypes.func,
  descriptionLines: PropTypes.number,
  className: PropTypes.string,
  listedDate: PropTypes.string,
  showHealth: PropTypes.bool,
  showStatus: PropTypes.bool,
  poster: PropTypes.shape({
    show: PropTypes.bool,
    profileId: PropTypes.string,
    username: PropTypes.string,
    avatarUrl: PropTypes.string,
    onChat: PropTypes.func,
  }),
  meta: PropTypes.node,
  imageOverlay: PropTypes.node,
  children: PropTypes.node,
};

export default AdoptionCard;
