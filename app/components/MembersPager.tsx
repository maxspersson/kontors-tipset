"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type MemberPagerItem = {
  id: string;
  displayName: string;
  email: string;
  initials: string;
  isCurrentUser: boolean;
  hasSubmitted: boolean;
  tipsHref: string | null;
};

export default function MembersPager({ members }: { members: MemberPagerItem[] }) {
  const pageSize = 5;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));

  const visibleMembers = useMemo(() => {
    const start = page * pageSize;
    return members.slice(start, start + pageSize);
  }, [members, page]);

  return (
    <>
      <div className="member-list">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className={`member-row ${member.isCurrentUser ? "is-current-member" : ""}`}
          >
            <div className="avatar">{member.initials}</div>

            <div>
              <strong>
                {member.displayName}
                {member.isCurrentUser ? " (du)" : ""}
              </strong>
              <span>{member.email}</span>
            </div>

            <div className="member-actions">
              <em className={member.hasSubmitted ? "done" : "pending"}>
                {member.hasSubmitted ? "Klar" : "Ej klar"}
              </em>

              {member.tipsHref && (
                <Link href={member.tipsHref} className="view-tips-link">
                  Visa tips
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="members-pager">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
          >
            ←
          </button>

          <span>
            {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages - 1, current + 1))
            }
            disabled={page === totalPages - 1}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}