'use client';

import Link from 'next/link';
import { FaShieldAlt, FaLock, FaUserShield, FaEye, FaFileAlt, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg blur-sm group-hover:blur-md transition-all"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  YottaScore
                </h1>
                <p className="text-xs text-gray-600 font-semibold">Privacy Policy</p>
              </div>
            </Link>
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
            >
              <FaArrowLeft className="text-sm" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-6 shadow-xl">
            <FaShieldAlt className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-blue-100">
          <div className="flex items-start gap-4 mb-4">
            <FaFileAlt className="text-blue-600 text-2xl mt-1" />
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-3">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to YottaScore! We are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational 
                platform, including our website, mobile applications, and services.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                By using YottaScore, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our services.
              </p>
            </div>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-purple-100">
          <div className="flex items-start gap-4 mb-4">
            <FaUserShield className="text-purple-600 text-2xl mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-800 mb-4">Information We Collect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">1. Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Name, email address, phone number, and date of birth</li>
                    <li>Educational background and exam preferences</li>
                    <li>Profile picture and username</li>
                    <li>Payment and wallet information (processed securely through third-party payment gateways)</li>
                    <li>KYC documents (for wallet withdrawals, as required by law)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">2. Usage Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Exam performance data, scores, and analytics</li>
                    <li>Practice test results and progress tracking</li>
                    <li>Battle quiz participation and winnings</li>
                    <li>Study timetable and learning patterns</li>
                    <li>Social feed interactions, posts, and stories</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">3. Technical Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Device information (type, model, operating system)</li>
                    <li>IP address and location data</li>
                    <li>Browser type and version</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>App usage statistics and crash reports</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-green-100">
          <div className="flex items-start gap-4 mb-4">
            <FaEye className="text-green-600 text-2xl mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-800 mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
                <li>To provide and maintain our educational services and exam platform</li>
                <li>To process payments, manage your wallet, and distribute winnings</li>
                <li>To personalize your learning experience and recommend relevant content</li>
                <li>To send you exam notifications, updates, and important announcements</li>
                <li>To analyze your performance and provide detailed analytics</li>
                <li>To facilitate social features like feed, stories, and messaging</li>
                <li>To detect and prevent fraud, abuse, and security threats</li>
                <li>To comply with legal obligations and enforce our terms of service</li>
                <li>To improve our services through data analysis and research</li>
                <li>To send you promotional offers (with your consent)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-red-100">
          <div className="flex items-start gap-4 mb-4">
            <FaLock className="text-red-600 text-2xl mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-800 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Encryption:</strong> All sensitive data is encrypted in transit and at rest using SSL/TLS protocols</li>
                <li><strong>Secure Payment Processing:</strong> Payment information is handled by certified third-party payment gateways (Razorpay, etc.)</li>
                <li><strong>Access Controls:</strong> Limited access to personal data on a need-to-know basis</li>
                <li><strong>Regular Security Audits:</strong> We conduct regular security assessments and updates</li>
                <li><strong>Firewall Protection:</strong> Advanced firewall and intrusion detection systems</li>
                <li><strong>Data Backup:</strong> Regular backups to prevent data loss</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. 
                While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-yellow-100">
          <h2 className="text-2xl font-black text-gray-800 mb-4">Data Sharing and Disclosure</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform (payment processors, cloud hosting, analytics)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            <li><strong>Public Information:</strong> Your public profile, exam rankings, and social feed posts may be visible to other users</li>
          </ul>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-indigo-100">
          <h2 className="text-2xl font-black text-gray-800 mb-4">Your Privacy Rights</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            You have the following rights regarding your personal information:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <FaCheckCircle className="text-blue-600 text-xl mt-1" />
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Access</h3>
                <p className="text-sm text-gray-700">View and download your personal data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
              <FaCheckCircle className="text-purple-600 text-xl mt-1" />
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Correction</h3>
                <p className="text-sm text-gray-700">Update or correct inaccurate information</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
              <FaCheckCircle className="text-green-600 text-xl mt-1" />
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Deletion</h3>
                <p className="text-sm text-gray-700">Request deletion of your account and data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
              <FaCheckCircle className="text-orange-600 text-xl mt-1" />
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Opt-Out</h3>
                <p className="text-sm text-gray-700">Unsubscribe from marketing communications</p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed mt-6">
            To exercise these rights, please contact us at <a href="mailto:privacy@yottascore.com" className="text-blue-600 font-semibold hover:underline">privacy@yottascore.com</a> or through our support system.
          </p>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-pink-100">
          <h2 className="text-2xl font-black text-gray-800 mb-4">Cookies and Tracking Technologies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use cookies and similar tracking technologies to enhance your experience:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Essential Cookies:</strong> Required for the platform to function properly</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            You can control cookies through your browser settings. However, disabling certain cookies may affect platform functionality.
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-cyan-100">
          <h2 className="text-2xl font-black text-gray-800 mb-4">Children's Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            YottaScore is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. 
            If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. 
            We will take steps to delete such information from our systems.
          </p>
        </div>

        {/* Third-Party Links */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-teal-100">
          <h2 className="text-2xl font-black text-gray-800 mb-4">Third-Party Links</h2>
          <p className="text-gray-700 leading-relaxed">
            Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. 
            We encourage you to review the privacy policies of any third-party sites you visit.
          </p>
        </div>

        {/* Changes to Privacy Policy */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-amber-100">
          <h2 className="text-2xl font-black text-gray-800 mb-4">Changes to This Privacy Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page 
            and updating the "Last Updated" date. You are advised to review this policy periodically for any changes. 
            Continued use of our services after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-xl text-white">
          <h2 className="text-2xl font-black mb-4">Contact Us</h2>
          <p className="mb-4 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="space-y-2">
            <p><strong>Email:</strong> <a href="mailto:privacy@yottascore.com" className="underline hover:text-yellow-300">privacy@yottascore.com</a></p>
            <p><strong>Support:</strong> <a href="/student/support" className="underline hover:text-yellow-300">Visit Support Center</a></p>
            <p><strong>Address:</strong> YottaScore, India</p>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <FaArrowLeft />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">
            &copy; {new Date().getFullYear()} YottaScore. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/student/support" className="text-gray-400 hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}














