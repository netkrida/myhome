"use client";

import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { buildWaLink } from "@/lib/wa";

interface WhatsAppFloatProps {
  /** WhatsApp number in E.164 format without + (e.g., "628123456789") */
  number?: string | null;
  /** Optional preset text to prefill in WhatsApp */
  presetText?: string;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Floating WhatsApp contact button
 * Displays a fixed button at bottom-right that opens WhatsApp chat
 * Only renders if a valid phone number is provided
 */
export function WhatsAppFloat({ number, presetText, className }: WhatsAppFloatProps) {
  // Don't render if no phone number
  if (!number) return null;

  const href = useMemo(() => {
    // Get current page URL for context
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    
    // Build default text with page URL
    const defaultText = `Halo Admin, saya ingin bertanya. (Halaman: ${pageUrl})`;
    const text = presetText ?? defaultText;

    return buildWaLink({
      number,
      text,
      utm: {
        utm_source: "myhome",
        utm_medium: "wa-float",
        utm_campaign: "property-detail",
      },
    });
  }, [number, presetText]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
      className={[
        "fixed bottom-4 right-4 z-50",
        "flex items-center gap-2 rounded-full px-4 py-3 shadow-lg",
        "bg-green-500 text-white hover:bg-green-600",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        "md:bottom-6 md:right-6",
        className ?? "",
      ].join(" ")}
      data-analytics="wa-float"
    >
      {/* WhatsApp Icon */}
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      
      {/* Button Text */}
      <span className="text-sm font-medium">Chat AdminKos</span>
    </a>
  );
}

