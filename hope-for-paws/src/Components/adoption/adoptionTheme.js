/** Shared design tokens for adoption UI across the app */

export const adoptionGridClass =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8';

export const adoptionCardShellClass =
  'flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a280]/60 hover:shadow-lg';

export const adoptionImageWrapClass =
  'relative flex-shrink-0 bg-gradient-to-br from-[#faf6f0] to-[#efe4d8]';

export const adoptionImageAspectClass = 'aspect-[4/3] w-full overflow-hidden';

export const adoptionContentClass = 'flex flex-1 flex-col p-5 sm:p-6';

export const adoptionTagClass =
  'inline-flex items-center rounded-full bg-[#f0e6d8] px-2.5 py-1 text-xs font-semibold text-[#6b493d]';

export const adoptionTagMutedClass =
  'inline-flex items-center rounded-full bg-[#e8dcc8]/50 px-2.5 py-1 text-xs font-medium text-[#8B5A2B]';

export function getPosterProfileId(post) {
  if (!post?.userId) return null;
  if (post.userId._id != null) return String(post.userId._id);
  if (typeof post.userId === 'string' || typeof post.userId === 'number') {
    return String(post.userId);
  }
  return null;
}

/** Normalize vaccinated / neutered values from API (Yes, yes, true, etc.) */
export function isHealthAnswerYes(value) {
  if (value == null || value === '') return false;
  const s = String(value).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1';
}

/**
 * Chip colors for vaccinated / neutered — muted while listing is adopted,
 * full color when available so the card visually matches listing status.
 */
export function getHealthFieldChipStyle(field, value, listingStatus) {
  const yes = isHealthAnswerYes(value);
  const adopted = (listingStatus || 'available').toLowerCase() === 'adopted';

  if (field === 'vaccinated') {
    if (adopted) {
      return {
        label: yes ? 'Vaccinated' : 'Not vaccinated',
        className: 'border-stone-200 bg-stone-100 text-stone-600',
      };
    }
    return {
      label: yes ? 'Vaccinated' : 'Not vaccinated',
      className: yes
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-rose-200 bg-rose-50 text-rose-900',
    };
  }

  if (adopted) {
    return {
      label: yes ? 'Neutered / spayed' : 'Not neutered',
      className: 'border-stone-200 bg-stone-100 text-stone-600',
    };
  }
  return {
    label: yes ? 'Neutered / spayed' : 'Not neutered',
    className: yes
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : 'border-amber-200 bg-amber-50 text-amber-900',
  };
}

export function getPostStatusBadge(status) {
  const s = (status || 'available').toLowerCase();
  if (s === 'adopted') {
    return {
      label: 'Adopted',
      className: 'bg-rose-700/95 text-white border border-rose-800/30',
    };
  }
  if (s === 'pending') {
    return {
      label: 'Pending',
      className: 'bg-amber-500/95 text-white border border-amber-600/30',
    };
  }
  return {
    label: 'Available',
    className: 'bg-emerald-600/95 text-white border border-emerald-700/30',
  };
}

export function getRequestStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'accepted') {
    return { label: 'Accepted', className: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
  }
  if (s === 'rejected') {
    return { label: 'Rejected', className: 'bg-rose-50 text-rose-800 border border-rose-200' };
  }
  if (s === 'pending') {
    return { label: 'Request sent', className: 'bg-amber-50 text-amber-900 border border-amber-200' };
  }
  return { label: status || 'Unknown', className: 'bg-stone-100 text-stone-700 border border-stone-200' };
}

export const adoptionBtnPrimary =
  'w-full rounded-xl bg-gradient-to-r from-[#8B5A2B] to-[#6F4C3E] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-[#6F4C3E] hover:to-[#5a3a2e] hover:shadow-lg disabled:opacity-50';

export const adoptionBtnSecondary =
  'w-full rounded-xl border border-[#e8dcc8] bg-[#faf6f0] px-4 py-3 text-sm font-medium text-[#4E3B31] transition hover:border-[#c9a280] hover:bg-[#f5efe6]';

export const adoptionBtnDanger =
  'w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 transition hover:bg-rose-100';

export const adoptionAlertInfo = (tone) => {
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    neutral: 'border-stone-200 bg-stone-50 text-stone-700',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  return `rounded-xl border px-4 py-3 text-center text-sm font-medium ${tones[tone] || tones.neutral}`;
};

/** Requester account id from an adoption request (API field is `requester`, not `user`). */
export function getAdoptionRequesterId(request) {
  if (!request) return null;
  const r = request.requester ?? request.user;
  if (!r) return null;
  if (typeof r === 'string' || typeof r === 'number') return String(r);
  if (r._id != null) return String(r._id);
  if (r.id != null) return String(r.id);
  return null;
}

export function getAdoptionRequesterName(request) {
  if (!request) return 'Adopter';
  const r = request.requester ?? request.user;
  if (r?.username) return r.username;
  return request.name || 'Adopter';
}

export function formatAdoptionDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
