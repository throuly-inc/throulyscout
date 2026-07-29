import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Lock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo/SEO";

interface Property {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  asking_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  photos: string[] | null;
  status: string;
  listing_type: string | null;
  description: string | null;
}


export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isPremium = profile?.subscription_tier !== "free";

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    // Explicit columns — anon users no longer have SELECT on owner_id.
    supabase
      .from("properties")
      .select(
        "id, address, city, state, zip, asking_price, bedrooms, bathrooms, sqft, photos, description, status, listing_type",
      )
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProperty(data as Property | null);
        setLoading(false);
      });
  }, [id]);


  const handleContactSeller = () => {
    toast({
      title: "Message Sent",
      description: "A placeholder message has been recorded. Real messaging coming soon!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 text-center py-16">
          <p className="text-lg text-muted-foreground">Property not found.</p>
          <Link to="/properties/search">
            <Button variant="ghost" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const photos = property.photos || [];
  const locationLabel = [property.city, property.state].filter(Boolean).join(", ") || "United States";
  const seoTitle = `${property.bedrooms ?? "?"} BR home in ${locationLabel} | Throuly`;
  const seoDescription =
    property.description?.slice(0, 155) ||
    `View this ${property.bedrooms ?? ""}-bed, ${property.bathrooms ?? ""}-bath home in ${locationLabel} on Throuly — private property details and affordability calculator.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle.slice(0, 59)}
        description={seoDescription}
        path={`/properties/${property.id}`}
        image={photos[0]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": ["Product", "Accommodation"],
          name: `Home for sale in ${locationLabel}`,
          description: property.description || `Home for sale in ${locationLabel}`,
          image: photos.length ? photos.slice(0, 5) : undefined,
          numberOfBedrooms: property.bedrooms ?? undefined,
          numberOfBathroomsTotal: property.bathrooms ?? undefined,
          floorSize: property.sqft
            ? { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" }
            : undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: property.city ?? undefined,
            addressRegion: property.state ?? undefined,
            postalCode: property.zip ?? undefined,
            addressCountry: "US",
          },
          offers: property.asking_price
            ? {
                "@type": "Offer",
                price: property.asking_price,
                priceCurrency: "USD",
                availability:
                  property.status === "active"
                    ? "https://schema.org/InStock"
                    : "https://schema.org/SoldOut",
              }
            : undefined,
        }}
      />
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link to="/properties/search">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Search</Button>
          </Link>

          {/* Premium upgrade banner for free users */}
          {!isPremium && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-accent" />
                  <p className="text-sm text-foreground">
                    <strong>Upgrade to Premium</strong> to see full address details.
                  </p>
                </div>
                <Link to="/pricing">
                  <Button variant="accent" size="sm">Upgrade</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery */}
          {photos.length > 0 ? (
            <div className="space-y-3">
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted">
                <img
                  src={photos[selectedPhoto]}
                  alt={`${property.city || "Property"} home for sale — photo ${selectedPhoto + 1} of ${photos.length}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhoto(idx)}
                      aria-label={`Show photo ${idx + 1} of ${photos.length}`}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        idx === selectedPhoto ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={photo} alt={`${property.city || "Property"} home — thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] rounded-xl bg-muted flex items-center justify-center">
              <MapPin className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Property Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <p className="font-serif text-3xl text-foreground">
                  {property.asking_price != null ? "$" + property.asking_price.toLocaleString("en-US") : "Price TBD"}
                </p>
                <div className="mt-1">
                  {isPremium ? (
                    <p className="text-lg text-muted-foreground">{property.address}</p>
                  ) : (
                    <p className="text-lg text-muted-foreground blur-[3px] select-none" aria-hidden>
                      {property.address}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {property.city}{property.city && property.state ? ", " : ""}{property.state} {property.zip || ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-muted-foreground">
                {property.bedrooms != null && (
                  <span className="flex items-center gap-2"><Bed className="w-5 h-5" />{property.bedrooms} Beds</span>
                )}
                {property.bathrooms != null && (
                  <span className="flex items-center gap-2"><Bath className="w-5 h-5" />{property.bathrooms} Baths</span>
                )}
                {property.sqft != null && (
                  <span className="flex items-center gap-2"><Maximize className="w-5 h-5" />{property.sqft.toLocaleString()} sqft</span>
                )}
              </div>

              <div className="flex gap-2">
                <Badge>{property.status}</Badge>
                {property.listing_type && <Badge variant="outline">{property.listing_type}</Badge>}
              </div>

              {property.description && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
                </div>
              )}
            </div>

            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Interested?</h3>
                  {isPremium ? (
                    <Button variant="accent" className="w-full" onClick={handleContactSeller}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Seller
                    </Button>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">Premium members unlock full property details.</p>
                      <Link to="/pricing">
                        <Button variant="accent" className="w-full">Upgrade to Premium</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
