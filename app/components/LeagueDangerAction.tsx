"use client";

type LeagueDangerActionProps = {
  leagueId: string;
  action: "archive" | "leave";
};

export default function LeagueDangerAction({
  leagueId,
  action,
}: LeagueDangerActionProps) {
  const isArchive = action === "archive";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      isArchive
        ? "Är du säker på att du vill arkivera ligan? Den försvinner från alla listor, men datan raderas inte."
        : "Är du säker på att du vill lämna ligan? Den försvinner från dina ligor."
    );

    if (!confirmed) {
      e.preventDefault();
    }
  }

  return (
    <form
      action={isArchive ? "/api/archive-league" : "/api/leave-league"}
      method="POST"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="leagueId" value={leagueId} />

      <button className="danger-button" type="submit">
        {isArchive ? "Arkivera liga" : "Lämna liga"}
      </button>
    </form>
  );
}