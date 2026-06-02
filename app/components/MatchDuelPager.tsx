"use client";

import { useMemo, useState } from "react";

export type MatchDuelPickItem = {
  memberId: string;
  displayName: string;
  hasSubmitted: boolean;
  homeScore: number | null;
  awayScore: number | null;
  outcomeLabel: string;
};

export default function MatchDuelPager({ picks }: { picks: MatchDuelPickItem[] }) {
  const pageSize = 5;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(picks.length / pageSize));

  const visiblePicks = useMemo(() => {
    const start = page * pageSize;
    return picks.slice(start, start + pageSize);
  }, [picks, page]);

  return (
    <>
      <div className="picks-list duel-picks-list">
        {visiblePicks.map((pick) => {
          const hasPrediction =
            pick.hasSubmitted &&
            pick.homeScore !== null &&
            pick.awayScore !== null;

          return (
            <div key={pick.memberId} className="pick-row duel-pick-row">
              <div className="pick-user">
                <div>
                  <strong>{pick.displayName}</strong>
                  <span>
                    {hasPrediction
                      ? pick.outcomeLabel
                      : pick.hasSubmitted
                        ? "Inget tips på matchen"
                        : "Inte inskickat"}
                  </span>
                </div>
              </div>

              <em>
                {hasPrediction ? `${pick.homeScore}–${pick.awayScore}` : "—"}
              </em>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="members-pager duel-pager">
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