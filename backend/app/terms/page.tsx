import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | ShieldScore",
  description:
    "Terms of service for ShieldScore, the Stripe account health monitoring app.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#111111] font-[family-name:var(--font-jakarta)]">
      <Nav />

      <article className="px-6 pt-[140px] pb-24">
        <div className="mx-auto max-w-[720px]">
          <a
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#999] no-underline hover:text-[#111] transition-colors"
          >
            &larr; Back to home
          </a>

          <h1 className="mb-2 text-[32px] font-bold tracking-[-0.025em] md:text-[38px]">
            Terms of Service
          </h1>
          <p className="mb-14 text-[14px] text-[#999999]">
            Last updated: April 12, 2026
          </p>

          <div className="flex flex-col gap-12 text-[16px] leading-[1.7] text-[#333]">
            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Agreement
              </h2>
              <p>
                By installing ShieldScore from the Stripe App Marketplace, you
                agree to these terms. If you do not agree, uninstall the app.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                The service
              </h2>
              <p>
                ShieldScore is a Stripe App that monitors account health metrics
                including dispute ratios, fraud warning ratios, decline rates,
                and account restriction status. We calculate these metrics
                against published card network thresholds (Visa VAMP 1.5%,
                Mastercard CMM 1.0%, Mastercard ECM 1.5%) and provide a
                composite health score from 0 to 100.
              </p>
              <p className="mt-4">
                ShieldScore is an informational monitoring tool. We do not
                provide legal, financial, or compliance advice.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Data access
              </h2>
              <p>
                ShieldScore connects to your Stripe account through read-only
                OAuth. We request access to:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  Account data (read only): capabilities and restriction status
                </li>
                <li>
                  Charge data (read only): transaction counts for ratio
                  calculations
                </li>
                <li>
                  Dispute data (read only): dispute counts for threshold
                  monitoring
                </li>
                <li>
                  Early fraud warning data (read only): TC40 reports for Visa
                  VAMP calculation
                </li>
              </ul>
              <p className="mt-4">
                We cannot move funds, create charges, issue refunds, modify
                subscriptions, or access raw cardholder data (card numbers,
                CVVs). Our OAuth scopes are strictly read-only.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Data storage
              </h2>
              <p>
                We store aggregated counts (total disputes, total charges,
                calculated ratios) and your health score history. We do not store
                individual transaction details, customer information, or
                cardholder data. Data is stored in encrypted PostgreSQL databases
                hosted on Supabase infrastructure.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Billing
              </h2>
              <p>
                ShieldScore is billed monthly at the rate displayed at the time
                of installation. Your subscription renews automatically. You can
                cancel at any time from the Stripe App Marketplace. Cancellation
                takes effect at the end of your current billing period. No
                refunds for partial months.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Alerts and notifications
              </h2>
              <p>
                ShieldScore sends email alerts when your metrics cross warning
                thresholds or when account restrictions are detected. Alert
                delivery depends on email provider availability and Stripe API
                uptime. We do not guarantee delivery of every alert.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Limitations and disclaimer
              </h2>
              <p>
                ShieldScore monitors data available through Stripe&apos;s public
                API. We do not have access to:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  Stripe&apos;s internal underwriting algorithms or risk models
                </li>
                <li>
                  Stripe&apos;s manual review processes or decisions
                </li>
                <li>Card network enforcement actions before they occur</li>
                <li>
                  Signals outside of the Stripe API (bank reports, external fraud
                  databases)
                </li>
              </ul>
              <p className="mt-4">
                Stripe may take action on your account based on internal criteria
                that ShieldScore cannot detect or predict. Our threshold
                calculations are based on published card network documentation
                and may not match the exact criteria Stripe uses internally.
              </p>
              <p className="mt-4">
                ShieldScore reduces your risk of being surprised by an account
                action. It does not guarantee prevention of account freezes, fund
                holds, or card network penalties.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Limitation of liability
              </h2>
              <p>
                ShieldScore is provided &quot;as is&quot; without warranties of
                any kind, express or implied. We are not liable for any account
                freezes, fund holds, fines, penalties, or lost revenue, whether
                or not our service detected the underlying issue. Our total
                liability is limited to the amount you paid for ShieldScore in
                the 12 months preceding any claim.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Changes
              </h2>
              <p>
                We may update these terms. Significant changes will be
                communicated by email at least 14 days before they take effect.
                Continued use after changes take effect constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Contact
              </h2>
              <p>
                Questions about these terms:{" "}
                <a
                  href="mailto:hello@shieldscore.io"
                  className="text-[#635bff] no-underline hover:underline"
                >
                  hello@shieldscore.io
                </a>
              </p>
            </section>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
