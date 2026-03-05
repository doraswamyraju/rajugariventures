import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CustomCursor from '../ui/CustomCursor';
import Chatbot from '../Chatbot';

const Layout = () => {
  return (
    <div className="min-h-screen relative bg-brand-black text-white selection:bg-brand-orange selection:text-black">
      <div className="noise-bg" />
      <CustomCursor />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default Layout;
