import BecomeProviderBanner from "@/components/landing/BecomeProviderBanner";
import Categories from "@/components/landing/Categories";
import Hero from "@/components/landing/Hero";
import HowToOrder from "@/components/landing/HowToOrder";
import StoreGuarantees from "@/components/landing/StoreGuarantees";

export default function Home() {
  return (
    <main>
      <Hero />
      <HowToOrder />
      <Categories />
      <BecomeProviderBanner />
      <StoreGuarantees />
    </main>
  );
}
