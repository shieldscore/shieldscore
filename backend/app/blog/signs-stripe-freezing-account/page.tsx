import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "5 Signs Stripe Is About to Freeze Your Account | ShieldScore",
  description:
    "Most merchants don't see it coming. Here's what to watch for before your next payout gets held.",
  openGraph: {
    title: "5 Signs Stripe Is About to Freeze Your Account",
    description:
      "Most merchants don't see it coming. Here's what to watch for before your next payout gets held.",
    type: "article",
  },
};

export default function SignsStripeFreezing() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Nav />

      <article className="article px-6 pt-[140px] pb-24">
        <div className="mx-auto max-w-[720px]">
          {/* Header */}
          <header className="mb-12">
            <a
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#999] no-underline hover:text-[#666]"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to blog
            </a>

            <h1 className="mt-6 text-[32px] font-bold leading-tight tracking-tight md:text-[40px]">
              5 Signs Stripe Is About to Freeze Your Account
            </h1>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#666]">
              Most merchants don&apos;t see it coming. Here&apos;s what to watch
              for before your next payout gets held.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#999]">
              <span>April 13, 2026</span>
              <span className="text-[#ddd]">&middot;</span>
              <span>6 min read</span>
            </div>
          </header>

          {/* Body */}
          <div className="text-[16px] leading-[1.7] text-[#333]">
            <hr />

            <h2>1. Your dispute ratio is climbing and you haven&apos;t noticed</h2>

            <p>
              Stripe tracks your dispute ratio internally. They calculate it as
              total disputes divided by total charges over a rolling window. You
              can see individual disputes in your dashboard, but Stripe never
              shows you the ratio itself.
            </p>
            <p>
              If you&apos;ve had 15 disputes out of 2,000 charges this month,
              your ratio is 0.75%. That sounds low. But the Mastercard CMM
              warning threshold is 1.0%, and at your current pace, you&apos;ll
              hit it in two weeks.
            </p>
            <p>
              Most merchants don&apos;t do this math. They see a dispute
              notification, deal with it, and move on. They never calculate the
              percentage. That&apos;s how you go from &ldquo;a few
              disputes&rdquo; to &ldquo;your account is under review&rdquo;
              without warning.
            </p>
            <p>
              <strong>What to do:</strong> Count your disputes and charges from
              the last 30 days. Divide disputes by charges. If the result is
              above 0.5%, pay attention. Above 0.75%, take action. Above 1.0%,
              you&apos;re in Mastercard&apos;s CMM monitoring zone.
            </p>

            <hr />

            <h2>2. You received an email about &ldquo;additional information needed&rdquo;</h2>

            <p>
              Stripe occasionally requests additional documentation about your
              business. This can include proof of business registration, identity
              verification, product descriptions, or fulfillment evidence.
            </p>
            <p>
              These emails are easy to ignore. They look routine. But
              they&apos;re a signal that Stripe&apos;s underwriting team is
              reviewing your account. If you don&apos;t respond promptly, Stripe
              can restrict your capabilities or pause payouts until the
              requirements are met.
            </p>
            <p>
              <strong>What to do:</strong> Respond within 48 hours. Upload every
              document they request. Don&apos;t skip optional fields. The faster
              you resolve requirements, the less likely your account gets
              escalated.
            </p>

            <hr />

            <h2>3. Your refund rate spiked suddenly</h2>

            <p>
              A sudden increase in refunds tells Stripe something changed about
              your business. Maybe you launched a new product that customers
              don&apos;t like. Maybe you changed your billing cycle. Maybe your
              fulfillment partner is dropping the ball.
            </p>
            <p>
              Stripe&apos;s algorithms monitor refund velocity as a risk signal.
              A merchant who normally refunds 2% of transactions and suddenly
              refunds 8% looks like a business in trouble. Even if every refund
              is legitimate, the spike triggers scrutiny.
            </p>
            <p>
              <strong>What to do:</strong> If you&apos;re issuing a batch of
              refunds (product recall, service outage, pricing error), contact
              Stripe support proactively. Explain the situation before their
              algorithms flag it. A voluntary explanation is always better than
              an involuntary investigation.
            </p>

            <hr />

            <h2>4. You&apos;re seeing more declined transactions than usual</h2>

            <p>
              A spike in declined transactions can indicate card-testing bot
              activity. Fraudsters use automated tools to test stolen card
              numbers against your checkout. Most attempts fail, creating a
              surge in declines.
            </p>
            <p>
              Visa monitors decline rates and flags merchants exceeding 20%
              under their enumeration program. But even before you hit 20%,
              Stripe&apos;s own systems may notice the pattern and investigate.
            </p>
            <p>
              The other risk: some of the tested cards will succeed. Those
              charges become fraud disputes later, pushing your dispute ratio up.
            </p>
            <p>
              <strong>What to do:</strong> Check your decline rate. If it&apos;s
              above 10%, enable CAPTCHA on your checkout. Review Stripe Radar
              rules for velocity-based blocking. Enable 3D Secure for
              transactions that match suspicious patterns.
            </p>

            <hr />

            <h2>5. You can&apos;t find anything wrong, but your payouts slowed down</h2>

            <p>
              Sometimes the first sign is subtle. Your payouts used to arrive on
              a 2-day rolling schedule. Now they&apos;re taking 4 days. Or 7
              days. Or they&apos;re being held as a &ldquo;reserve.&rdquo;
            </p>
            <p>
              Stripe can impose rolling reserves without sending you a formal
              notification. They hold a percentage of your revenue (typically
              5-10%) for an extended period (90-180 days) as a buffer against
              potential disputes or refunds.
            </p>
            <p>
              You might notice this as a smaller payout than expected, or a new
              &ldquo;reserve&rdquo; line item in your balance. Stripe
              doesn&apos;t always explain why the reserve was added.
            </p>
            <p>
              <strong>What to do:</strong> Go to your Stripe Dashboard and check
              your balance details. Look for any reserve amounts. Check Settings
              &gt; Account details for any pending requirements. If you see
              reserves and don&apos;t know why, contact Stripe support and ask
              directly.
            </p>

            <hr />

            <h2>The common thread</h2>

            <p>
              All five signs point to the same underlying issue: Stripe sees
              risk signals that you don&apos;t. They have access to your
              complete transaction data, industry benchmarks, card network
              reports, and their own proprietary risk models. You have access to
              individual transaction details and your balance.
            </p>
            <p>
              The information gap is the problem. You can&apos;t manage what you
              can&apos;t measure.
            </p>

            <hr />

            <p className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6 text-[15px] leading-[1.7] text-[#555]">
              <strong className="text-[#111]">ShieldScore</strong> is a free
              Stripe App that closes this gap. It calculates your dispute and
              fraud ratios in real time, tracks them against card network
              thresholds, and alerts you when your account health changes.{" "}
              <a
                href="https://marketplace.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#22c55e] underline hover:text-[#16a34a]"
              >
                Install it from the Stripe App Marketplace
              </a>
              .
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
