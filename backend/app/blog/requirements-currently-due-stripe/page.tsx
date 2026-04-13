import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title:
    "What requirements.currently_due Means on Your Stripe Account | ShieldScore",
  description:
    "The silent signal that Stripe is reviewing your business. Learn what triggers it and how to respond.",
  openGraph: {
    title:
      "What requirements.currently_due Means on Your Stripe Account",
    description:
      "The silent signal that Stripe is reviewing your business. Learn what triggers it and how to respond.",
    type: "article",
  },
};

export default function RequirementsCurrentlyDue() {
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
              What requirements.currently_due Means on Your Stripe Account
            </h1>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#666]">
              The silent signal that Stripe is reviewing your business.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#999]">
              <span>April 13, 2026</span>
              <span className="text-[#ddd]">&middot;</span>
              <span>5 min read</span>
            </div>
          </header>

          {/* Body */}
          <div className="text-[16px] leading-[1.7] text-[#333]">
            <hr />

            <h2>What is requirements.currently_due?</h2>

            <p>
              Every Stripe account has an object called{" "}
              <code>requirements</code> attached to it. This object contains
              several arrays that tell you what Stripe needs from you:
            </p>
            <ul>
              <li>
                <code>currently_due</code>: Things Stripe needs right now. If
                not provided, capabilities may be restricted.
              </li>
              <li>
                <code>eventually_due</code>: Things Stripe will need in the
                future. No immediate action required.
              </li>
              <li>
                <code>past_due</code>: Things Stripe already asked for and you
                haven&apos;t provided. Your account may already be restricted.
              </li>
              <li>
                <code>pending_verification</code>: Documents you submitted that
                Stripe is still reviewing.
              </li>
            </ul>

            <p>
              When <code>requirements.currently_due</code> populates with items,
              it means Stripe&apos;s underwriting or compliance team has
              determined they need more information about your business. This can
              happen at any time, not just during initial onboarding.
            </p>

            <hr />

            <h2>Why does it populate?</h2>

            <p>
              Several things can trigger Stripe to add new requirements to your
              account:
            </p>

            <p>
              <strong>Regulatory changes.</strong> New KYC (Know Your Customer)
              regulations may require Stripe to collect additional identity or
              business documentation from existing merchants.
            </p>
            <p>
              <strong>Volume milestones.</strong> When your processing volume
              crosses certain thresholds, Stripe may request additional
              verification. A merchant processing $5,000/month gets less
              scrutiny than one processing $500,000/month.
            </p>
            <p>
              <strong>Risk signals.</strong> Elevated dispute ratios, refund
              spikes, or unusual transaction patterns can trigger a manual
              review, which often starts with Stripe requesting additional
              documentation.
            </p>
            <p>
              <strong>Industry review.</strong> If Stripe determines your
              business operates in a higher-risk category than originally
              classified, they may request additional information about your
              business model, supply chain, or fulfillment process.
            </p>
            <p>
              <strong>Periodic re-verification.</strong> Stripe periodically
              re-verifies merchant information. This is routine and doesn&apos;t
              necessarily mean anything is wrong.
            </p>

            <hr />

            <h2>The silent notification problem</h2>

            <p>
              Here&apos;s the issue: when Stripe adds items to{" "}
              <code>requirements.currently_due</code>, they don&apos;t always
              send you an email about it. The change happens via an{" "}
              <code>account.updated</code> webhook event and an update to your
              account object in the API. But if you&apos;re not monitoring
              webhooks or checking your account details page regularly, you
              won&apos;t know.
            </p>
            <p>You might find out when:</p>
            <ul>
              <li>
                A capability gets restricted (you can no longer process certain
                payment types)
              </li>
              <li>A payout gets held</li>
              <li>
                You log into the dashboard and notice a banner asking for
                information
              </li>
            </ul>
            <p>
              By then, the requirement may have been sitting there for days or
              weeks. The longer it goes unresolved, the more likely Stripe
              escalates to restricting your account.
            </p>

            <hr />

            <h2>Common requirements Stripe requests</h2>

            <ul>
              <li>
                <code>individual.verification.document</code>: Government-issued
                ID for the account representative
              </li>
              <li>
                <code>company.verification.document</code>: Business
                registration or incorporation documents
              </li>
              <li>
                <code>individual.verification.additional_document</code>:
                Secondary ID or proof of address
              </li>
              <li>
                <code>business_profile.url</code>: Your business website URL
              </li>
              <li>
                <code>business_profile.product_description</code>: Description
                of what you sell
              </li>
              <li>
                <code>tos_acceptance.date</code> and{" "}
                <code>tos_acceptance.ip</code>: Stripe&apos;s terms of service
                acceptance
              </li>
              <li>
                <code>external_account</code>: Bank account for payouts
              </li>
              <li>
                <code>representative.verification.document</code>: ID for the
                person listed as the company representative
              </li>
            </ul>

            <hr />

            <h2>What to do when requirements appear</h2>

            <p>
              <strong>Check immediately.</strong> Go to Stripe Dashboard &gt;
              Settings &gt; Account details. Any pending requirements will be
              listed there with instructions on what to provide.
            </p>
            <p>
              <strong>Respond within 24-48 hours.</strong> Don&apos;t let
              requirements sit. The longer they&apos;re outstanding, the higher
              the chance Stripe restricts your capabilities.
            </p>
            <p>
              <strong>Provide exactly what&apos;s asked for.</strong> If Stripe
              requests a &ldquo;business registration document,&rdquo; upload
              your actual business registration. Don&apos;t upload a bank
              statement or a utility bill. Mismatched documents create more
              delays.
            </p>
            <p>
              <strong>Follow up.</strong> After submitting, some documents go
              into <code>pending_verification</code>. This means Stripe is
              reviewing them. This can take a few business days. If your
              capabilities are restricted during this time, contact Stripe
              support to ask about the timeline.
            </p>

            <hr />

            <h2>How to monitor requirements.currently_due automatically</h2>

            <p>You have three options:</p>

            <p>
              <strong>Manual:</strong> Log into your Stripe Dashboard weekly and
              check Settings &gt; Account details. Free but easy to forget.
            </p>
            <p>
              <strong>API polling:</strong> Write a script that calls{" "}
              <code>GET /v1/accounts/{"{id}"}</code> and checks the{" "}
              <code>requirements.currently_due</code> array. Run it daily via a
              cron job. Requires development work.
            </p>
            <p>
              <strong>ShieldScore:</strong> A free Stripe App that monitors the{" "}
              <code>account.updated</code> webhook in real time. When Stripe
              adds items to <code>requirements.currently_due</code> or changes a
              capability status, ShieldScore sends you an email alert within
              minutes.
            </p>

            <hr />

            <h2>The bottom line</h2>

            <p>
              <code>requirements.currently_due</code> is Stripe&apos;s way of
              asking for information before they take action on your account. If
              you catch it early, it&apos;s a simple document upload. If you miss
              it, it can lead to restricted capabilities, held payouts, or
              account review.
            </p>
            <p>Don&apos;t wait for the consequences. Monitor it actively.</p>

            <hr />

            <p className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6 text-[15px] leading-[1.7] text-[#555]">
              <strong className="text-[#111]">ShieldScore</strong> monitors{" "}
              <code>requirements.currently_due</code> and capability changes in
              real time, alerting you within minutes when Stripe flags your
              account.{" "}
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
