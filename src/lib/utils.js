import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* Aceternity UI's standard class-name helper: clsx + tailwind-merge. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
