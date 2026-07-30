import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Bed, Bath, Maximize, MapPin, Lock, Crown, ArrowRight, Phone, ArrowLeft } from "lucide-react";
import { US_STATES } from "@/lib/states";

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
}

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"];
const BATHROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const FREE_RESULT_LIMIT = 5;

export default function PropertySearch() {
  const { profile } = useAuth();
  const { canAccess } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardHref = "/dashboard/client";
  const isPremium = canAccess("full_address");

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [stateFilter, setStateFilter] = useState(() => searchParams.get("state") || "");
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedroomsFilter, setBedroomsFilter] = useState("Any");
  const [bathroomsFilter, setBathroomsFilter] = useState("Any");
  const [minSqft, setMinSqft] = useState("");

  const runSearch = async () => {
    setLoading(true);
    // Anonymous-safe view: omits owner_id to prevent user enumeration.
    let query = supabase.from("public_properties" as any).select("*");

    if (stateFilter) query = query.eq("state", stateFilter);
    if (cityFilter.trim()) query = query.ilike("city", `%${cityFilter.trim()}%`);
    if (minPrice) query = query.gte("asking_price", Number(minPrice));
    if (maxPrice) query = query.lte("asking_price", Number(maxPrice));
    if (bedroomsFilter !== "Any") {
      const val = bedroomsFilter === "5+" ? 5 : Number(bedroomsFilter);
      query = query.gte("bedrooms", val);
    }
    if (bathroomsFilter !== "Any") {
      const val = bathroomsFilter === "4+" ? 4 : Number(bathroomsFilter);
      query = query.gte("bathrooms", val);
    }
    if (minSqft) query = query.gte("sqft", Number(minSqft));

    query = query.order("asking_price", { ascending: true }).limit(50);

    const { data } = await query;
    setProperties(((data as unknown) as Property[]) || []);
    setLoading(false);
  };


  useEffect(() => {
    runSearch();
  }, []);

  const visibleProperties = isPremium ? properties : properties.slice(0, FREE_RESULT_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, properties.length - FREE_RESULT_LIMIT);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="font-serif text-3xl text-foreground">Find Properties</h1>
            <Button variant="outline" size="sm" asChild>
              <Link to={dashboardHref}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_states">All States</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="City" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
                <MoneyInput placeholder="Min Price" value={minPrice} onChange={setMinPrice} aria-label="Minimum price" />
                <MoneyInput placeholder="Max Price" value={maxPrice} onChange={setMaxPrice} aria-label="Maximum price" />
                <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
                  <SelectTrigger><SelectValue placeholder="Beds" /></SelectTrigger>
                  <SelectContent>
                    {BEDROOM_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o === "Any" ? "Beds: Any" : `${o} Bed`}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={bathroomsFilter} onValueChange={setBathroomsFilter}>
                  <SelectTrigger><SelectValue placeholder="Baths" /></SelectTrigger>
                  <SelectContent>
                    {BATHROOM_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o === "Any" ? "Baths: Any" : `${o} Bath`}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Min Sqft" value={minSqft} onChange={(e) => setMinSqft(e.target.value)} />
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="accent" onClick={runSearch} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No properties found matching your criteria.</p>
              <p className="text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} isPremium={isPremium} />
                ))}
              </div>

              {/* Free tier limit banner */}
              {hiddenCount > 0 && (
                <Card className="p-6 border-accent/30 bg-accent/5 text-center">
                  <Lock className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-foreground mb-1">
                    {hiddenCount} more {hiddenCount === 1 ? "property" : "properties"} match your criteria
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to Premium to see all results with full addresses and seller contact info.
                  </p>
                  <Button variant="accent" onClick={() => navigate("/pricing")}>
                    <Crown className="w-4 h-4 mr-2" />
                    View Plans
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property, isPremium }: { property: Property; isPremium: boolean }) {
  const navigate = useNavigate();
  const photo = property.photos?.[0];

  return (
    <Link to={`/properties/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {photo ? (
            <img src={photo} alt={property.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Lock overlay for free users */}
          {!isPremium && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
              <div className="text-center">
                <Lock className="w-8 h-8 text-accent mx-auto mb-1" />
                <span className="text-xs font-medium text-foreground bg-card/90 px-2 py-1 rounded">
                  Upgrade to see full details
                </span>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground">
              {property.status}
            </Badge>
            {property.listing_type && (
              <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border text-foreground">
                {property.listing_type}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <p className="font-serif text-xl text-foreground">
            {property.asking_price != null
              ? "$" + property.asking_price.toLocaleString("en-US")
              : "Price TBD"}
          </p>

          {/* Address: blurred for free users */}
          <div className="relative">
            {isPremium ? (
              <p className="text-sm text-muted-foreground truncate">{property.address}</p>
            ) : (
              <p className="text-sm text-muted-foreground select-none" aria-hidden>
                <span className="blur-[5px]">{property.address.split(",")[0]}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {property.city}{property.city && property.state ? ", " : ""}{property.state} {property.zip || ""}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{property.bedrooms}</span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms}</span>
            )}
            {property.sqft != null && (
              <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{property.sqft.toLocaleString()} sqft</span>
            )}
          </div>

          {/* Contact seller (premium only) */}
          {isPremium && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Contact Seller
            </Button>
          )}

          {/* Upgrade banner for free */}
          {!isPremium && (
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = "/pricing"; }}
                className="w-full flex items-center justify-between text-xs text-accent hover:underline"
              >
                <span>Upgrade to Premium to unlock full details</span>
                <span className="font-medium flex items-center gap-1">
                  View Plans <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
