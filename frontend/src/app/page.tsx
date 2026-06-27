import Backdrop from "@/components/landing/Backdrop";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Roles from "@/components/landing/Roles";
import Features from "@/components/landing/Features";
import UnderTheHood from "@/components/landing/UnderTheHood";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="font-body relative min-h-screen overflow-x-clip text-white antialiased">
      <Backdrop />
      <div className="relative z-10">
        <Nav />
        <Hero />
        <Roles />
        <Features />
        <UnderTheHood />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
