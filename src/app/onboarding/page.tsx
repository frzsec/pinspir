import OnboardingCarousel from "@/components/onboarding/onboarding-carousel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Selamat Datang di Finspire | Petualangan Finansial Bersama Foxy",
  description: "Bantu Foxy kelola uang lewat cerita seru dan hal unik di dunia keuangan.",
};

export default function OnboardingPage() {
  return <OnboardingCarousel />;
}
