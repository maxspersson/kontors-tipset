"use client";

import { useState } from "react";

export default function CopyTextButton({
  value,
  label = "Kopiera",
  copiedLabel = "Kopierad",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="copy-text-button" onClick={copyText}>
      {copied ? copiedLabel : label}
    </button>
  );
}