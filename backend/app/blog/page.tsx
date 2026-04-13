import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Blog | ShieldScore",
  description:
    "Guides and insights on Stripe account health, dispute monitoring, and card network compliance for merchants.",
};

const posts = [
  {
    slug: "stripe-account-frozen-what-to-do",
    title: "Stripe Account Frozen: What to Do Next",
    description:
      "Your payouts are on hold. Your funds are locked. Here's how to respond step by step.",
    date: "April 13, 2026",
    readTime: "7 min read",
  },
  {
    slug: "requirements-currently-due-stripe",
    title: "What requirements.currently_due Means on Your Stripe Account",
    description:
      "The silent signal that Stripe is reviewing your business. Learn what triggers it and how to respond.",
    date: "April 13, 2026",
    readTime: "5 min read",
  },
  {
    slug: "win-stripe-dispute-evidence-guide",
    title: "How to Win a Stripe Dispute: Evidence Guide by Reason Code",
    description:
      "The right evidence for each dispute type. Estimated win rates included.",
    date: "April 13, 2026",
    readTime: "10 min read",
  },
  {
    slug: "signs-stripe-freezing-account",
    title: "5 Signs Stripe Is About to Freeze Your Account",
    description:
      "Most merchants don't see it coming. Here's what to watch for before your next payout gets held.",
    date: "April 13, 2026",
    readTime: "6 min read",
  },
  {
    slug: "vamp-ecm-thresholds-2026",
    title: "The 2026 Guide to Visa VAMP, Mastercard CMM, and ECM Thresholds",
    description:
      "Everything Stripe merchants need to know about card network dispute monitoring programs, how they work, and what happens when you breach them.",
    date: "April 2026",
    readTime: "12 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Nav />

      <section className="px-6 pt-[140px] pb-24">
        <div className="mx-auto max-w-[720px]">
          <h1 className="text-[36px] font-bold leading-tight tracking-tight md:text-[48px]">
            Blog
          </h1>
          <p className="mt-3 text-[16px] leading-[1.7] text-[#666]">
            Guides on Stripe account health, dispute monitoring, and card
            network compliance.
          </p>

          <div className="mt-12 flex flex-col gap-0 divide-y divide-[#f0f0f0]">
            {posts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block py-8 no-underline first:pt-0"
              >
                <div className="flex items-center gap-3 text-[13px] text-[#999]">
                  <span>{post.date}</span>
                  <span className="text-[#ddd]">&middot;</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-2 text-[20px] font-semibold leading-snug text-[#111] group-hover:text-[#22c55e] md:text-[22px]">
                  {post.title}
                </h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#666]">
                  {post.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
