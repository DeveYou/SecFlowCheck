import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductShowcase } from "@/components/ProductShowCase";

export default function Home() {
  return (
    <>
        <Header/>
        <Hero/>
        <ProductShowcase/>
        <Footer/>
      </>
  );
}
