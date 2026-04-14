"use client";

import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

type Category = "All" | "Compliance" | "Disputes" | "Account Health";

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: Category;
}

const featuredPost: Post = {
  slug: "vamp-ecm-thresholds-2026",
  title: "The 2026 Guide to Visa VAMP, Mastercard CMM, and ECM Thresholds",
  description:
    "Everything Stripe merchants need to know about card network dispute monitoring programs, how they work, and what happens when you breach them.",
  date: "April 2026",
  readTime: "12 min read",
  category: "Compliance",
};

const posts: Post[] = [
  {
    slug: "stripe-account-frozen-what-to-do",
    title: "Stripe Account Frozen: What to Do Next",
    description:
      "Your payouts are on hold. Your funds are locked. Here is how to respond step by step.",
    date: "April 13, 2026",
    readTime: "7 min read",
    category: "Account Health",
  },
  {
    slug: "requirements-currently-due-stripe",
    title: "What requirements.currently_due Means on Your Stripe Account",
    description:
      "The silent signal that Stripe is reviewing your business. Learn what triggers it and how to respond.",
    date: "April 13, 2026",
    readTime: "5 min read",
    category: "Account Health",
  },
  {
    slug: "win-stripe-dispute-evidence-guide",
    title: "How to Win a Stripe Dispute: Evidence Guide by Reason Code",
    description:
      "The right evidence for each dispute type. Estimated win rates included.",
    date: "April 13, 2026",
    readTime: "10 min read",
    category: "Disputes",
  },
  {
    slug: "signs-stripe-freezing-account",
    title: "5 Signs Stripe Is About to Freeze Your Account",
    description:
      "Most merchants don't see it coming. Here is what to watch for before your next payout gets held.",
    date: "April 13, 2026",
    readTime: "6 min read",
    category: "Account Health",
  },
];

const categories: Category[] = ["All", "Compliance", "Disputes", "Account Health"];

function CategoryPill({ category }: { category: Post["category"] }) {
  const styles: Record<string, string> = {
    Compliance: "bg-[#f0fdf4] text-[#16a34a]",
    Disputes: "bg-[#eff6ff] text-[#2563eb]",
    "Account Health": "bg-[#fff7ed] text-[#ea580c]",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${styles[category]}`}
    >
      {category}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-[#999] transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BlogContent() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredPosts =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Nav />

      {/* Hero */}
      <section className="px-6 pt-[140px] pb-6">
        <div className="mx-auto max-w-[800px]">
          <h1 className="text-[40px] font-[800] leading-tight tracking-tight">
            Blog
          </h1>
          <p className="mt-3 text-[16px] leading-[1.7] text-[#666]">
            Guides on Stripe account health, dispute monitoring, and card
            network compliance.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="px-6 pt-6 pb-8">
        <div className="mx-auto max-w-[800px]">
          <a
            href={`/blog/${featuredPost.slug}`}
            className="group block rounded-[16px] border border-[#bbf7d0] bg-[#f0fdf4] p-8 no-underline transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#22c55e]">
              Featured
            </span>

            <div className="mt-3">
              <CategoryPill category={featuredPost.category} />
            </div>

            <h2 className="mt-3 text-[24px] font-bold leading-snug text-[#111] group-hover:underline">
              {featuredPost.title}
            </h2>

            <p className="mt-2 text-[15px] leading-[1.6] text-[#666]">
              {featuredPost.description}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-[12px] text-[#999]">
                {featuredPost.date}
              </span>
              <span className="text-[#ddd]">&middot;</span>
              <span className="font-mono text-[12px] text-[#999]">
                {featuredPost.readTime}
              </span>
              <div className="ml-auto">
                <ArrowIcon />
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 pb-6">
        <div className="mx-auto flex max-w-[800px] gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[12px] font-medium transition-colors duration-150 ${
                activeCategory === cat
                  ? "bg-[#111] text-white"
                  : "border border-[#e5e7eb] bg-white text-[#666] hover:border-[#d1d5db] hover:text-[#111]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Post Grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-[800px] grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredPosts.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-6 no-underline transition-all duration-200 hover:border-[#d1d5db] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <CategoryPill category={post.category} />

              <h3 className="mt-3 text-[18px] font-bold leading-snug text-[#111] group-hover:underline">
                {post.title}
              </h3>

              <p className="mt-2 line-clamp-2 text-[14px] leading-[1.6] text-[#666]">
                {post.description}
              </p>

              <div className="mt-auto flex items-center gap-3 pt-4">
                <span className="font-mono text-[12px] text-[#999]">
                  {post.date}
                </span>
                <span className="text-[#ddd]">&middot;</span>
                <span className="font-mono text-[12px] text-[#999]">
                  {post.readTime}
                </span>
                <div className="ml-auto">
                  <ArrowIcon />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
