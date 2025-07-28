import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Privacy Policy | Cycling Fuel Planner',
  description: 'Privacy policy for Cycling Fuel Planner - how we collect, use, and protect your data.',
};

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-blue-200">Last updated: January 28, 2025</p>
        </div>

        <div className="bg-white/10 rounded-xl p-8 backdrop-blur-sm space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-200">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact information</li>
                <li>Physical characteristics (weight, fitness level)</li>
                <li>Cycling preferences and nutrition profile</li>
                <li>Location data (zip code for weather information)</li>
              </ul>

              <h3 className="text-lg font-medium mt-6">Usage Information</h3>
              <p>We automatically collect certain information about how you use our service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information and IP address</li>
                <li>Usage patterns and interactions with the app</li>
                <li>Performance data and error logs</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <div className="text-gray-200 space-y-3">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide personalized cycling nutrition recommendations</li>
                <li>Improve and optimize our service</li>
                <li>Communicate with you about updates and features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Security</h2>
            <div className="text-gray-200 space-y-3">
              <p>Your nutrition profile and preferences are stored locally on your device using browser localStorage. We implement appropriate security measures including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data encryption in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure third-party integrations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <div className="text-gray-200 space-y-3">
              <p>We use third-party services to enhance our application:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>OpenWeather API:</strong> To provide weather data for your location</li>
                <li><strong>Google Analytics:</strong> To analyze usage patterns and improve our service</li>
                <li><strong>Vercel:</strong> For hosting and content delivery</li>
              </ul>
              <p>These services have their own privacy policies governing the use of your information.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <div className="text-gray-200 space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your data from our systems</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your data</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Children&apos;s Privacy</h2>
            <div className="text-gray-200 space-y-3">
              <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
            <div className="text-gray-200 space-y-3">
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <div className="text-gray-200 space-y-3">
              <p>If you have any questions about this privacy policy or our practices, please contact us through our website.</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}