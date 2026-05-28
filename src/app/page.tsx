import { Hero } from "@/components/Hero";

// The landing page currently shows the vision (Hero). Once the front page is
// assembled dynamically from radar + published articles, this is where that
// composition will live. The chronological list of published rewrites lives
// at /artikel.
export default function LandingPage() {
  return <Hero />;
}
