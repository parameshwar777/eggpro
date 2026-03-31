import { ArrowLeft, Mail, Phone, MapPin, Egg } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EggLogo } from "@/components/EggLogo";

export const AboutPage = () => {
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
          <h1 className="text-lg font-semibold text-foreground">About EggPro</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Logo Section */}
          <div className="flex flex-col items-center py-6">
            <EggLogo size="lg" />
            <h2 className="text-2xl font-bold text-foreground mt-4">NutriEggs</h2>
            <p className="text-muted-foreground">by EggPro</p>
            <p className="text-sm text-muted-foreground mt-2">Version 1.2.0</p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Our Mission</h2>
            <p className="text-foreground">
              At EggPro, we are committed to delivering fresh, high-quality eggs directly to your doorstep every morning. We believe in providing nutrition to every household with convenience and reliability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">What We Offer</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Egg className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Farm Fresh Eggs</p>
                  <p className="text-sm text-muted-foreground">Sourced directly from trusted farms</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Egg className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Flexible Subscriptions</p>
                  <p className="text-sm text-muted-foreground">Daily, alternate, or weekly delivery options</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Egg className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Early Morning Delivery</p>
                  <p className="text-sm text-muted-foreground">Fresh eggs at your door between 6-9 AM</p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact Us</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-full">
                  <Mail className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">eggproindia@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-full">
                  <Phone className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-foreground">+91 98585 97999</p>
                  <p className="text-foreground">+91 89888 07555</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-full">
                  <MapPin className="w-4 h-4 text-foreground" />
                </div>
              <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-foreground font-medium">EGG PRO INDIA PRIVATE LIMITED</p>
                  <p className="text-foreground text-sm">Ground Floor, Plot No 40 & 41, Radha Nagar, Near Fish Shop, Suncity, Hyderabad, Rangareddy, Telangana - 500091</p>
                </div>
              </div>
            </div>
          </section>

          <section className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Made with ❤️ in Hyderabad
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © 2025 EGG PRO INDIA PRIVATE LIMITED. All rights reserved.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
