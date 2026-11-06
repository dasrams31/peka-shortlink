"use client";

import { useEffect, useRef, useState } from "react";

const WA_URL = "https://chat.whatsapp.com/GLRMuZBICZg2636lVPj6NL";
const TG_URL = "https://t.me/peka_aigroup";
const SEEN_KEY = "peka-community-seen";

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.1-.3.3-.1.6.1.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.3.3.1.5.1.6-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.3Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.9 4.6 18.8 19.2c-.2 1-.8 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L6.7 13.1 2.1 11.7c-1-.3-1-1 .2-1.5L20.4 3.2c.8-.3 1.6.2 1.5 1.4Z" />
    </svg>
  );
}

export default function CommunityModal() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!sessionStorage.getItem(SEEN_KEY)) {
        timer = setTimeout(() => {
          setOpen(true);
          try {
            sessionStorage.setItem(SEEN_KEY, "1");
          } catch {
            /* ignore */
          }
        }, 5000);
      }
    } catch {
      timer = setTimeout(() => setOpen(true), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (closeRef.current) closeRef.current.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <div
      id="community-overlay"
      className={`community-overlay${open ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Gabung Komunitas Peka AI"
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="community-panel">
        <button
          className="community-close"
          id="community-close"
          ref={closeRef}
          type="button"
          aria-label="Tutup"
          onClick={() => setOpen(false)}
        >
          &times;
        </button>
        <span className="community-tile" aria-hidden="true">
          <PeopleIcon />
        </span>
        <p className="community-eyebrow">KOMUNITAS PEKA AI</p>
        <h3>Gabung Komunitas Peka AI</h3>
        <p className="community-body">
          Info AI terbaru, bansos, dan diskusi seputar AI. Info naik duluan di
          grup, sebelum naik ke feed.
        </p>
        <a
          className="community-btn wa"
          href={WA_URL}
          target="_blank"
          rel="noopener"
        >
          <WhatsAppIcon />
          Gabung Grup WhatsApp
        </a>
        <a
          className="community-btn tg"
          href={TG_URL}
          target="_blank"
          rel="noopener"
        >
          <TelegramIcon />
          Gabung Grup Telegram
        </a>
        <p className="community-note">Gratis, tanpa daftar.</p>
      </div>
    </div>
  );
}
