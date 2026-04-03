"use client";

import { useState } from "react";

type CopyInviteProps = {
  inviteCode: string;
  slug: string;
};

export default function CopyInvite({
  inviteCode,
  slug,
}: CopyInviteProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinPath = `/join/${inviteCode}`;

  async function handleCopyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);

    setTimeout(() => {
      setCopiedCode(false);
    }, 2000);
  }

  async function handleCopyLink() {
    const fullUrl = `${window.location.origin}${joinPath}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);

    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  }

  return (
    <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-sm text-neutral-400">Bjud in till ligan</p>

      <div className="mt-4">
        <p className="text-sm text-neutral-400">Kod</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-lg font-medium text-neutral-100">{inviteCode}</p>

          <button
            type="button"
            onClick={handleCopyCode}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-neutral-100 hover:border-neutral-700"
          >
            {copiedCode ? "Kopierad!" : "Kopiera kod"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-neutral-400">Join-länk</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="break-all text-sm text-neutral-100">{joinPath}</p>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-fit rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-neutral-100 hover:border-neutral-700"
          >
            {copiedLink ? "Kopierad!" : "Kopiera länk"}
          </button>
        </div>
      </div>
    </div>
  );
}