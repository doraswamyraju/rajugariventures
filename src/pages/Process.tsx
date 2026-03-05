import ProcessSection from '../components/sections/ProcessSection';
import { Helmet } from 'react-helmet-async';

const Process = () => {
  return (
    <div className="pt-24">
      <Helmet>
        <title>Our Process | Rajugari Ventures</title>
        <meta name="description" content="Learn about our data-driven methodology for digital success." />
      </Helmet>
      <ProcessSection />
    </div>
  );
};

export default Process;
