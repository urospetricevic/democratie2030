"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { formatDateTime, getCopy } from "@/lib/i18n";
import type {
  ArgumentComment,
  ArgumentImportPreview,
  CommunityArgument,
  CommunityDebateConclusion,
  CommunityDebatePageData,
  CommunityInvitePreview,
  Locale,
  VoteSide,
} from "@/lib/types";

interface CommunityDebateInviteProps {
  locale: Locale;
  debate: CommunityInvitePreview;
  inviteCode: string;
  isAuthenticated: boolean;
}

export function CommunityDebateInvite({
  locale,
  debate,
  inviteCode,
  isAuthenticated,
}: CommunityDebateInviteProps) {
  const copy = getCopy(locale).communityDebate;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const nextPath = `/${locale}/community/${debate.id}?invite=${encodeURIComponent(inviteCode)}`;

  async function joinDebate() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/community-debates/${debate.id}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode }),
        },
      );
      if (!response.ok) {
        throw new Error("JOIN_FAILED");
      }
      router.replace(`/${locale}/community/${debate.id}`);
      router.refresh();
    } catch {
      setError(
        locale === "fr"
          ? "Cette invitation n’est plus disponible."
          : "This invitation is no longer available.",
      );
      setPending(false);
    }
  }

  return (
    <main className="community-invite-page">
      <section className="community-invite-card">
        <div className="community-invite-mark" aria-hidden="true">↗</div>
        <p className="section-label">{copy.inviteKicker}</p>
        <p className="community-inviter">
          {copy.invitedBy} <strong>@{debate.ownerAlias}</strong>
        </p>
        <h1>{copy.inviteTitle}</h1>
        <div className="community-invite-question">
          <span>{debate.category}</span>
          <h2>{debate.question}</h2>
          {debate.context ? <p className="rich-copy">{debate.context}</p> : null}
        </div>
        <p className="community-invite-explainer">{copy.inviteBody}</p>
        {isAuthenticated ? (
          <button
            type="button"
            className="landing-primary-cta"
            onClick={joinDebate}
            disabled={pending}
          >
            {pending ? copy.joining : copy.joinButton}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <Link
            href={`/${locale}/access?next=${encodeURIComponent(nextPath)}`}
            className="landing-primary-cta"
          >
            {copy.signInButton}<span aria-hidden="true">→</span>
          </Link>
        )}
        {error ? <p className="community-error" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}

interface CommunityDebateWorkspaceProps {
  locale: Locale;
  data: CommunityDebatePageData;
}

export function CommunityDebateWorkspace({
  locale,
  data,
}: CommunityDebateWorkspaceProps) {
  const copy = getCopy(locale);
  const communityCopy = copy.communityDebate;
  const [copied, setCopied] = useState(false);
  const [activeSide, setActiveSide] = useState<VoteSide>("yes");
  const sharePath = `/${locale}/community/${data.debate.id}?invite=${encodeURIComponent(data.debate.inviteCode)}`;
  const commentsByArgument = useMemo(() => {
    const grouped = new Map<string, ArgumentComment[]>();
    for (const comment of data.comments) {
      grouped.set(comment.argumentId, [
        ...(grouped.get(comment.argumentId) ?? []),
        comment,
      ]);
    }
    return grouped;
  }, [data.comments]);

  async function copyInvite() {
    const shareUrl = new URL(sharePath, window.location.origin).toString();
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  const yesArguments = data.arguments.filter(
    (argument) => argument.side === "yes",
  );
  const noArguments = data.arguments.filter(
    (argument) => argument.side === "no",
  );

  return (
    <main className="community-workspace">
      <section className="community-debate-header">
        <div className="community-debate-heading">
          <div className="community-debate-topline">
            <p className="section-label">{communityCopy.workspaceKicker}</p>
            <span className="community-private-badge">
              <span aria-hidden="true">●</span>{communityCopy.privateBadge}
            </span>
          </div>
          <p className="community-category">{data.debate.category}</p>
          <h1>{data.debate.question}</h1>
          {data.debate.context ? (
            <p className="rich-copy community-context">{data.debate.context}</p>
          ) : null}
        </div>

        <aside className="community-participants">
          <p className="section-label">
            {locale === "fr" ? "Dans cet espace" : "In this space"}
          </p>
          <div className="community-person">
            <span>{data.debate.ownerAlias.slice(0, 1).toUpperCase()}</span>
            <p><strong>@{data.debate.ownerAlias}</strong>{communityCopy.hostLabel}</p>
          </div>
          {data.members.find((member) => member.role === "friend") ? (
            data.members
              .filter((member) => member.role === "friend")
              .map((member) => (
                <div className="community-person" key={member.userId}>
                  <span>{member.alias.slice(0, 1).toUpperCase()}</span>
                  <p><strong>@{member.alias}</strong>{communityCopy.friendLabel}</p>
                </div>
              ))
          ) : (
            <div className="community-person community-person-empty">
              <span>＋</span>
              <p><strong>{communityCopy.waitingForFriend}</strong>{communityCopy.friendLabel}</p>
            </div>
          )}
        </aside>
      </section>

      {data.viewerId === data.debate.ownerId ? (
        <>
          <section className="community-share-panel">
            <div>
              <span className="community-share-icon" aria-hidden="true">↗</span>
              <div>
                <h2>{communityCopy.shareTitle}</h2>
                <p>{communityCopy.shareBody}</p>
              </div>
            </div>
            <div className="community-share-control">
              <input value={sharePath} readOnly aria-label={communityCopy.copyLink} />
              <button type="button" onClick={copyInvite}>
                {copied ? communityCopy.copied : communityCopy.copyLink}
              </button>
            </div>
          </section>
          <ArgumentImportPanel locale={locale} debateId={data.debate.id} />
        </>
      ) : null}

      <AiConclusionPanel
        locale={locale}
        debateId={data.debate.id}
        initialConclusion={data.conclusion}
        initialIsStale={data.conclusionIsStale}
        isHost={data.viewerId === data.debate.ownerId}
        argumentCount={data.arguments.length}
      />

      <div className="community-side-tabs" role="tablist" aria-label={communityCopy.mobilePerspectiveTabs}>
        <button
          type="button"
          role="tab"
          aria-selected={activeSide === "yes"}
          aria-controls={`community-side-yes-${data.debate.id}`}
          onClick={() => setActiveSide("yes")}
        >
          <span aria-hidden="true">✓</span>
          {communityCopy.yesColumn}
          <strong>{yesArguments.length}</strong>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSide === "no"}
          aria-controls={`community-side-no-${data.debate.id}`}
          onClick={() => setActiveSide("no")}
        >
          <span aria-hidden="true">×</span>
          {communityCopy.noColumn}
          <strong>{noArguments.length}</strong>
        </button>
      </div>

      <section className="community-argument-board">
        <ArgumentColumn
          locale={locale}
          debateId={data.debate.id}
          side="yes"
          arguments={yesArguments}
          commentsByArgument={commentsByArgument}
          isActive={activeSide === "yes"}
        />
        <ArgumentColumn
          locale={locale}
          debateId={data.debate.id}
          side="no"
          arguments={noArguments}
          commentsByArgument={commentsByArgument}
          isActive={activeSide === "no"}
        />
      </section>

      <div className="community-workspace-footer">
        <Link href={`/${locale}/create`}>
          ＋ {communityCopy.backToCreator}
        </Link>
      </div>
    </main>
  );
}

function AiConclusionPanel({
  locale,
  debateId,
  initialConclusion,
  initialIsStale,
  isHost,
  argumentCount,
}: {
  locale: Locale;
  debateId: string;
  initialConclusion: CommunityDebateConclusion | null;
  initialIsStale: boolean;
  isHost: boolean;
  argumentCount: number;
}) {
  const copy = getCopy(locale).communityDebate;
  const router = useRouter();
  const [conclusion, setConclusion] =
    useState<CommunityDebateConclusion | null>(initialConclusion);
  const [isStale, setIsStale] = useState(initialIsStale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function generateConclusion() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/community-debates/${debateId}/conclusion`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("CONCLUSION_FAILED");
      const result = (await response.json()) as {
        conclusion: CommunityDebateConclusion;
      };
      setConclusion(result.conclusion);
      setIsStale(false);
      router.refresh();
    } catch {
      setError(copy.conclusionError);
    } finally {
      setPending(false);
    }
  }

  const positionLabel = conclusion
    ? {
        yes: copy.conclusionYes,
        no: copy.conclusionNo,
        mixed: copy.conclusionMixed,
        insufficient: copy.conclusionInsufficient,
      }[conclusion.position]
    : "";
  const leadSummary = conclusion?.summary.split(/\n\s*\n/)[0] ?? "";

  return (
    <section className={`community-conclusion${conclusion ? ` is-${conclusion.position}` : ""}`}>
      <div className="community-conclusion-intro">
        <div className="community-conclusion-mark" aria-hidden="true">✦</div>
        <div>
          <div className="community-conclusion-kicker">
            <p className="section-label">{copy.conclusionKicker}</p>
            {conclusion ? <span>{positionLabel}</span> : null}
            {isStale ? <span className="is-stale">{copy.conclusionStale}</span> : null}
          </div>
          {conclusion ? (
            <>
              <h2>{conclusion.headline}</h2>
              <p className="community-conclusion-summary">{leadSummary}</p>
            </>
          ) : (
            <>
              <h2>{copy.conclusionEmptyTitle}</h2>
              <p className="community-conclusion-summary">
                {copy.conclusionEmptyBody}
              </p>
            </>
          )}
        </div>
        {isHost ? (
          <button
            type="button"
            className="community-conclusion-action"
            onClick={generateConclusion}
            disabled={pending || argumentCount < 2}
          >
            {pending
              ? copy.conclusionGenerating
              : conclusion
                ? copy.conclusionRefresh
                : copy.conclusionGenerate}
          </button>
        ) : null}
      </div>

      {conclusion ? (
        <details className="community-conclusion-expansion">
          <summary>
            <span>{copy.conclusionExplore}</span>
            <i aria-hidden="true">⌄</i>
          </summary>
          <div className="community-conclusion-expanded-body">
            <p>{conclusion.summary}</p>
            {conclusion.conditions.length || conclusion.caveats.length ? (
              <div className="community-conclusion-details">
                {conclusion.conditions.length ? (
                  <div>
                    <h3>{copy.conclusionConditions}</h3>
                    <ul>
                      {conclusion.conditions.map((condition) => (
                        <li key={condition}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {conclusion.caveats.length ? (
                  <div>
                    <h3>{copy.conclusionCaveats}</h3>
                    <ul>
                      {conclusion.caveats.map((caveat) => (
                        <li key={caveat}>{caveat}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      <div className="community-conclusion-footnote">
        <span>
          {conclusion
            ? copy.conclusionBasedOn.replace(
                "{count}",
                String(conclusion.argumentCount),
              )
            : argumentCount >= 2
              ? copy.conclusionReady
              : copy.conclusionNeedsArguments.replace(
                  "{count}",
                  String(Math.max(0, 2 - argumentCount)),
                )}
        </span>
        <span>{copy.conclusionDisclaimer}</span>
      </div>
      {error ? <p className="community-error" role="alert">{error}</p> : null}
    </section>
  );
}

function ArgumentImportPanel({
  locale,
  debateId,
}: {
  locale: Locale;
  debateId: string;
}) {
  const copy = getCopy(locale).communityDebate;
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ArgumentImportPreview | null>(null);
  const [pending, setPending] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function analyzeLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("preview");
    setError("");
    setSuccess("");
    setPreview(null);
    try {
      const response = await fetch(
        `/api/community-debates/${debateId}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "preview", url }),
        },
      );
      if (!response.ok) throw new Error("PREVIEW_FAILED");
      const result = (await response.json()) as {
        preview: ArgumentImportPreview;
      };
      setPreview(result.preview);
    } catch {
      setError(copy.importError);
    } finally {
      setPending(null);
    }
  }

  async function importArguments() {
    if (!preview) return;
    setPending("commit");
    setError("");
    try {
      const response = await fetch(
        `/api/community-debates/${debateId}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "commit",
            arguments: preview.arguments,
          }),
        },
      );
      if (!response.ok) throw new Error("IMPORT_FAILED");
      const result = (await response.json()) as { importedCount: number };
      setSuccess(copy.importSuccess.replace("{count}", String(result.importedCount)));
      setPreview(null);
      setUrl("");
      router.refresh();
    } catch {
      setError(copy.importCommitError);
    } finally {
      setPending(null);
    }
  }

  const previewBySide = (side: VoteSide) =>
    preview?.arguments.filter((argument) => argument.side === side) ?? [];

  return (
    <section className="community-import-panel">
      <div className="community-import-heading">
        <span className="community-import-icon" aria-hidden="true">✦</span>
        <div>
          <p className="section-label">{copy.importKicker}</p>
          <h2>{copy.importTitle}</h2>
          <p>{copy.importBody}</p>
        </div>
      </div>
      <form className="community-import-form" onSubmit={analyzeLink}>
        <label htmlFor={`argument-import-${debateId}`}>{copy.importUrlLabel}</label>
        <div>
          <input
            id={`argument-import-${debateId}`}
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            maxLength={2048}
            required
          />
          <button type="submit" disabled={pending !== null}>
            {pending === "preview" ? copy.importAnalyzing : copy.importAnalyze}
          </button>
        </div>
        <small>{copy.importPrivacy}</small>
      </form>

      {error ? <p className="community-error" role="alert">{error}</p> : null}
      {success ? <p className="community-import-success" role="status">{success}</p> : null}

      {preview ? (
        <div className="community-import-preview">
          <div className="community-import-preview-header">
            <div>
              <p className="section-label">{copy.importPreview}</p>
              <h3>{preview.sourceTitle}</h3>
            </div>
            <strong>{preview.arguments.length} {copy.importArguments}</strong>
          </div>
          <div className="community-import-columns">
            {(["yes", "no"] as VoteSide[]).map((side) => (
              <div key={side} className={`community-import-side community-${side}`}>
                <header>
                  <span>{side === "yes" ? "✓" : "×"}</span>
                  <strong>{side === "yes" ? copy.yesColumn : copy.noColumn}</strong>
                  <small>{previewBySide(side).length}</small>
                </header>
                <ul>
                  {previewBySide(side).map((argument) => (
                    <li key={`${side}-${argument.title}`}>
                      <strong>{argument.title}</strong>
                      <p>{argument.body}</p>
                      {argument.sources.length ? (
                        <small>
                          {argument.sources.length} {copy.importReferences}
                        </small>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="community-import-actions">
            <button type="button" onClick={() => setPreview(null)} disabled={pending !== null}>
              {copy.importCancel}
            </button>
            <button type="button" onClick={importArguments} disabled={pending !== null}>
              {pending === "commit" ? copy.importing : copy.importAll}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ArgumentColumn({
  locale,
  debateId,
  side,
  arguments: debateArguments,
  commentsByArgument,
  isActive,
}: {
  locale: Locale;
  debateId: string;
  side: VoteSide;
  arguments: CommunityArgument[];
  commentsByArgument: Map<string, ArgumentComment[]>;
  isActive: boolean;
}) {
  const copy = getCopy(locale).communityDebate;

  return (
    <div
      id={`community-side-${side}-${debateId}`}
      role="tabpanel"
      className={`community-argument-column community-${side}${isActive ? " community-side-active" : ""}`}
    >
      <header>
        <div>
          <span aria-hidden="true">{side === "yes" ? "✓" : "×"}</span>
          <h2>{side === "yes" ? copy.yesColumn : copy.noColumn}</h2>
        </div>
        <strong>{debateArguments.length}</strong>
      </header>

      <ArgumentForm locale={locale} debateId={debateId} side={side} />

      <div className="community-argument-list">
        {debateArguments.length ? (
          debateArguments.map((argument) => (
            <CommunityArgumentCard
              key={argument.id}
              locale={locale}
              debateId={debateId}
              argument={argument}
              comments={commentsByArgument.get(argument.id) ?? []}
            />
          ))
        ) : (
          <p className="community-empty-state">
            {side === "yes" ? copy.emptyYes : copy.emptyNo}
          </p>
        )}
      </div>
    </div>
  );
}

function ArgumentForm({
  locale,
  debateId,
  side,
}: {
  locale: Locale;
  debateId: string;
  side: VoteSide;
}) {
  const copy = getCopy(locale).communityDebate;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  function submitArgument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");

    startTransition(async () => {
      const response = await fetch(
        `/api/community-debates/${debateId}/arguments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            side,
            title: formData.get("title"),
            body: formData.get("body"),
            sourceLabel: formData.get("sourceLabel"),
            sourceUrl: formData.get("sourceUrl"),
          }),
        },
      );
      if (!response.ok) {
        setError(copy.argumentError);
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="community-add-argument">
      <button type="button" onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">{open ? "−" : "＋"}</span>{copy.addArgument}
      </button>
      {open ? (
        <form onSubmit={submitArgument}>
          <label>
            <span>{copy.argumentTitle}</span>
            <input
              name="title"
              placeholder={copy.argumentTitlePlaceholder}
              minLength={3}
              maxLength={140}
              required
            />
          </label>
          <label>
            <span>{copy.argumentBody}</span>
            <textarea
              name="body"
              placeholder={copy.argumentBodyPlaceholder}
              minLength={8}
              maxLength={2400}
              required
            />
          </label>
          <fieldset>
            <legend>{copy.optionalSource}</legend>
            <label>
              <span>{copy.sourceLabel}</span>
              <input
                name="sourceLabel"
                placeholder={copy.sourceLabelPlaceholder}
                maxLength={160}
              />
            </label>
            <label>
              <span>{copy.sourceUrl}</span>
              <input name="sourceUrl" type="url" placeholder="https://…" />
            </label>
          </fieldset>
          <button type="submit" disabled={pending}>
            {pending ? copy.publishing : copy.publishArgument}
          </button>
          {error ? <p className="community-error" role="alert">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

function CommunityArgumentCard({
  locale,
  debateId,
  argument,
  comments,
}: {
  locale: Locale;
  debateId: string;
  argument: CommunityArgument;
  comments: ArgumentComment[];
}) {
  const copy = getCopy(locale).communityDebate;

  return (
    <article className="community-argument-card">
      <details className="community-argument-disclosure">
        <summary className="community-argument-row">
          <strong>{argument.title}</strong>
          <span className="community-argument-row-stats">
            <span title={copy.sources}>
              <i aria-hidden="true">↗</i>{argument.sources.length}
            </span>
            <span title={copy.comments}>
              <i aria-hidden="true">◌</i>{comments.length}
            </span>
          </span>
          <i aria-hidden="true">⌄</i>
        </summary>

        <div className="community-argument-expanded">
          <div className="community-argument-meta">
            <span>@{argument.authorAlias}</span>
            <time dateTime={argument.createdAt}>
              {formatDateTime(locale, argument.createdAt)}
            </time>
          </div>
          <p className="rich-copy community-argument-body">{argument.body}</p>

          <details className="community-sources">
            <summary className="community-card-section-heading">
              <strong>{copy.sources}</strong>
              <span>{argument.sources.length}</span>
              <i aria-hidden="true">⌄</i>
            </summary>
            <div className="community-sources-content">
              {argument.sources.length ? (
                <ul>
                  {argument.sources.map((source) => (
                    <li key={source.id}>
                      <span aria-hidden="true">↗</span>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.label}
                      </a>
                      <small>{copy.by} @{source.addedByAlias}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{copy.noSources}</p>
              )}
              <SourceForm
                locale={locale}
                debateId={debateId}
                argumentId={argument.id}
              />
            </div>
          </details>

          <details className="community-comments">
            <summary className="community-card-section-heading">
              <strong>{copy.comments}</strong>
              <span>{comments.length}</span>
              <i aria-hidden="true">⌄</i>
            </summary>
            <div className="community-comments-content">
              {comments.length ? (
                <ol>
                  {comments.map((comment) => (
                    <li key={comment.id}>
                      <div>
                        <strong>@{comment.authorAlias}</strong>
                        <time dateTime={comment.createdAt}>
                          {formatDateTime(locale, comment.createdAt)}
                        </time>
                      </div>
                      <p>{comment.body}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>{copy.noComments}</p>
              )}
              <CommentForm
                locale={locale}
                debateId={debateId}
                argumentId={argument.id}
              />
            </div>
          </details>
        </div>
      </details>
    </article>
  );
}

function SourceForm({
  locale,
  debateId,
  argumentId,
}: {
  locale: Locale;
  debateId: string;
  argumentId: string;
}) {
  const copy = getCopy(locale).communityDebate;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");

    startTransition(async () => {
      const response = await fetch(
        `/api/community-debates/${debateId}/arguments/${argumentId}/sources`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: formData.get("label"),
            url: formData.get("url"),
          }),
        },
      );
      if (!response.ok) {
        setError(copy.sourceError);
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="community-inline-form">
      <button type="button" onClick={() => setOpen((value) => !value)}>
        ＋ {copy.addSource}
      </button>
      {open ? (
        <form onSubmit={submitSource}>
          <input
            name="label"
            placeholder={copy.sourceLabelPlaceholder}
            minLength={2}
            maxLength={160}
            required
          />
          <input name="url" type="url" placeholder="https://…" required />
          <button type="submit" disabled={pending}>{copy.saveSource}</button>
          {error ? <p className="community-error" role="alert">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

function CommentForm({
  locale,
  debateId,
  argumentId,
}: {
  locale: Locale;
  debateId: string;
  argumentId: string;
}) {
  const copy = getCopy(locale).communityDebate;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");

    startTransition(async () => {
      const response = await fetch(
        `/api/community-debates/${debateId}/arguments/${argumentId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: formData.get("body") }),
        },
      );
      if (!response.ok) {
        setError(copy.commentError);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form className="community-comment-form" onSubmit={submitComment}>
      <textarea
        name="body"
        placeholder={copy.commentPlaceholder}
        minLength={2}
        maxLength={1200}
        required
      />
      <button type="submit" disabled={pending}>{copy.publishComment}</button>
      {error ? <p className="community-error" role="alert">{error}</p> : null}
    </form>
  );
}
