import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

import { globalAdmissionSearch, type GlobalSearchHit } from "@/services/globalSearch";

type GlobalSearchProps = {
  onAsk: (question: string) => void;
  onOpenProgramme?: (programmeId: string) => void;
};

export function GlobalSearch({ onAsk, onOpenProgramme }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      void globalAdmissionSearch(deferredQuery, 8).then((result) => {
        if (!cancelled) setHits(result.hits);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [deferredQuery]);

  return (
    <section aria-labelledby="global-search-title" className="explore-block search-block">
      <div className="explore-block-header">
        <p className="explore-kicker">Search</p>
        <h2 id="global-search-title">Find admission information</h2>
        <p>
          Search the local knowledge base — for example “Computer Science requirements”.
          Designed to support semantic similarity later.
        </p>
      </div>

      <label className="global-search-field">
        <Search aria-hidden="true" />
        <input
          aria-label="Search admission information"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search programmes, requirements, screening…"
          type="search"
          value={query}
        />
      </label>

      {deferredQuery.trim() && (
        <div className="search-results" aria-live="polite">
          {isPending && <p className="search-status">Searching admission information…</p>}
          {!isPending && hits.length === 0 && (
            <p className="search-status">No matching admission information found.</p>
          )}
          {hits.map((hit) => (
            <article className="search-result-card" key={`${hit.kind}-${hit.id}`}>
              <div className="search-result-topline">
                <span className="search-kind">{hit.kind === "programme" ? "Programme" : "Guide"}</span>
                <span className="search-score" title="Match strength">
                  Match
                </span>
              </div>
              <h3>{hit.title}</h3>
              <p>{hit.snippet}…</p>
              <div className="search-result-actions">
                {hit.kind === "knowledge" ? (
                  <button onClick={() => onAsk(hit.title)} type="button">
                    Ask in chat
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenProgramme?.(hit.id)}
                    type="button"
                  >
                    View programme
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
