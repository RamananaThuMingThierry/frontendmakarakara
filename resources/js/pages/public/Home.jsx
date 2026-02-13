import ContactSection from "../../Components/website/ContactSection";
import Features from "../../Components/website/Features";
import HappyClients from "../../Components/website/HappyClients";
import HeroCarousel from "../../Components/website/HeroCarousel";
import ProductsSection from "../../Components/website/ProductsSection";
import TestimonialSection from "../../Components/website/TestimonialSection";

export default function Home() {
  return <>
    <HeroCarousel/>
    <Features/>
    <ProductsSection/>
    <HappyClients/>
    <TestimonialSection/>
    <ContactSection/>
  </>;
}
