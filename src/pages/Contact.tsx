import ContactSection from '../components/sections/ContactSection';
import { Helmet } from 'react-helmet-async';

const Contact = () => {
  return (
    <div className="pt-24">
      <Helmet>
        <title>Contact Us | Rajugari Ventures</title>
        <meta name="description" content="Get in touch with us to start your digital transformation journey." />
      </Helmet>
      <ContactSection />
    </div>
  );
};

export default Contact;
