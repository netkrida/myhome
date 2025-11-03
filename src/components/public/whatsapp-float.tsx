"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
 * Displays a draggable button that opens WhatsApp chat
 * Only renders if a valid phone number is provided
 */
export function WhatsAppFloat({ number, presetText, className }: WhatsAppFloatProps) {
  // Don't render if no phone number
  if (!number) return null;

  const [position, setPosition] = useState(() => {
    // Start at left-bottom by default
    if (typeof window !== 'undefined') {
      return { x: 24, y: window.innerHeight - 80 }; // 80px from bottom (button height + padding)
    }
    return { x: 24, y: 500 }; // Fallback for SSR
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLAnchorElement>(null);

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

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Boundary check
      const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 60);
      const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 60);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;

      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      // Boundary check
      const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 60);
      const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 60);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <a
      ref={buttonRef}
      href={isDragging ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
        }
      }}
      className={[
        "fixed z-50",
        "flex items-center justify-center rounded-full p-3 shadow-lg",
        "bg-green-500 text-white hover:bg-green-600",
        "transition-colors duration-200",
        isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105",
        className ?? "",
      ].join(" ")}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      data-analytics="wa-float"
    >
      {/* WhatsApp Icon */}
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}

