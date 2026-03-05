import ServicesSection from '../components/sections/ServicesSection';
import { Helmet } from 'react-helmet-async';

const Services = () => {
  return (
    <div className="pt-24">
      <Helmet>
        <title>Our Services | Rajugari Ventures</title>
        <meta name="description" content="Explore our comprehensive digital services including SEO, Web Development, and AI Solutions." />
      </Helmet>
      <ServicesSection />
    </div>
  );
};

export default Services;
