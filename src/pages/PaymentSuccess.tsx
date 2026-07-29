import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // You could verify the session here if needed
    if (sessionId) {
      console.log("Payment successful, session:", sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <div className="bg-card border border-border rounded-2xl p-10 shadow-lg">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>

            {/* Header */}
            <h1 className="text-3xl font-semibold text-foreground mb-3">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your purchase. Your account has been upgraded and you now have access to all premium features.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button variant="hero" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg">
                  View Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Support Note */}
            <p className="text-xs text-muted-foreground mt-8">
              Need help? Contact us at support@throuly.com
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
