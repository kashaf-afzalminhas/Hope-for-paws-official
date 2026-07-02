import { BadgeCheck } from "lucide-react";

/**
 * VerifiedBadge — Reusable trust badge for verified sellers.
 *
 * Renders only when `isVerified` is true. Outputs nothing when false,
 * so callers can simply include it without conditional wrappers.
 *
 * @param {boolean}  isVerified - The seller's verification status.
 * @param {"sm"|"md"|"lg"} size - Visual preset (default "md").
 * @param {string}   className  - Extra Tailwind classes for the wrapper.
 */
const SIZES = {
  sm: { icon: 10, text: "text-[8px]", gap: "gap-0.5", px: "px-1 py-px" },
  md: { icon: 12, text: "text-[9px]",  gap: "gap-1",   px: "px-1.5 py-0.5" },
  lg: { icon: 14, text: "text-[11px]", gap: "gap-1.5", px: "px-2 py-1" },
};

export default function VerifiedBadge({ isVerified, size = "md", className = "" }) {
  if (!isVerified) return null;

  const s = SIZES[size] || SIZES.md;

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${s.px} rounded-full ${s.text} font-semibold whitespace-nowrap select-none
        bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700
        border border-teal-200/80 shadow-[0_1px_2px_rgba(0,128,128,0.08)]
        ${className}`}
    >
      <BadgeCheck size={s.icon} className="text-teal-600 flex-shrink-0" />
      Verified
    </span>
  );
}
