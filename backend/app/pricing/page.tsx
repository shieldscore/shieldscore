import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing | ShieldScore",
  description:
    "Free Stripe account health monitoring. Upgrade to Pro at $29/mo or Defend at $59/mo for alerts, trends, and remediation.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Nav />
      <PricingContent />
      <Footer />
    </div>
  );
}
