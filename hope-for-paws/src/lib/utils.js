// import { clsx } from "clsx";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs) {
//   return twMerge(clsx(...inputs));
// }

// src/lib/utils.js

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

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