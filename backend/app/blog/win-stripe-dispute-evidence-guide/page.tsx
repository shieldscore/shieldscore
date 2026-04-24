import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title:
    "How to Win a Stripe Dispute: Evidence Guide by Reason Code | ShieldScore",
  description:
    "The right evidence for each dispute type. Estimated win rates included.",
  openGraph: {
    title: "How to Win a Stripe Dispute: Evidence Guide by Reason Code",
    description:
      "The right evidence for each dispute type. Estimated win rates included.",
    type: "article",
  },
};

export default function WinStripeDisputeGuide() {
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
              How to Win a Stripe Dispute: Evidence Guide by Reason Code
            </h1>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#666]">
              The right evidence for each dispute type. Estimated win rates
              included.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#999]">
              <span>April 13, 2026</span>
              <span className="text-[#ddd]">&middot;</span>
              <span>10 min read</span>
            </div>
          </header>

          {/* Body */}
          <div className="text-[16px] leading-[1.7] text-[#333]">
            <hr />

            <p>
              Not all disputes are created equal. Each one comes with a reason
              code that tells you why the cardholder&apos;s bank initiated the
              chargeback. The evidence you submit should match the reason code
              exactly. Submitting generic evidence wastes your time and loses
              cases you could have won.
            </p>
            <p>
              Here&apos;s what to submit for each reason code, and your
              realistic chances of winning.
            </p>

            <hr />

            <h2>
              <code>fraudulent</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~20%
              </span>
            </h2>

            <p>
              The cardholder claims they didn&apos;t authorize the transaction.
              This is the most common reason code and the hardest to win.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>AVS (Address Verification System) match confirmation</li>
              <li>CVV verification result</li>
              <li>IP address of the purchaser and geolocation data</li>
              <li>Device fingerprint or browser information</li>
              <li>3D Secure authentication record (if used)</li>
              <li>
                Customer&apos;s purchase history on your platform (repeat buyer
                = stronger case)
              </li>
              <li>
                Any communication with the customer before or after purchase
              </li>
            </ul>

            <p>
              <strong>Why the win rate is low:</strong> Card-issuing banks
              heavily favor the cardholder in fraud disputes. Without 3D Secure
              authentication, the liability sits with you. If you do have 3D
              Secure, submit that evidence first because it shifts liability to
              the issuer.
            </p>
            <p>
              <strong>Prevention tip:</strong> Enable 3D Secure for all
              transactions above your average order value. The small conversion
              hit is worth the fraud liability protection.
            </p>

            <hr />

            <h2>
              <code>product_not_received</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~70% with tracking
              </span>
            </h2>

            <p>
              The cardholder says they never got the product. This is one of the
              most winnable dispute types if you have shipping proof.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>Shipping carrier name and tracking number</li>
              <li>Delivery confirmation showing the delivery date</li>
              <li>Signed proof of delivery (if available)</li>
              <li>
                The shipping address used (must match the billing address or the
                address the customer provided)
              </li>
              <li>
                Estimated delivery date communicated to the customer at checkout
              </li>
            </ul>

            <p>
              <strong>Without tracking:</strong> Your win rate drops to about
              20%. If you can&apos;t prove delivery, the bank sides with the
              cardholder.
            </p>
            <p>
              <strong>Prevention tip:</strong> Always use tracked shipping. For
              high-value orders, require signature confirmation. Keep shipping
              confirmation emails as evidence.
            </p>

            <hr />

            <h2>
              <code>duplicate</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~60%
              </span>
            </h2>

            <p>
              The cardholder says they were charged twice for the same thing.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>
                Proof that the charges are for separate transactions (different
                order IDs, different dates, different products)
              </li>
              <li>Itemized receipts for each charge</li>
              <li>
                If the charges are genuinely different, show the distinct product
                descriptions and delivery dates
              </li>
              <li>
                If one charge was a refund that hasn&apos;t processed yet, show
                the refund receipt and expected processing date
              </li>
            </ul>

            <p>
              <strong>Common cause:</strong> Subscription billing that overlaps
              with a one-time purchase. The customer sees two charges from the
              same merchant and assumes it&apos;s a duplicate.
            </p>
            <p>
              <strong>Prevention tip:</strong> Use clear billing descriptors that
              differentiate between subscription charges and one-time purchases.
              Include the product name or order number in the descriptor.
            </p>

            <hr />

            <h2>
              <code>subscription_canceled</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~50%
              </span>
            </h2>

            <p>
              The cardholder says they canceled their subscription but were still
              charged.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>Your cancellation policy (as shown during signup)</li>
              <li>
                Evidence the customer agreed to your terms (checkbox,
                click-through agreement)
              </li>
              <li>
                Proof that the cancellation request was received after the charge
                date
              </li>
              <li>
                Record of when the customer actually requested cancellation
              </li>
              <li>
                Communication history showing the cancellation policy was
                explained
              </li>
            </ul>

            <p>
              <strong>Common cause:</strong> Customer cancels mid-billing cycle
              and expects an immediate refund. Your policy charges through the
              end of the period.
            </p>
            <p>
              <strong>Prevention tip:</strong> Send a cancellation confirmation
              email that clearly states the end date of their access. Make
              cancellation easy. A customer who can&apos;t find the cancel
              button files a dispute instead.
            </p>

            <hr />

            <h2>
              <code>product_unacceptable</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~40%
              </span>
            </h2>

            <p>
              The cardholder received the product but says it doesn&apos;t match
              what was advertised.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>
                Product description as shown on your website at the time of
                purchase
              </li>
              <li>Photos of the actual product shipped</li>
              <li>Proof of delivery matching the description</li>
              <li>
                Any customer communication about the issue (did they contact you
                before disputing?)
              </li>
              <li>Your return/refund policy</li>
              <li>
                Evidence that you offered a resolution (replacement, partial
                refund)
              </li>
            </ul>

            <p>
              <strong>Key argument:</strong> If the customer never contacted you
              before filing the dispute, point that out. Banks look more
              favorably on merchants who offered to resolve the issue.
            </p>
            <p>
              <strong>Prevention tip:</strong> Accurate product descriptions and
              photos. Respond to customer complaints within 24 hours. Offer easy
              returns. Customers who feel heard don&apos;t file disputes.
            </p>

            <hr />

            <h2>
              <code>credit_not_processed</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~55%
              </span>
            </h2>

            <p>
              The cardholder says they returned the product or canceled the
              service but never received their refund.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>Your refund policy</li>
              <li>
                Evidence that the refund was already issued (show the refund
                receipt and date)
              </li>
              <li>
                If the refund is still processing, show the expected timeline
              </li>
              <li>
                If the return was outside your policy window, provide your policy
                and the dates
              </li>
            </ul>

            <p>
              <strong>Common cause:</strong> Refunds can take 5-10 business days
              to appear on the cardholder&apos;s statement. The customer files a
              dispute before the refund posts.
            </p>
            <p>
              <strong>Prevention tip:</strong> When you issue a refund, email the
              customer with the refund amount, date, and expected processing
              time. This reduces disputes from impatient customers.
            </p>

            <hr />

            <h2>
              <code>unrecognized</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~35%
              </span>
            </h2>

            <p>
              The cardholder doesn&apos;t recognize the charge on their
              statement.
            </p>

            <h3>Evidence to submit:</h3>
            <ul>
              <li>
                Transaction receipt showing your business name and the product
                purchased
              </li>
              <li>
                Explanation of your billing descriptor (the name that appears on
                statements)
              </li>
              <li>Customer communication confirming the purchase</li>
              <li>Delivery confirmation</li>
            </ul>

            <p>
              <strong>Common cause:</strong> Your billing descriptor doesn&apos;t
              match your brand name. If your company is &ldquo;Acme LLC&rdquo;
              but your website is &ldquo;CoolGadgets.com&rdquo;, the customer
              sees &ldquo;ACME LLC&rdquo; on their statement and doesn&apos;t
              recognize it.
            </p>
            <p>
              <strong>Prevention tip:</strong> Set your Stripe billing descriptor
              to match the name customers know you by. Check it in Stripe
              Dashboard &gt; Settings &gt; Public details &gt; Statement
              descriptor.
            </p>

            <hr />

            <h2>
              <code>general</code>{" "}
              <span className="text-[15px] font-normal text-[#999]">
                Estimated win rate: ~30%
              </span>
            </h2>

            <p>
              A catch-all code when the specific reason doesn&apos;t fit other
              categories.
            </p>

            <p>
              <strong>Submit everything you have:</strong>
            </p>
            <ul>
              <li>Transaction receipt</li>
              <li>Delivery proof</li>
              <li>Customer communication</li>
              <li>Product description</li>
              <li>Terms of service</li>
              <li>Refund policy</li>
              <li>Any 3D Secure or AVS verification data</li>
            </ul>

            <p>
              <strong>Prevention tip:</strong> Since the reason is vague, strong
              documentation across the board is your best defense.
            </p>

            <hr />

            <h2>General tips for all dispute types</h2>

            <p>
              <strong>Respond quickly.</strong> You typically have 7-21 days to
              submit evidence. Don&apos;t wait until the last day.
            </p>
            <p>
              <strong>Be factual, not emotional.</strong> Banks review hundreds
              of disputes daily. Clear evidence wins. Lengthy explanations about
              how unfair the dispute is don&apos;t help.
            </p>
            <p>
              <strong>Include screenshots.</strong> Show your checkout page,
              terms of service, shipping confirmation emails, and customer
              communication as screenshots. Visual evidence is easier for
              reviewers to process.
            </p>
            <p>
              <strong>Keep records proactively.</strong> By the time you get a
              dispute, it&apos;s too late to create evidence. Log everything from
              day one: customer emails, delivery confirmations, signed
              agreements.
            </p>
            <p>
              <strong>Know when to accept the loss.</strong> If the dispute is
              under $20 and you have weak evidence, accepting the dispute is
              cheaper than spending an hour compiling evidence you&apos;ll
              probably lose anyway. Focus your time on the disputes you can win.
            </p>

            <hr />

            <p className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6 text-[15px] leading-[1.7] text-[#555]">
              <strong className="text-[#111]">ShieldScore</strong> shows you
              each dispute&apos;s reason code, estimated win rate, and the
              specific evidence fields to fill in Stripe. Free on the{" "}
              <a
                href="https://marketplace.stripe.com/apps/shieldscore"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#22c55e] underline hover:text-[#16a34a]"
              >
                Stripe App Marketplace
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
