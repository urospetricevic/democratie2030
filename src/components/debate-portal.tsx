"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateTime, getCopy } from "@/lib/i18n";
import type { CommunityDebateListItem, Locale } from "@/lib/types";

type PortalFilter = "all" | "host" | "friend";

export function DebatePortal({
  locale,
  alias,
  debates,
}: {
  locale: Locale;
  alias: string;
  debates: CommunityDebateListItem[];
}) {
  const copy = getCopy(locale).portal;
  const [filter, setFilter] = useState<PortalFilter>("all");
  const [query, setQuery] = useState("");
  const filteredDebates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return debates.filter((debate) => {
      const matchesRole = filter === "all" || debate.role === filter;
      const searchableText =
        `${debate.question} ${debate.context} ${debate.category}`.toLocaleLowerCase(
          locale,
        );
      return (
        matchesRole &&
        (!normalizedQuery || searchableText.includes(normalizedQuery))
      );
    });
  }, [debates, filter, locale, query]);

  const filters: Array<{ id: PortalFilter; label: string }> = [
    { id: "all", label: copy.allTab },
    { id: "host", label: copy.hostedTab },
    { id: "friend", label: copy.participatingTab },
  ];

  return (
    <main className="portal-page">
      <section className="portal-hero">
        <div>
          <div className="landing-kicker">
            <span className="landing-live-dot" />
            <span>{copy.kicker}</span>
          </div>
          <h1>{copy.title}</h1>
          <p className="rich-copy">{copy.intro}</p>
        </div>
        <aside className="portal-identity">
          <span>{alias.slice(0, 1).toUpperCase()}</span>
          <div>
            <small>{locale === "fr" ? "Compte DBYLE" : "DBYLE account"}</small>
            <strong>@{alias}</strong>
            <p>{debates.length} {copy.debateCount}</p>
          </div>
        </aside>
      </section>

      {debates.length ? (
        <>
          <section className="portal-controls">
            <div className="portal-tabs" role="tablist">
              {filters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === option.id}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                  <span>
                    {option.id === "all"
                      ? debates.length
                      : debates.filter((debate) => debate.role === option.id)
                          .length}
                  </span>
                </button>
              ))}
            </div>
            <label className="portal-search">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
              />
            </label>
          </section>

          {filteredDebates.length ? (
            <section className="portal-debate-grid">
              {filteredDebates.map((debate) => (
                <article className="portal-debate-card" key={debate.id}>
                  <Image
                    className="portal-debate-image"
                    src={`/api/community-debates/${debate.id}/image?v=${encodeURIComponent(debate.updatedAt)}`}
                    alt=""
                    width={800}
                    height={450}
                    unoptimized
                  />
                  <div className="portal-card-topline">
                    <span>{debate.category}</span>
                    <strong data-role={debate.role}>
                      {debate.role === "host"
                        ? copy.roleHost
                        : copy.roleParticipant}
                    </strong>
                  </div>
                  <h2>{debate.question}</h2>
                  <p className="rich-copy">
                    {debate.context ||
                      (locale === "fr"
                        ? "Aucun contexte supplémentaire."
                        : "No additional context.")}
                  </p>
                  <div className="portal-card-metadata">
                    <p>
                      <strong>{debate.memberCount}</strong>
                      {debate.memberCount === 1
                        ? copy.participant
                        : copy.participants}
                    </p>
                    <p>
                      <span>{copy.lastActivity}</span>
                      <time dateTime={debate.updatedAt}>
                        {formatDateTime(locale, debate.updatedAt)}
                      </time>
                    </p>
                  </div>
                  <Link href={`/${locale}/community/${debate.id}`}>
                    {copy.openDebate}<span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </section>
          ) : (
            <section className="portal-no-results">
              <p>{copy.noResults}</p>
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                {copy.allTab}
              </button>
            </section>
          )}
        </>
      ) : (
        <section className="portal-empty">
          <span aria-hidden="true">＋</span>
          <h2>{copy.emptyTitle}</h2>
          <p className="rich-copy">{copy.emptyBody}</p>
          <Link href={`/${locale}/create`}>
            {copy.createDebate}<span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
    </main>
  );
}
