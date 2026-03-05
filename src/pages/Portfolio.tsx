import WorkSection from '../components/sections/WorkSection';
import { Helmet } from 'react-helmet-async';

const Portfolio = () => {
  return (
    <div className="pt-24">
      <Helmet>
        <title>Our Work | Rajugari Ventures</title>
        <meta name="description" content="View our portfolio of successful digital projects and case studies." />
      </Helmet>
      <WorkSection />
    </div>
  );
};

export default Portfolio;
