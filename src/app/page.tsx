import { Banner } from "@/components/Banner";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Principles } from "@/components/Principles";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Banner />
      <Principles />
      <HowItWorks />
    </>
  );
}
