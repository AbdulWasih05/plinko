import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Keep existing utils unrelated to UI here or import them?
// For now, these are UI specific.
