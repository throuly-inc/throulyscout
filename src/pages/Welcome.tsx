import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">Welcome to throuly</h1>
        <p className="text-lg text-muted-foreground">
          Calculate what you can afford and get roadmap-ready for your first home.
        </p>
        <Button size="lg" onClick={() => navigate("/buyers")} className="gap-2 min-w-[200px]">
          Start My Estimate <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
