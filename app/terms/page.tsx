import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Terms & Conditions | Cycling Fuel Planner',
  description: 'Terms and conditions for using Cycling Fuel Planner.',
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-blue-200">Last updated: January 28, 2025</p>
        </div>

        <div className="bg-white/10 rounded-xl p-8 backdrop-blur-sm space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <div className="text-gray-200 space-y-3">
              <p>By accessing and using Cycling Fuel Planner ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <div className="text-gray-200 space-y-3">
              <p>Cycling Fuel Planner is a web-based application that provides personalized nutrition and hydration recommendations for cycling activities. The Service includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personalized nutrition planning based on user profiles</li>
                <li>Real-time fuel timing recommendations</li>
                <li>Weather-based hydration adjustments</li>
                <li>GPX route analysis and nutrition planning</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Medical Disclaimer</h2>
            <div className="text-gray-200 space-y-3 bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
              <p><strong>IMPORTANT:</strong> The information provided by this Service is for educational and informational purposes only and is not intended as medical advice. You should consult with a healthcare professional before starting any nutrition or exercise program.</p>
              <p>The recommendations provided are general guidelines and may not be suitable for everyone. Individual nutritional needs vary based on many factors including health conditions, medications, and individual metabolism.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
            <div className="text-gray-200 space-y-3">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate information when creating your nutrition profile</li>
                <li>Use the Service responsibly and in accordance with these terms</li>
                <li>Not attempt to reverse engineer or exploit the Service</li>
                <li>Respect the intellectual property rights of the Service</li>
                <li>Take personal responsibility for your health and nutrition decisions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <div className="text-gray-200 space-y-3">
              <p>To the fullest extent permitted by law:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Service is provided "as is" without warranties of any kind</li>
                <li>We shall not be liable for any direct, indirect, incidental, or consequential damages</li>
                <li>You use the Service at your own risk</li>
                <li>We do not guarantee the accuracy or completeness of nutrition recommendations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <div className="text-gray-200 space-y-3">
              <p>The Service and its original content, features, and functionality are owned by Cycling Fuel Planner and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
            <div className="text-gray-200 space-y-3">
              <p>Your privacy is important to us. Please review our <Link href="/privacy" className="text-blue-300 hover:text-blue-200 underline">Privacy Policy</Link>, which also governs your use of the Service.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <div className="text-gray-200 space-y-3">
              <p>The Service may contain links to third-party websites or services. We are not responsible for the content or practices of these third-party services.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <div className="text-gray-200 space-y-3">
              <p>We may terminate or suspend your access to the Service immediately, without prior notice, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
            <div className="text-gray-200 space-y-3">
              <p>These Terms shall be interpreted and governed by the laws of the United States, without regard to conflict of law provisions.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <div className="text-gray-200 space-y-3">
              <p>We reserve the right to update these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <div className="text-gray-200 space-y-3">
              <p>If you have any questions about these Terms, please contact us through our website.</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}