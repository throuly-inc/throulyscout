import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { EmploymentType } from "./types";

interface Props {
  employment: EmploymentType | null;
  onChange: (v: EmploymentType) => void;
}

const OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "w2", label: "W-2 employee" },
  { value: "self_employed", label: "Self-employed" },
  { value: "1099", label: "1099 / contractor" },
  { value: "retired", label: "Retired" },
  { value: "multiple", label: "Multiple sources" },
  { value: "other", label: "Other" },
];

export function DocumentChecklistCard({ employment, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Document preparation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          How do you earn income? We'll tailor the document checklist above.
          General educational information — actual lender requirements vary.
        </p>
        <RadioGroup
          value={employment ?? ""}
          onValueChange={(v) => onChange(v as EmploymentType)}
          className="grid grid-cols-2 md:grid-cols-3 gap-2"
        >
          {OPTIONS.map((o) => (
            <Label
              key={o.value}
              htmlFor={`emp-${o.value}`}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm transition-colors ${
                employment === o.value ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"
              }`}
            >
              <RadioGroupItem id={`emp-${o.value}`} value={o.value} />
              {o.label}
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
