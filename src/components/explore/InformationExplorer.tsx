import { ArrowLeft, ArrowUpRight, BookOpenCheck } from "lucide-react";
import { useMemo, useState } from "react";

import {
  EXPLORE_CATEGORIES,
  getCategoryCounts,
  getItemsForCategory,
} from "@/lib/explore-categories";
import type { KnowledgeItem } from "@/types/knowledge";

type InformationExplorerProps = {
  onAsk: (question: string) => void;
};

export function InformationExplorer({ onAsk }: InformationExplorerProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const counts = useMemo(() => getCategoryCounts(), []);
  const items = useMemo(
    () => (activeCategoryId ? getItemsForCategory(activeCategoryId) : []),
    [activeCategoryId],
  );
  const activeCategory = EXPLORE_CATEGORIES.find(
    (category) => category.id === activeCategoryId,
  );

  return (
    <section
      aria-labelledby="info-explorer-title"
      className="explore-block info-explorer"
      id="browse"
    >
      <div className="explore-block-header">
        <p className="explore-kicker">Browse</p>
        <h2 id="info-explorer-title">Admission Information Explorer</h2>
        <p>
          Prefer not to chat? Open a category and read curated admission guidance at your own
          pace.
        </p>
      </div>

      {!activeCategory ? (
        <div className="category-grid">
          {EXPLORE_CATEGORIES.map((category) => (
            <button
              className="category-card"
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              type="button"
            >
              <span className="category-card-icon">
                <BookOpenCheck aria-hidden="true" />
              </span>
              <span className="category-card-title">{category.title}</span>
              <span className="category-card-copy">{category.description}</span>
              <span className="category-card-meta">
                {counts[category.id] ?? 0} articles
                <ArrowUpRight aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="category-detail">
          <button
            className="back-to-categories"
            onClick={() => setActiveCategoryId(null)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
            All categories
          </button>
          <div className="category-detail-header">
            <h3>{activeCategory.title}</h3>
            <p>{activeCategory.description}</p>
          </div>
          <div className="info-card-grid">
            {items.length === 0 && (
              <p className="empty-explore">
                No verified entries in this category yet. Try another category or ask in chat.
              </p>
            )}
            {items.map((item) => (
              <KnowledgeBrowseCard item={item} key={item.id} onAsk={onAsk} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function KnowledgeBrowseCard({
  item,
  onAsk,
}: {
  item: KnowledgeItem;
  onAsk: (question: string) => void;
}) {
  return (
    <article className="info-card">
      <div className="info-card-topline">
        <span className="info-card-tag">{item.category}</span>
        {item.isPlaceholder && <span className="placeholder-tag">Sample</span>}
      </div>
      <h4>{item.question}</h4>
      <p>{item.answer}</p>
      <div className="info-card-footer">
        <span>Updated {item.lastUpdated}</span>
        <button onClick={() => onAsk(item.question)} type="button">
          Ask this
          <ArrowUpRight aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
