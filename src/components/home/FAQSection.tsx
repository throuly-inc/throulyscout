import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";


const faqs = [
  {
    question: "How does throuly help me calculate affordability?",
    answer: "Our calculator analyzes your financial profile against state-specific data including property taxes, insurance rates, and closing costs for all 50 states. You get accurate estimates for down payments, monthly payments, and total cash needed — without sharing your personal information with anyone.",
  },
  {
    question: "Is my financial information secure?",
    answer: "Absolutely. We prioritize your privacy above all else. Your financial data is never shared with third parties, and we don't sell leads. You can explore your options anonymously.",
  },
  {
    question: "What features does throuly offer?",
    answer: "throuly includes full access to our affordability calculator for all 50 states, personalized qualification analysis, DTI breakdown, detailed market comparisons, and the ability to save your results.",
  },
  {
    question: "How accurate are the state-specific calculations?",
    answer: "Our calculations are updated regularly with current tax rates, insurance averages, and market data for each state. While these provide excellent estimates for planning purposes, final numbers may vary based on specific property details and loan terms.",
  },
];


export function FAQSection() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <section className="py-24 bg-secondary/20">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            Questions & Answers
          </span>
          <h2 className="text-4xl md:text-5xl text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using throuly for your real estate journey.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-left text-foreground font-medium py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
