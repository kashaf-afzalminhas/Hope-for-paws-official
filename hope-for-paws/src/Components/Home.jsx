import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import WhatWeOffer from './WhatWeOffer';
import Support from './Support';
import ContactUs from '../Main/ContactUs';
import TeamSupport from './TeamSuppport';

function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <WhatWeOffer />
      <Support />
      <TeamSupport/>
      <ContactUs />
      {/* <Footer /> */}
    </>
  );
}

export default Home;
