import type { Metadata } from "next";
import BlogContent from "./BlogContent";

export const metadata: Metadata = {
  title: "Blog | ShieldScore",
  description:
    "Guides and insights on Stripe account health, dispute monitoring, and card network compliance for merchants.",
};

export default function BlogPage() {
  return <BlogContent />;
}
