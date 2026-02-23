import Hero from "../components/Hero";
import About from "../components/About";
import Join from "../components/Join";
import Footer from "../components/Footer";
import SXSWPromotion from "../components/SXSWPromotion";

export default function Home() {
  return (
    <main className="bg-[#00274c] text-white font-bold">
      <Hero />
      <SXSWPromotion />
      <About />
      <Join />
      <Footer />
    </main>
  );
}

