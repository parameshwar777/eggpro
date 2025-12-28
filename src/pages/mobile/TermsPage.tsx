import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-card px-4 py-3 flex items-center gap-3 border-b border-border sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-secondary"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <p className="text-sm text-muted-foreground mb-4">
              Last updated: December 28, 2024
            </p>
            <p className="text-foreground">
              Welcome to EggPro. By using our mobile application and services, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p className="text-foreground">
              By accessing or using EggPro, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to use our services</li>
              <li>One account per person; multiple accounts may be suspended</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Orders and Subscriptions</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>All orders are subject to availability and delivery area restrictions</li>
              <li>Subscription plans auto-renew unless paused or cancelled</li>
              <li>Prices are subject to change with prior notice</li>
              <li>Delivery times are estimates and may vary based on circumstances</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>All payments are processed securely through Razorpay</li>
              <li>You agree to pay all charges at the prices listed</li>
              <li>Wallet credits are non-refundable and non-transferable</li>
              <li>Failed payments may result in order cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Cancellation and Refunds</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Orders can be cancelled before dispatch for a full refund</li>
              <li>Refunds for quality issues will be processed after verification</li>
              <li>Refunds will be credited to your original payment method or wallet</li>
              <li>Subscription cancellations take effect at the end of the billing cycle</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Product Quality</h2>
            <p className="text-foreground">
              We strive to deliver fresh, high-quality eggs. If you receive damaged or poor-quality products, please contact us within 24 hours with photos for a replacement or refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Referral Program</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Referral rewards are credited after the referred user's first successful order</li>
              <li>Abuse of the referral program may result in account suspension</li>
              <li>We reserve the right to modify or terminate the program</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Prohibited Activities</h2>
            <p className="text-foreground">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground mt-2">
              <li>Use the app for any unlawful purpose</li>
              <li>Attempt to hack, disrupt, or abuse our systems</li>
              <li>Create fake accounts or abuse promotions</li>
              <li>Resell products purchased through our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Limitation of Liability</h2>
            <p className="text-foreground">
              EggPro shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services. Our maximum liability is limited to the amount paid for the specific order in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Changes to Terms</h2>
            <p className="text-foreground">
              We may modify these terms at any time. Continued use of the app after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Governing Law</h2>
            <p className="text-foreground">
              These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Contact Us</h2>
            <p className="text-foreground">
              For any questions about these Terms, contact us at:
            </p>
            <p className="text-primary font-medium mt-2">eggproindia@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};
