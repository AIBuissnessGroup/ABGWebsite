import Team from "../../components/Team";
import Footer from "../../components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team - AI Business Group | University of Michigan",
  description: "Meet the innovators, builders, and visionaries driving ABG's mission to shape the future of AI in business at the University of Michigan.",
};

export default function TeamPage() {
  return (
    <main className="bg-[#00274c] text-white font-bold">
      <Team />
      <Footer />
    </main>
  );
} 