import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Stripe Account Frozen: What to Do Next | ShieldScore",
  description:
    "Your payouts are on hold. Your funds are locked. Here's how to respond step by step.",
  openGraph: {
    title: "Stripe Account Frozen: What to Do Next",
    description:
      "Your payouts are on hold. Your funds are locked. Here's how to respond step by step.",
    type: "article",
  },
};

export default function StripeAccountFrozen() {
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
              Stripe Account Frozen: What to Do Next
            </h1>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#666]">
              Your payouts are on hold. Your funds are locked. Here&apos;s how
              to respond.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#999]">
              <span>April 13, 2026</span>
              <span className="text-[#ddd]">&middot;</span>
              <span>7 min read</span>
            </div>
          </header>

          {/* Body */}
          <div className="text-[16px] leading-[1.7] text-[#333]">
            <hr />

            <h2>Don&apos;t panic (but act fast)</h2>

            <p>
              If Stripe froze your account, your funds are being held, your
              payouts are paused, and you might not be able to process new
              charges. This is stressful. But panicking leads to mistakes.
              Here&apos;s what to do, step by step.
            </p>

            <hr />

            <h2>Step 1: Understand what happened</h2>

            <p>
              Stripe freezes accounts for several reasons. Check your email for
              any communication from Stripe. Then log into your Dashboard and
              check:
            </p>
            <ul>
              <li>
                <strong>Settings &gt; Account details:</strong> Look for any
                pending requirements or warnings
              </li>
              <li>
                <strong>Balances:</strong> Check if funds are in a
                &ldquo;reserve&rdquo; or &ldquo;on hold&rdquo; status
              </li>
              <li>
                <strong>Capabilities:</strong> See which capabilities (card
                payments, transfers, etc.) are active, restricted, or pending
              </li>
            </ul>

            <p>Common reasons for account freezes:</p>
            <ul>
              <li>
                Dispute ratio exceeded card network thresholds
              </li>
              <li>
                Business type is on Stripe&apos;s restricted or prohibited list
              </li>
              <li>KYC/identity verification requirements not met</li>
              <li>
                Unusual transaction patterns flagged as potential fraud
              </li>
              <li>
                High refund velocity suggesting business problems
              </li>
              <li>
                Customer complaints to Stripe about your business
              </li>
            </ul>

            <hr />

            <h2>Step 2: Check your dispute ratio</h2>

            <p>
              Calculate your dispute ratio: total disputes in the last 30 days
              divided by total successful charges in the last 30 days.
            </p>
            <p>
              If your ratio is above 1.0%, you&apos;re in Mastercard&apos;s CMM
              monitoring zone. Above 1.5%, you&apos;re in the penalty zone for
              both Visa VAMP and Mastercard ECM.
            </p>
            <p>
              Card network thresholds are the most common reason for account
              action, and they&apos;re the most fixable.
            </p>

            <hr />

            <h2>Step 3: Respond to every requirement</h2>

            <p>
              If Stripe requested documents or information, provide everything
              immediately. Every day you delay increases the risk of further
              restrictions.
            </p>
            <p>
              Upload documents exactly as requested. High-quality scans or
              photos. Make sure text is readable. Don&apos;t upload the wrong
              document type.
            </p>

            <hr />

            <h2>Step 4: Submit evidence for open disputes</h2>

            <p>
              If you have open disputes, submit evidence for every single one.
              Even disputes you think you&apos;ll lose. Responding shows Stripe
              and the card networks that you&apos;re actively managing the
              issue.
            </p>
            <p>
              Prioritize disputes with reason codes that have higher win rates:
            </p>
            <ul>
              <li>
                <code>product_not_received</code> with shipping proof (~70% win
                rate)
              </li>
              <li>
                <code>duplicate</code> with separate order IDs (~60%)
              </li>
              <li>
                <code>credit_not_processed</code> with refund receipts (~55%)
              </li>
            </ul>

            <hr />

            <h2>Step 5: Contact Stripe support</h2>

            <p>
              After you&apos;ve submitted all requirements and dispute evidence,
              contact Stripe support directly. Be professional and specific:
            </p>
            <ul>
              <li>State your account ID</li>
              <li>
                List the steps you&apos;ve already taken (documents uploaded,
                disputes responded to)
              </li>
              <li>
                Ask what additional steps are needed to lift the restriction
              </li>
              <li>Ask for a specific timeline</li>
            </ul>
            <p>
              Don&apos;t send emotional emails. Don&apos;t threaten legal
              action. Support agents have limited discretion, and cooperative
              merchants get better outcomes.
            </p>

            <hr />

            <h2>Step 6: Reduce your risk going forward</h2>

            <p>
              While your account is under review, take steps to reduce future
              risk:
            </p>

            <p>
              <strong>Enable 3D Secure</strong> on all transactions or at
              minimum on transactions above your average order value. This shifts
              fraud liability to the card issuer.
            </p>
            <p>
              <strong>Review your billing descriptor.</strong> An unclear
              descriptor causes &ldquo;unrecognized&rdquo; disputes. Make sure
              the name on the cardholder&apos;s statement matches your brand
              name.
            </p>
            <p>
              <strong>Tighten Radar rules.</strong> Block transactions from
              high-risk countries, require CVC verification, and add velocity
              rules to prevent card testing.
            </p>
            <p>
              <strong>Improve customer communication.</strong> Many disputes
              happen because customers can&apos;t reach you. Make your refund
              policy clear. Respond to support inquiries within 24 hours. Send
              proactive shipping updates.
            </p>
            <p>
              <strong>Consider proactive refunds.</strong> If you see early fraud
              warnings (TC40 reports) for recent charges, refunding those charges
              before they become disputes keeps them out of your dispute ratio.
            </p>

            <hr />

            <h2>Step 7: Plan for the worst case</h2>

            <p>
              If Stripe terminates your account, you need a backup plan:
            </p>

            <p>
              <strong>Alternative processors:</strong> PayPal, Square, Braintree,
              Adyen, and Authorize.net all accept merchants. Apply to at least
              one alternative processor before you need them.
            </p>
            <p>
              <strong>The MATCH list:</strong> If Stripe places you on the
              MATCH/TMF list due to excessive chargebacks, most major processors
              will decline your application for 5 years. Smaller processors and
              high-risk payment facilitators may still work with you, but at
              higher fees (typically 4-8% per transaction plus monthly minimums).
            </p>
            <p>
              <strong>Fund access:</strong> Stripe typically holds funds in
              reserve for 90-180 days after account closure. You will eventually
              receive your money, but the timeline is long. Plan your cash flow
              accordingly.
            </p>

            <hr />

            <h2>How to prevent this from happening again</h2>

            <p>
              The best defense is monitoring. Merchants who track their dispute
              ratios weekly catch problems before they become crises. Merchants
              who ignore their ratios until payouts stop are the ones who post
              angry reviews on Trustpilot.
            </p>
            <p>
              The best time to start monitoring was before your account got
              frozen. The second best time is now.
            </p>

            <hr />

            <p className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6 text-[15px] leading-[1.7] text-[#555]">
              <strong className="text-[#111]">ShieldScore</strong> monitors your
              account health in real time. It tracks your dispute and fraud
              ratios against card network thresholds, shows a health score from 0
              to 100, estimates days until you&apos;d breach each threshold, and
              sends email alerts when Stripe flags your account.{" "}
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
