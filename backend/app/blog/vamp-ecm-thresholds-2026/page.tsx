import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title:
    "The 2026 Guide to Visa VAMP, Mastercard CMM, and ECM Thresholds | ShieldScore",
  description:
    "Everything Stripe merchants need to know about card network dispute monitoring programs, how they work, and what happens when you breach them.",
  openGraph: {
    title:
      "The 2026 Guide to Visa VAMP, Mastercard CMM, and ECM Thresholds",
    description:
      "Everything Stripe merchants need to know about card network dispute monitoring programs, how they work, and what happens when you breach them.",
    type: "article",
  },
};

export default function VAMPECMThresholds2026() {
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
              The 2026 Guide to Visa VAMP, Mastercard CMM, and ECM Thresholds
            </h1>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#666]">
              Everything Stripe merchants need to know about card network
              dispute monitoring programs, how they work, and what happens when
              you breach them.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#999]">
              <span>Last updated: April 2026</span>
              <span className="text-[#ddd]">&middot;</span>
              <span>12 min read</span>
            </div>
          </header>

          {/* Body */}
          <div
            className="text-[16px] leading-[1.7] text-[#333]"
          >
            <hr />

            <h2>What are VAMP, CMM, and ECM?</h2>

            <p>
              Visa, Mastercard, and other card networks run monitoring programs
              that track merchant dispute and fraud ratios. When a
              merchant&apos;s ratios exceed certain thresholds, the card network
              imposes warnings, fines, or bans.
            </p>
            <p>
              These programs exist to protect cardholders. But most merchants
              have never heard of them. They find out the hard way when their
              payment processor (Stripe, Square, PayPal) freezes their account,
              holds their funds, or terminates their service.
            </p>
            <p>
              Here are the three programs you need to know about in 2026.
            </p>

            <hr />

            <h2>Visa VAMP (Acquirer Monitoring Program)</h2>

            <p>
              Visa restructured its dispute monitoring in 2026 under the VAMP
              program. Here are the numbers that matter.
            </p>

            <p>
              <strong>Threshold:</strong> 1.5% combined fraud and dispute ratio
            </p>
            <p>
              <strong>How it&apos;s calculated:</strong> (TC40 Fraud Reports +
              Disputes) / Total Settled Transactions
            </p>
            <p>
              TC40 reports are fraud alerts that issuing banks send to Visa when
              a cardholder reports a transaction as fraudulent. These count
              toward your VAMP ratio even if the cardholder never files a formal
              dispute.
            </p>

            <h3>What happens when you breach 1.5%:</h3>
            <ul>
              <li>Visa notifies your acquirer (Stripe, in most cases)</li>
              <li>Financial penalties begin immediately</li>
              <li>
                Stripe passes these costs through to you or takes action on your
                account
              </li>
              <li>
                Continued breach leads to enrollment in a formal remediation
                program
              </li>
            </ul>

            <p>
              <strong>What most merchants get wrong:</strong> They only count
              disputes. VAMP includes fraud reports (TC40s) that you may never
              see in your Stripe dashboard. A customer can report a charge as
              fraudulent to their bank without filing a chargeback, and it still
              counts against your ratio.
            </p>

            <hr />

            <h2>Mastercard CMM (Chargeback-Monitored Merchant)</h2>

            <p>
              Mastercard runs a two-tier system. CMM is the warning tier.
            </p>

            <p>
              <strong>Threshold:</strong> 1.0% dispute ratio AND 100+ disputes
              in a calendar month
            </p>
            <p>
              <strong>How it&apos;s calculated:</strong> Disputes / Total
              Settled Transactions
            </p>
            <p>
              Both conditions must be met. If your ratio is 1.2% but you only
              have 80 disputes, you don&apos;t technically enter CMM. But Stripe
              may still take action based on the ratio alone.
            </p>

            <h3>What happens at CMM:</h3>
            <ul>
              <li>
                Mastercard issues a formal warning to your acquirer
              </li>
              <li>No financial penalties yet</li>
              <li>
                You&apos;re expected to bring your ratio below 1.0% within a
                defined period
              </li>
              <li>Failure to improve moves you to the ECM tier</li>
            </ul>

            <p>
              <strong>The real risk at CMM:</strong> Even though there are no
              Mastercard fines, Stripe often takes independent action when you
              enter CMM. They may add rolling reserves (holding 5-10% of your
              revenue for 90-180 days), restrict certain capabilities, or
              request additional documentation about your business.
            </p>

            <hr />

            <h2>Mastercard ECM (Excessive Chargeback Merchant)</h2>

            <p>
              ECM is the penalty tier. This is where it gets expensive.
            </p>

            <p>
              <strong>Threshold:</strong> 1.5% dispute ratio AND 100+ disputes
              for 2 consecutive months
            </p>
            <p>
              <strong>How it&apos;s calculated:</strong> Same as CMM. Disputes /
              Total Settled Transactions.
            </p>
            <p>
              The &ldquo;2 consecutive months&rdquo; requirement means you need
              to be above 1.5% with 100+ disputes in both the current month and
              the previous month to formally enter ECM.
            </p>

            <h3>What happens at ECM:</h3>
            <ul>
              <li>Fines starting at $25,000 per month</li>
              <li>
                Fines escalate the longer you stay in the program, potentially
                reaching $100,000+ per month
              </li>
              <li>Mandatory remediation plan submission</li>
              <li>Potential placement on the MATCH/TMF list</li>
            </ul>

            <p>
              <strong>What is the MATCH list?</strong> MATCH (Member Alert to
              Control High-risk merchants) is effectively a blacklist shared
              across all card processors. If you&apos;re placed on MATCH, no
              major processor will work with you for 5 years. Not Stripe, not
              Square, not PayPal, not anyone. Your business loses the ability to
              accept card payments.
            </p>

            <hr />

            <h2>Visa Enumeration (Card Testing)</h2>

            <p>
              This is a separate program focused on detecting card-testing bot
              attacks.
            </p>

            <p>
              <strong>Threshold:</strong> 20% decline rate
            </p>
            <p>
              When bots test stolen card numbers against your checkout, they
              generate a high volume of declined transactions. Visa monitors
              your decline rate and flags merchants exceeding 20%.
            </p>

            <p>
              <strong>What happens:</strong> Visa can impose fines on your
              acquirer, and Stripe will pass those costs to you or restrict your
              account. You may also see a spike in fraudulent charges from the
              cards that passed the test.
            </p>

            <h3>How to prevent it:</h3>
            <ul>
              <li>Enable CAPTCHA on your checkout page</li>
              <li>
                Use Stripe Radar rules to block suspicious velocity patterns
              </li>
              <li>Enable 3D Secure for high-risk transactions</li>
              <li>Monitor your decline rate weekly</li>
            </ul>

            <hr />

            <h2>How to Calculate Your Own Ratios</h2>

            <p>Here are the exact formulas.</p>

            <p>
              <strong>VAMP Ratio (Visa):</strong>
            </p>
            <pre>
              <code>
                (TC40 Fraud Reports + Disputes) / Total Settled Transactions
              </code>
            </pre>

            <p>
              <strong>Mastercard Dispute Ratio (CMM and ECM):</strong>
            </p>
            <pre>
              <code>Disputes / Total Settled Transactions</code>
            </pre>

            <p>
              <strong>Decline Rate (Enumeration):</strong>
            </p>
            <pre>
              <code>Declined Transactions / Total Transaction Attempts</code>
            </pre>

            <p>All ratios use a rolling 30-day window.</p>

            <h3>Where to get the numbers from Stripe:</h3>
            <ul>
              <li>
                <strong>Disputes:</strong> Stripe Dashboard &gt; Payments &gt;
                Disputes, filter to last 30 days, count the total
              </li>
              <li>
                <strong>Charges:</strong> Stripe Dashboard &gt; Payments, filter
                to last 30 days, count successful charges
              </li>
              <li>
                <strong>Fraud warnings:</strong> You need API access.{" "}
                <code>GET /v1/radar/early_fraud_warnings</code>
              </li>
              <li>
                <strong>Decline rate:</strong> Stripe Dashboard &gt; Payments,
                compare total vs declined
              </li>
            </ul>

            <p>
              The problem is doing this manually every day. Most merchants check
              once, see a low number, and never look again. The ratio can climb
              quickly if you have a few bad weeks.
            </p>

            <hr />

            <h2>
              What Stripe Does When You Approach These Thresholds
            </h2>

            <p>
              Stripe runs its own monitoring on top of the card network
              programs. They often take action before you officially enter VAMP
              or ECM.
            </p>

            <h3>Common actions Stripe takes:</h3>
            <ul>
              <li>
                Adding items to <code>requirements.currently_due</code> on your
                account (this happens silently, with no email notification)
              </li>
              <li>
                Changing account capabilities from &ldquo;active&rdquo; to
                &ldquo;restricted&rdquo; or &ldquo;pending&rdquo;
              </li>
              <li>
                Imposing rolling reserves (holding 5-10% of your volume for
                90-180 days)
              </li>
              <li>
                Requesting additional documentation about your business model
              </li>
              <li>Pausing payouts pending review</li>
              <li>Terminating the account entirely</li>
            </ul>

            <p>
              <strong>The information asymmetry problem:</strong> Stripe sees
              your ratios in real time. You don&apos;t. They make decisions
              based on data you can&apos;t access through the dashboard. By the
              time you get an email about an issue, the decision has already
              been made.
            </p>

            <hr />

            <h2>How to Stay Below the Thresholds</h2>

            <p>
              <strong>Respond to every dispute.</strong> Even if you think
              you&apos;ll lose. Submitting evidence shows card networks
              you&apos;re actively managing disputes.
            </p>

            <p>
              <strong>Submit evidence quickly.</strong> You have a limited window
              (usually 7-21 days depending on the network). Don&apos;t wait
              until the deadline.
            </p>

            <p>
              <strong>Know which disputes to fight.</strong> Not all reason codes
              have the same win rate:
            </p>
            <ul>
              <li>
                <code>product_not_received</code> with tracking proof:
                approximately 70% win rate
              </li>
              <li>
                <code>fraudulent</code> without 3D Secure: approximately 20%
                win rate
              </li>
              <li>
                <code>subscription_canceled</code> with clear terms:
                approximately 50% win rate
              </li>
            </ul>

            <p>
              <strong>Enable 3D Secure.</strong> This shifts fraud liability from
              you to the card issuer. Disputes on 3D Secure transactions
              don&apos;t count toward your ratio in most cases.
            </p>

            <p>
              <strong>Monitor refund velocity.</strong> A sudden spike in refunds
              can signal problems to Stripe&apos;s underwriting algorithms, even
              if your dispute ratio is fine.
            </p>

            <p>
              <strong>Consider proactive refunds.</strong> If you see an early
              fraud warning (TC40) for a charge, refunding it before the
              customer files a formal dispute keeps it out of your dispute
              count. The refund costs you the transaction amount, but it
              protects your ratio.
            </p>

            <hr />

            <h2>Tools for Monitoring</h2>

            <p>
              <strong>Manual:</strong> Check your Stripe Dashboard disputes
              weekly and do the math yourself. Free but easy to forget.
            </p>

            <p>
              <strong>
                <a
                  href="https://marketplace.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22c55e] underline hover:text-[#16a34a]"
                >
                  ShieldScore
                </a>{" "}
                (free Stripe App):
              </strong>{" "}
              Runs inside your Stripe Dashboard and calculates your ratios
              automatically. Shows a health score from 0 to 100, tracks trends
              over 7 days, estimates days until each threshold, and sends email
              alerts when ratios cross warning levels. Also detects hidden
              account restrictions. Free on the Stripe App Marketplace.
            </p>

            <p>
              <strong>Chargeflow / Chargeback.io:</strong> Focus on fighting
              disputes after they happen, not monitoring ratios. Complementary
              to ShieldScore, not a replacement.
            </p>

            <hr />

            <h2>Key Numbers to Remember</h2>

            <div className="article-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Threshold</th>
                    <th>Ratio</th>
                    <th>What Happens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Mastercard CMM</td>
                    <td>1.0% + 100 disputes</td>
                    <td>Formal warning, no fines</td>
                  </tr>
                  <tr>
                    <td>Visa VAMP</td>
                    <td>1.5% combined</td>
                    <td>Immediate penalties</td>
                  </tr>
                  <tr>
                    <td>Mastercard ECM</td>
                    <td>1.5% + 100 disputes x 2 months</td>
                    <td>
                      $25,000+/month fines, possible MATCH listing
                    </td>
                  </tr>
                  <tr>
                    <td>Visa Enumeration</td>
                    <td>20% decline rate</td>
                    <td>Card testing penalties</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>Safe zone:</strong> Keep your dispute ratio below 0.5%.
              Monitor weekly. Act immediately if you see it climbing.
            </p>

            <p>
              <strong>Warning zone:</strong> 0.5% to 1.0%. Investigate the
              source of disputes. Review your fulfillment, billing descriptors,
              and refund policy.
            </p>

            <p>
              <strong>Danger zone:</strong> Above 1.0%. Take immediate
              corrective action. Every dispute at this level moves you closer to
              fines and account restrictions.
            </p>

            <hr />

            <p className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6 text-[15px] leading-[1.7] text-[#555]">
              <strong className="text-[#111]">ShieldScore</strong> is a free
              Stripe App that monitors your dispute ratios against these
              thresholds in real time.{" "}
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
