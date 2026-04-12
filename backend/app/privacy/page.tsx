import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | ShieldScore",
  description:
    "How ShieldScore handles your data. Read-only Stripe access, no cardholder data, no data sales.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mb-14 text-[14px] text-[#999999]">
            Last updated: April 12, 2026
          </p>

          <div className="flex flex-col gap-12 text-[16px] leading-[1.7] text-[#333]">
            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                What we collect
              </h2>
              <p>When you install ShieldScore:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Your Stripe account ID and email address</li>
                <li>
                  Aggregated transaction metrics: dispute counts, charge counts,
                  fraud warning counts, decline counts
                </li>
                <li>Account restriction status and capability changes</li>
                <li>Alert preferences you configure</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                What we do not collect
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Individual transaction details or customer information
                </li>
                <li>
                  Cardholder data (card numbers, CVVs, names, billing addresses)
                </li>
                <li>Bank account or routing numbers</li>
                <li>Personal browsing data or device fingerprints</li>
                <li>IP addresses of your customers</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                How we use your data
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Calculate your dispute ratio, fraud ratio, and health score
                </li>
                <li>
                  Send alert emails when thresholds are approached or
                  restrictions are detected
                </li>
                <li>Store daily metric snapshots for trend analysis</li>
                <li>
                  Improve the accuracy of our monitoring algorithms
                </li>
              </ul>
              <p className="mt-4">
                We do not sell, rent, or share your data with third parties. We
                do not use your data for advertising.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Data storage and security
              </h2>
              <p>
                Your data is stored in encrypted PostgreSQL databases on Supabase
                infrastructure (AWS). Access is restricted to authenticated
                backend services using row-level security policies. API keys and
                credentials are stored as encrypted environment variables and
                never committed to source code.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Data retention
              </h2>
              <p>
                We retain your metric history for as long as your account is
                active. If you uninstall ShieldScore, we delete your data within
                30 days. You can request immediate deletion by emailing{" "}
                <a
                  href="mailto:hello@shieldscore.io"
                  className="text-[#635bff] no-underline hover:underline"
                >
                  hello@shieldscore.io
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Third-party services
              </h2>
              <p>ShieldScore uses:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Stripe (payment processing and data source)</li>
                <li>Supabase (database hosting)</li>
                <li>Vercel (application hosting)</li>
                <li>Resend (email delivery)</li>
              </ul>
              <p className="mt-4">
                Each service has its own privacy policy. We only share the
                minimum data required for each service to function.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Cookies
              </h2>
              <p>
                The ShieldScore landing page does not use tracking cookies or
                analytics. The Stripe App runs inside the Stripe Dashboard and
                does not set cookies independently.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Your rights
              </h2>
              <p>
                You can request a copy of your data or request deletion at any
                time by emailing{" "}
                <a
                  href="mailto:hello@shieldscore.io"
                  className="text-[#635bff] no-underline hover:underline"
                >
                  hello@shieldscore.io
                </a>
                . We will respond within 14 days.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Changes
              </h2>
              <p>
                We may update this policy. Changes will be posted on this page
                with an updated date.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-[20px] font-bold text-[#111111]">
                Contact
              </h2>
              <p>
                Privacy questions:{" "}
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
