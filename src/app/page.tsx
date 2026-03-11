import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Moods from "@/components/landing/Moods";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="relative">
      <div className="aurora-bg" />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Moods />
      <CTA />
      <Footer />
    </main>
  );
}
