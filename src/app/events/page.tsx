import EventsListDesign from "../../components/EventsListDesign";
import Footer from "../../components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events - AI Business Group | University of Michigan",
  description: "Join ABG's immersive events and experiences that shape the future of AI in business. Workshops, panels, and networking opportunities for innovators.",
};

export default function EventsPage() {
  return (
    <main className="bg-[#00274c] text-white font-bold">
      <EventsListDesign />
      <Footer />
    </main>
  );
} 