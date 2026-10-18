// import { clsx } from "clsx";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs) {
//   return twMerge(clsx(...inputs));
// }

// src/lib/utils.js

import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { AUTH_BASE_URL } from "../config";

/**
 * Builds a usable image URL from a user's profileImage.
 * Handles full URLs (e.g. Google photos) and paths uploaded to our backend (e.g. /uploads/...).
 * Returns null when the user has no image.
 */
export function getProfileImageUrl(profileImage) {
  if (!profileImage || typeof profileImage !== "string") return null;
  const value = profileImage.trim();
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  const base = AUTH_BASE_URL.replace(/\/auth\/?$/, "");
  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
}

/** Up to two initials from a name, used when there is no profile image. */
export function getInitials(name) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}

/**
 * Returns the user's ID as a string, preferring _id if present, then id. Returns null if not found.
 * @param {object} user - The user object
 * @returns {string|null}
 */
export function getCurrentUserId(user) {
  if (!user) return null;
  if (user._id) return String(user._id);
  if (user.id) return String(user.id);
  return null;
}

export const formatMetric = (num) => {
  const parsed = Number(num);
  if (isNaN(parsed) || parsed < 0) return '0';
  if (parsed >= 1000000) {
    return (parsed / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (parsed >= 1000) {
    return (parsed / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(parsed);
};