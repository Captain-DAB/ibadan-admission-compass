import { ArrowUpRight, GraduationCap, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import programmesCatalog from "@/data/programmes-catalog.json";
import type { ProgrammeRecord } from "@/types/programmes";

type ProgrammeExplorerProps = {
  onAsk: (question: string) => void;
  focusProgrammeId?: string | null;
};

export function ProgrammeExplorer({ onAsk, focusProgrammeId }: ProgrammeExplorerProps) {
  const programmes = programmesCatalog as ProgrammeRecord[];
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(focusProgrammeId ?? null);

  useEffect(() => {
    if (focusProgrammeId) setSelectedId(focusProgrammeId);
  }, [focusProgrammeId]);

  const faculties = useMemo(
    () => ["all", ...new Set(programmes.map((programme) => programme.category))],
    [programmes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return programmes.filter((programme) => {
      if (facultyFilter !== "all" && programme.category !== facultyFilter) return false;
      if (!q) return true;
      const bag = [
        programme.name,
        programme.faculty,
        programme.category,
        programme.summary,
        ...programme.keywords,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return bag.includes(q);
    });
  }, [programmes, query, facultyFilter]);

  const selected =
    programmes.find((programme) => programme.id === (selectedId ?? focusProgrammeId)) ??
    null;

  return (
    <section
      aria-labelledby="programme-explorer-title"
      className="explore-block programme-explorer"
      id="programmes"
    >
      <div className="explore-block-header">
        <p className="explore-kicker">Programmes</p>
        <h2 id="programme-explorer-title">Programme Explorer</h2>
        <p>
          Browse programme cards curated from the official UI admissions regulations.
          Always re-check the live Regulation PDF and portal for your admission cycle.
        </p>
      </div>

      <div className="programme-toolbar">
        <label className="programme-search">
          <Search aria-hidden="true" />
          <input
            aria-label="Filter programmes"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search programmes…"
            type="search"
            value={query}
          />
        </label>
        <div className="programme-filters" role="list">
          {faculties.map((faculty) => (
            <button
              className={facultyFilter === faculty ? "is-active" : undefined}
              key={faculty}
              onClick={() => setFacultyFilter(faculty)}
              role="listitem"
              type="button"
            >
              {faculty === "all" ? "All" : faculty}
            </button>
          ))}
        </div>
      </div>

      <div className="programme-layout">
        <div className="programme-grid">
          {filtered.map((programme) => (
            <button
              className={`programme-card ${selected?.id === programme.id ? "is-selected" : ""}`}
              key={programme.id}
              onClick={() => setSelectedId(programme.id)}
              type="button"
            >
              <span className="programme-card-icon">
                <GraduationCap aria-hidden="true" />
              </span>
              <span className="programme-card-name">{programme.name}</span>
              <span className="programme-card-faculty">{programme.faculty}</span>
              <span className="programme-card-tag">{programme.category}</span>
              {programme.isPlaceholder && (
                <span className="placeholder-tag">Sample data</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="empty-explore">No programmes match that filter.</p>
          )}
        </div>

        <aside className="programme-detail" aria-live="polite">
          {selected ? (
            <>
              <p className="programme-detail-kicker">{selected.faculty}</p>
              <h3>{selected.name}</h3>
              {selected.isPlaceholder && (
                <p className="placeholder-banner">
                  Placeholder / sample content — verify on official UI channels.
                </p>
              )}
              <div className="programme-detail-section">
                <h4>Admission information</h4>
                <p>{selected.admissionInfo}</p>
              </div>
              <div className="programme-detail-section">
                <h4>Requirements</h4>
                <p>{selected.requirements}</p>
              </div>
              <div className="programme-detail-section">
                <h4>Related FAQs</h4>
                <div className="related-faq-list">
                  {selected.relatedFaqs.map((faq) => (
                    <button key={faq} onClick={() => onAsk(faq)} type="button">
                      {faq}
                      <ArrowUpRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
              <p className="programme-source">
                Source: {selected.source} · Updated {selected.lastUpdated}
              </p>
            </>
          ) : (
            <p className="empty-explore">Select a programme card to view details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
