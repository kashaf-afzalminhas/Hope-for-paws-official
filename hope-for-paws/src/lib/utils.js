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
