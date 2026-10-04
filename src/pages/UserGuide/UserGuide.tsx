import { Input } from "antd";
import { BookOpen, Search } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { EmptyNote } from "../../components/Details/DetailKit";
import GuideContents from "./components/GuideContents";
import GuideSection from "./components/GuideSection";
import { GUIDE_GROUPS, GUIDE_SECTIONS } from "./components/guideData";

/**
 * The manual.
 *
 * Laid out as a reference rather than a brochure: contents down the side that
 * stay put, a search that reaches the steps and not just the titles, and topics
 * in the order somebody actually meets them — set the company up, admit a
 * client, take the register, issue the receipt.
 */
const UserGuide: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(
    GUIDE_SECTIONS[0]?.id ?? null
  );
  const listRef = useRef<HTMLDivElement>(null);

  /* Searching the steps, not only the titles. Somebody looking for "refund"
     will not find it in a heading — it is three words inside a section about
     the ledger, which is exactly the case a search is for. */
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GUIDE_SECTIONS;
    return GUIDE_SECTIONS.filter((s) =>
      [s.title, s.intro, s.where, s.note, s.tip, ...s.steps]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(q))
    );
  }, [query]);

  /* Which section the reader is in, so the contents can say so. An observer
     rather than a scroll handler: the page scrolls inside a wrapper, not the
     window, and a handler bound to the wrong one silently never fires. */
  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => !!n);
    if (nodes.length === 0) return;

    const seen = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        // The one showing most of itself wins; ties go to the first on the page.
        let best: string | null = null;
        let bestRatio = 0;
        for (const s of sections) {
          const ratio = seen.get(s.id) ?? 0;
          if (ratio > bestRatio) {
            best = s.id;
            bestRatio = ratio;
          }
        }
        if (best) setActiveId(best);
      },
      // Top third of the viewport: the section a reader is "in" is the one
      // under their eyes, not the one technically topmost.
      { rootMargin: "-80px 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [sections]);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
    setActiveId(id);
  };

  const groupCount = GUIDE_GROUPS.filter((g) =>
    sections.some((s) => s.group === g)
  ).length;

  return (
    <div>
      <PageMeta
        title="User Guide - Zoom Property Admin"
        description="How to run the company in this software — admissions, projects, attendance, fees, exams and receipts."
        keywords="user guide, help, documentation, admin, Zoom Property"
        canonicalUrl={`${window.location.origin}/user-guide`}
        noindex={true}
      />

      <PageHeader
        title="User Guide"
        subtitle="How to run the company in this software"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "User Guide" },
        ]}
      />

      {/* A short, plain opening. A full-width gradient banner is decoration on
          a page somebody opened because they were stuck. */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-secondary-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-white">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-secondary-900">
              {GUIDE_SECTIONS.length} topics across {GUIDE_GROUPS.length} areas
            </p>
            <p className="text-xs leading-relaxed text-secondary-500">
              In the order you meet them — set up, admit, teach, collect, issue.
              Each topic says where the screen is and what permission it needs.
            </p>
          </div>
        </div>

        <Input
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the guide…"
          prefix={<Search className="h-4 w-4 text-secondary-300" />}
          className="sm:w-72"
        />
      </div>

      {query.trim() && (
        <p className="mt-3 text-xs text-secondary-400">
          {sections.length} topic{sections.length === 1 ? "" : "s"} in{" "}
          {groupCount} area{groupCount === 1 ? "" : "s"} match “{query.trim()}”
        </p>
      )}

      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Contents. `self-start` is what lets `sticky` work inside a flex row —
            a stretched item is as tall as the list beside it and never has
            anywhere to stick to. */}
        <aside className="hidden w-60 shrink-0 self-start lg:block lg:sticky lg:top-20">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-secondary-400">
            Contents
          </p>
          <GuideContents
            sections={sections}
            activeId={activeId}
            onJump={jump}
          />
        </aside>

        <div ref={listRef} className="min-w-0 flex-1 space-y-4">
          {sections.length === 0 ? (
            <div className="rounded-xl border border-secondary-100 bg-white p-6">
              <EmptyNote
                icon={Search}
                title="Nothing in the guide matches that"
                hint="Try a shorter word — the search reads the steps as well as the titles."
              />
            </div>
          ) : (
            sections.map((section) => (
              <GuideSection key={section.id} section={section} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
