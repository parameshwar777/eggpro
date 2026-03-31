import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-scroll bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-card px-4 py-3 flex items-center gap-3 border-b border-border sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-secondary"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <p className="text-sm text-muted-foreground mb-4">
              Last updated: December 28, 2024
            </p>
            <p className="text-foreground">
              EggPro ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and delivery address when you create an account or place an order.</li>
              <li><strong>Payment Information:</strong> We use Razorpay for payment processing. We do not store your complete payment card details on our servers.</li>
              <li><strong>Usage Data:</strong> Information about how you use our app to improve our services.</li>
              <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>To process and deliver your orders</li>
              <li>To manage your subscriptions</li>
              <li>To send order confirmations and updates via email/SMS</li>
              <li>To provide customer support</li>
              <li>To improve our app and services</li>
              <li>To send promotional offers (you can opt-out anytime)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Sharing</h2>
            <p className="text-foreground">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground mt-2">
              <li>Payment processors (Razorpay) to complete transactions</li>
              <li>Delivery personnel to fulfill your orders</li>
              <li>Service providers who assist in our operations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Security</h2>
            <p className="text-foreground">
              We implement industry-standard security measures to protect your data. All data transmission is encrypted using SSL/TLS protocols.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Access, update, or delete your personal information through your account settings</li>
              <li>Opt-out of promotional communications</li>
              <li>Request a copy of your data</li>
              <li>Delete your account by contacting support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Children's Privacy</h2>
            <p className="text-foreground">
              Our app is not intended for children under 13. We do not knowingly collect data from children under 13 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Changes to This Policy</h2>
            <p className="text-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact Us</h2>
            <p className="text-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-primary font-medium mt-2">eggproindia@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};
