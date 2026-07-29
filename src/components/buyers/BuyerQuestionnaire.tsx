import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Home, Building, Building2, Castle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BuyerAnswers {
  isFirstTimeBuyer: boolean | null;
  isFirstHome: boolean | null;
  needToBuyToSell: boolean | null;
  propertyType: "single-family" | "condo" | "townhouse" | "multi-family" | null;
  needToSellToBuy: boolean | null;
  isInvestmentProperty: boolean | null;
}

interface Question {
  id: keyof BuyerAnswers;
  question: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  showIf?: (answers: BuyerAnswers) => boolean;
}

const questions: Question[] = [
  {
    id: "isFirstTimeBuyer",
    question: "Are you a first-time home buyer?",
    options: [
      { value: "true", label: "Yes, this is my first time buying" },
      { value: "false", label: "No, I've purchased before" },
    ],
  },
  {
    id: "isFirstHome",
    question: "Will this be your primary residence?",
    options: [
      { value: "true", label: "Yes, I'll live here" },
      { value: "false", label: "No, it's for investment" },
    ],
  },
  {
    id: "propertyType",
    question: "What type of property are you looking for?",
    options: [
      { value: "single-family", label: "Single Family Home", icon: <Home className="w-5 h-5" /> },
      { value: "condo", label: "Condo / Co-op", icon: <Building className="w-5 h-5" /> },
      { value: "townhouse", label: "Townhouse", icon: <Building2 className="w-5 h-5" /> },
      { value: "multi-family", label: "Multi-Family", icon: <Castle className="w-5 h-5" /> },
    ],
  },
  {
    id: "needToSellToBuy",
    question: "Do you need to sell your current home to buy?",
    options: [
      { value: "true", label: "Yes, I need to sell first" },
      { value: "false", label: "No, I can buy independently" },
    ],
    showIf: (answers) => answers.isFirstTimeBuyer === false,
  },
  {
    id: "isInvestmentProperty",
    question: "Is this an investment property?",
    options: [
      { value: "true", label: "Yes, I'm investing" },
      { value: "false", label: "No, it's for personal use" },
    ],
    showIf: (answers) => answers.isFirstHome === false,
  },
];

interface BuyerQuestionnaireProps {
  onComplete: (answers: BuyerAnswers) => void;
  onBack?: () => void;
}

export function BuyerQuestionnaire({ onComplete, onBack }: BuyerQuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<BuyerAnswers>({
    isFirstTimeBuyer: null,
    isFirstHome: null,
    needToBuyToSell: null,
    propertyType: null,
    needToSellToBuy: null,
    isInvestmentProperty: null,
  });

  const visibleQuestions = questions.filter(
    (q) => !q.showIf || q.showIf(answers)
  );

  const currentQuestion = visibleQuestions[currentIndex];
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;
  const currentAnswer = answers[currentQuestion?.id];

  const handleAnswer = (value: string) => {
    const parsedValue = value === "true" ? true : value === "false" ? false : value;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: parsedValue,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(answers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentIndex + 1} of {visibleQuestions.length}</span>
          <span>{Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / visibleQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card className="p-8 animate-fade-in">
        <h3 className="font-serif text-2xl text-foreground mb-6">{currentQuestion.question}</h3>

        <RadioGroup
          value={String(currentAnswer ?? "")}
          onValueChange={handleAnswer}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                String(currentAnswer) === option.value
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              )}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              {option.icon && (
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  String(currentAnswer) === option.value ? "bg-accent text-accent-foreground" : "bg-secondary"
                )}>
                  {option.icon}
                </div>
              )}
              <span className="font-medium">{option.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={handlePrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          variant="accent"
          onClick={handleNext}
          disabled={currentAnswer === null}
        >
          {isLastQuestion ? "See Results" : "Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
