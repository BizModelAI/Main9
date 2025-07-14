import { Link, useNavigate } from "react-router-dom";
import BizModelAILogo from "./BizModelAILogo";
import {
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaPinterest,
} from "react-icons/fa6";

function Footer() {
  const navigate = useNavigate();

  const handleContactUsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/contact");
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handlePrivacyPolicyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/privacy");
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <BizModelAILogo
                size="md"
                showText={true}
                className="text-white"
              />
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Your AI-powered business model discovery platform. Find the
              perfect business model tailored to your unique goals, skills, and
              lifestyle with intelligent analysis.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/explore"
                  className="hover:text-white transition-colors"
                >
                  Business Explorer
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="hover:text-white transition-colors">
                  Take Quiz
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="/contact"
                  onClick={handleContactUsClick}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={handlePrivacyPolicyClick}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-center sm:text-left">
              &copy; 2025 BizModelAI. All rights reserved.
            </p>

            {/* Social Media Links */}
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a
                href="https://www.instagram.com/bizmodelai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://www.tiktok.com/@bizmodelai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on TikTok"
              >
                <FaTiktok size={24} />
              </a>
              <a
                href="https://x.com/bizmodelai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on X (Twitter)"
              >
                <FaXTwitter size={24} />
              </a>
              <a
                href="https://www.pinterest.com/bizmodelai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Pinterest"
              >
                <FaPinterest size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
