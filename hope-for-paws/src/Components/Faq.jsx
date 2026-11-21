import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, Mail, X } from "lucide-react";
import { API_ORIGIN } from "../config";

// Questions come from the backend (backend/utils/faqData.js plus any extra ones saved by the team),
// grouped by category.
const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_ORIGIN}/faqRoutes`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => {
        setFaqs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("We couldn't load the questions right now. Please refresh the page or try again in a moment.");
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Categories in the order they arrive from the server
  const categories = useMemo(() => {
    const seen = new Map();
    faqs.forEach((f) => {
      const id = f.categoryId || "more";
      if (!seen.has(id)) seen.set(id, { id, title: f.category || "More questions", count: 0 });
      seen.get(id).count += 1;
    });
    return [...seen.values()];
  }, [faqs]);

  const term = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      faqs.filter((f) => {
        if (activeCategory !== "all" && (f.categoryId || "more") !== activeCategory) return false;
        if (!term) return true;
        // Every word must appear somewhere in the question or answer ("cancel order" finds "cancel my order")
        const text = `${f.question} ${f.answer}`.toLowerCase();
        return term.split(/\s+/).every((word) => text.includes(word));
      }),
    [faqs, activeCategory, term]
  );

  const groups = useMemo(() => {
    const byId = new Map();
    visible.forEach((f) => {
      const id = f.categoryId || "more";
      if (!byId.has(id)) byId.set(id, { id, title: f.category || "More questions", items: [] });
      byId.get(id).items.push(f);
    });
    return [...byId.values()];
  }, [visible]);

  const toggle = (key) => setOpenKey((prev) => (prev === key ? null : key));

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <section className="px-4 pb-6 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold text-[#4E3B31] sm:text-5xl">Frequently Asked Questions</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-[#6b493d] sm:text-lg">
          Everything about adopting, rehoming, the Marketplace, selling, chat and your account.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {/* Search banner */}
        <div className="mb-10 rounded-3xl bg-gradient-to-br from-[#6b493d] to-[#a07855] p-5 shadow-lg sm:p-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">How can we help?</h2>
          <p className="mt-1 text-sm text-white/80">Search the questions below or pick a topic.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a07855]" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpenKey(null);
                }}
                placeholder="Search questions…"
                aria-label="Search frequently asked questions"
                className="w-full rounded-xl border-0 bg-white py-3 pl-12 pr-10 text-[#4E3B31] shadow-sm outline-none focus:ring-2 focus:ring-white/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#a07855] hover:bg-[#f8f4ed]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative sm:w-64">
              <label htmlFor="faq-topic" className="sr-only">Topic</label>
              <select
                id="faq-topic"
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value);
                  setOpenKey(null);
                }}
                className="w-full appearance-none rounded-xl border-0 bg-white bg-none py-3 pl-4 pr-10 font-medium text-[#4E3B31] shadow-sm outline-none focus:ring-2 focus:ring-white/60"
              >
                <option value="all">All topics ({faqs.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a07855]" />
            </div>
          </div>
          {(query || activeCategory !== "all") && !loading && (
            <p className="mt-3 text-sm text-white/90">
              Showing {visible.length} of {faqs.length} questions
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                  setOpenKey(null);
                }}
                className="ml-2 font-semibold underline underline-offset-2"
              >
                Reset
              </button>
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/70" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{error}</div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-[#6b493d] shadow-sm">
            <p className="font-semibold">No questions match “{query}”.</p>
            <p className="mt-1 text-sm">Try a different word, or ask us directly using the links below.</p>
          </div>
        )}

        {!loading &&
          !error &&
          groups.map((group) => (
            <section key={group.id} className="mb-10">
              <h2 className="mb-3 text-xl font-bold text-[#4E3B31] sm:text-2xl">{group.title}</h2>
              <div className="divide-y divide-[#f0e7db] overflow-hidden rounded-2xl bg-white shadow-sm">
                {group.items.map((faq) => {
                  const key = `${group.id}:${faq.question}`;
                  const open = openKey === key;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#fcf9f5]"
                      >
                        <span className={`text-base font-semibold sm:text-lg ${open ? "text-[#6b493d]" : "text-[#2f241f]"}`}>
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-[#a07855] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <p className="whitespace-pre-line px-5 pb-5 text-[15px] leading-relaxed text-[#5c4a40] sm:text-base">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

        {/* Still need help */}
        <section className="mt-4 rounded-2xl border border-[#e5d9c8] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-[#4E3B31]">Still have a question?</h2>
          <p className="mt-2 text-[#6b493d]">
            Send a message to the Hope for Paws team, or open the assistant chat for quick help with the website.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/contactus"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6b493d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#57392f]"
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
