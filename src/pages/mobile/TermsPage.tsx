import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TermsPage = () => {
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
          <h1 className="text-lg font-semibold text-foreground">Terms & Conditions</h1>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <p className="text-sm text-muted-foreground mb-4">
              Last updated: March 31, 2026
            </p>
            <p className="text-foreground">
              Welcome to EggPro, a product of <strong>EGG PRO INDIA PRIVATE LIMITED</strong>. By using our mobile application and services, you agree to be bound by these Terms & Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p className="text-foreground">
              By accessing or using EggPro, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Company Information</h2>
            <p className="text-foreground">
              <strong>EGG PRO INDIA PRIVATE LIMITED</strong>
            </p>
            <p className="text-foreground mt-1">
              Ground Floor, Plot No 40 & 41, Radha Nagar, Near Fish Shop, Suncity, Hyderabad, Rangareddy, Telangana - 500091, India.
            </p>
            <p className="text-foreground mt-1">
              Email: <span className="text-primary font-medium">eggproindia@gmail.com</span>
            </p>
            <p className="text-foreground mt-1">
              Phone: +91 98585 97999 / +91 89888 07555
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to use our services</li>
              <li>One account per person; multiple accounts may be suspended</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Orders and Subscriptions</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>All orders are subject to availability and delivery area restrictions</li>
              <li>Subscription plans auto-renew unless paused or cancelled</li>
              <li>Prices are subject to change with prior notice</li>
              <li>Delivery times are estimates and may vary based on circumstances</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>All payments are processed securely through Razorpay</li>
              <li>You agree to pay all charges at the prices listed</li>
              <li>Wallet credits are non-refundable and non-transferable</li>
              <li>Failed payments may result in order cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Cancellation & Refund Policy</h2>
            <p className="text-foreground mb-2">
              At <strong>EGG PRO INDIA PRIVATE LIMITED</strong>, we strive for 100% customer satisfaction. Our refund and cancellation policy is as follows:
            </p>
            <h3 className="font-semibold text-foreground mt-3 mb-1">Cancellation</h3>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Orders can be cancelled before dispatch for a full refund</li>
              <li>Once an order has been dispatched, it cannot be cancelled</li>
              <li>Subscription cancellations take effect at the end of the current billing cycle</li>
              <li>You can pause your subscription at any time from the app</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-3 mb-1">Refunds</h3>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>If you receive damaged, broken, or poor-quality eggs, please report within 24 hours with photographs</li>
              <li>After verification, a full refund or replacement will be provided</li>
              <li>Refunds will be credited to your original payment method within 5-7 business days</li>
              <li>Alternatively, refunds can be credited to your EggPro Wallet for instant use</li>
              <li>Wallet balance refunds are processed instantly</li>
              <li>For prepaid subscription orders, unused days will be refunded proportionally upon cancellation</li>
            </ul>
            <h3 className="font-semibold text-foreground mt-3 mb-1">Non-Refundable</h3>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Wallet top-up amounts are non-refundable and non-transferable</li>
              <li>Promotional credits and referral bonuses cannot be refunded</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Product Quality</h2>
            <p className="text-foreground">
              We strive to deliver fresh, high-quality eggs. If you receive damaged or poor-quality products, please contact us within 24 hours with photos for a replacement or refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Referral Program</h2>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Referral rewards are credited after the referred user's first successful order</li>
              <li>Abuse of the referral program may result in account suspension</li>
              <li>We reserve the right to modify or terminate the program</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Prohibited Activities</h2>
            <p className="text-foreground">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground mt-2">
              <li>Use the app for any unlawful purpose</li>
              <li>Attempt to hack, disrupt, or abuse our systems</li>
              <li>Create fake accounts or abuse promotions</li>
              <li>Resell products purchased through our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Limitation of Liability</h2>
            <p className="text-foreground">
              EGG PRO INDIA PRIVATE LIMITED shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services. Our maximum liability is limited to the amount paid for the specific order in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Changes to Terms</h2>
            <p className="text-foreground">
              We may modify these terms at any time. Continued use of the app after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Governing Law</h2>
            <p className="text-foreground">
              These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">13. Contact Us</h2>
            <p className="text-foreground">
              For any questions about these Terms, contact us at:
            </p>
            <div className="mt-3 p-4 bg-secondary rounded-xl space-y-2">
              <p className="font-semibold text-foreground">EGG PRO INDIA PRIVATE LIMITED</p>
              <p className="text-foreground text-sm">
                Ground Floor, Plot No 40 & 41, Radha Nagar, Near Fish Shop, Suncity, Hyderabad, Rangareddy, Telangana - 500091
              </p>
              <p className="text-primary font-medium">eggproindia@gmail.com</p>
              <p className="text-foreground text-sm">+91 98585 97999 / +91 89888 07555</p>
            </div>
          </section>

          <section className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              © 2025 EGG PRO INDIA PRIVATE LIMITED. All rights reserved.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
