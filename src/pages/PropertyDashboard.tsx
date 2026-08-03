import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PropertyAnalyzer } from "@/components/property/PropertyAnalyzer";
import { SavedAnalyses } from "@/components/property/SavedAnalyses";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Search, History, Shield } from "lucide-react";

export default function PropertyDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id?: string;
    subscription_end?: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check subscription status
        const { data, error } = await supabase.functions.invoke('throulyscout-check-subscription');
        if (!error && data) {
          setSubscription(data);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('throulyscout-create-checkout', {
        body: { priceId: 'price_premium_buyer' } // This should be your actual Stripe price ID
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access the Premium Property Analysis dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!subscription?.subscribed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Crown className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
              <CardTitle className="text-2xl">Upgrade to Premium</CardTitle>
              <CardDescription className="text-base mt-2">
                Unlock powerful property analysis tools to find your perfect home
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Search className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Analyze Any Listing</h4>
                    <p className="text-sm text-muted-foreground">
                      Paste any Zillow or Redfin link and get instant qualification analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Down Payment Scenarios</h4>
                    <p className="text-sm text-muted-foreground">
                      See multiple down payment options with PMI, taxes, and insurance calculated
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Crown className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Assistance Programs</h4>
                    <p className="text-sm text-muted-foreground">
                      Discover grants, down payment assistance, and first-time buyer programs
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <Button size="lg" onClick={handleUpgrade} className="px-8">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Cancel anytime • Secure payment via Stripe
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Property Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze listings and discover if you qualify for your dream home
          </p>
        </div>

        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analyze" className="gap-2">
              <Search className="w-4 h-4" />
              Analyze Property
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <History className="w-4 h-4" />
              Saved Analyses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze">
            <PropertyAnalyzer userId={user.id} />
          </TabsContent>

          <TabsContent value="saved">
            <SavedAnalyses userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
