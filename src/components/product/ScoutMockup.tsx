import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateMortgage, FinancialProfile } from "@/lib/calculator";
import { statesData } from "@/lib/states";

const POPULAR_STATES = ["TX", "FL", "GA", "CA", "NY", "NC", "AZ", "CO", "WA", "TN"];

const CREDIT_BANDS: { label: string; mid: number }[] = [
  { label: "580–619", mid: 600 },
  { label: "620–659", mid: 640 },
  { label: "660–699", mid: 680 },
  { label: "700–739", mid: 720 },
  { label: "740–850", mid: 770 },
];

function fmtMoney(n: number) {
  if (!isFinite(n) || n <= 0) return "$0";
  return "$" + Math.round(n).toLocaleString();
}

function parseMoney(s: string) {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : 0;
}

export function ScoutMockup() {
  const navigate = useNavigate();

  const [income, setIncome] = useState("95000");
  const [down, setDown] = useState("40000");
  const [creditIdx, setCreditIdx] = useState(3); // 700-739
  const [debts, setDebts] = useState("350");
  const [selectedStates, setSelectedStates] = useState<string[]>(["TX", "FL", "GA"]);
  const [calculated, setCalculated] = useState(true); // show default results on first load

  const toggleState = (abbr: string) => {
    setSelectedStates((prev) => {
      if (prev.includes(abbr)) return prev.filter((s) => s !== abbr);
      if (prev.length >= 3) return prev;
      return [...prev, abbr];
    });
  };

  const results = useMemo(() => {
    if (!calculated || selectedStates.length === 0) return [];
    const yearlyIncome = parseMoney(income);
    const savings = parseMoney(down);
    const monthlyDebt = parseMoney(debts);
    const creditScore = CREDIT_BANDS[creditIdx].mid;

    const profile: FinancialProfile = {
      yearlyIncome,
      monthlyDebt,
      savings,
      creditScore,
    };

    return selectedStates.map((abbr) => {
      const state = statesData.find((s) => s.abbreviation === abbr);
      if (!state) return null;
      // Use the state's median home price as a probe; we read maxAffordablePrice + rate band.
      const downPct = state.medianHomePrice > 0 ? Math.min(95, Math.max(3, (savings / state.medianHomePrice) * 100)) : 10;
      const calc = calculateMortgage(state.medianHomePrice, downPct, state, profile, 0, "conventional");
      return {
        abbr,
        name: state.name,
        price: calc.maxAffordablePrice,
        rate: calc.rateRange.mid,
      };
    }).filter(Boolean) as { abbr: string; name: string; price: number; rate: number }[];
  }, [calculated, income, down, debts, creditIdx, selectedStates]);

  const handleCalculate = () => setCalculated(true);

  const goToFull = () => {
    const params = new URLSearchParams({
      income: parseMoney(income).toString(),
      savings: parseMoney(down).toString(),
      debt: parseMoney(debts).toString(),
      credit: CREDIT_BANDS[creditIdx].mid.toString(),
      states: selectedStates.join(","),
    });
    navigate(`/buyers?${params.toString()}`);
  };

  return (
    <div
      className="rounded-[14px] overflow-hidden w-full max-w-[420px]"
      style={{
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        background: '#f7f4ee',
      }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{
          background: '#eeebe0',
          borderBottom: '1px solid rgba(12,14,26,0.08)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="block rounded-full" style={{ width: 10, height: 10, background: '#ff5f57' }} />
          <span className="block rounded-full" style={{ width: 10, height: 10, background: '#febc2e' }} />
          <span className="block rounded-full" style={{ width: 10, height: 10, background: '#28c840' }} />
        </div>
        <div
          className="mx-auto px-3 py-0.5 rounded-md"
          style={{
            background: 'rgba(12,14,26,0.04)',
            border: '1px solid rgba(12,14,26,0.06)',
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            color: '#787a92',
          }}
        >
          throulyscout.com/scout
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5" style={{ background: '#f7f4ee' }}>
        <h3 className="font-serif text-center" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0c0e1a', marginBottom: 4 }}>
          What can I afford?
        </h3>
        <p className="text-center" style={{ fontSize: '0.6rem', color: '#787a92', marginBottom: 16 }}>
          Your information stays private until you decide to connect.
        </p>

        <div className="flex flex-col gap-2.5">
          <NumField label="ANNUAL INCOME" value={income} onChange={setIncome} prefix="$" />
          <NumField label="DOWN PAYMENT" value={down} onChange={setDown} prefix="$" />

          <div>
            <FieldLabel>CREDIT SCORE</FieldLabel>
            <div className="flex gap-1 flex-wrap">
              {CREDIT_BANDS.map((b, i) => (
                <button
                  key={b.label}
                  onClick={() => setCreditIdx(i)}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: 999,
                    border: `1px solid ${creditIdx === i ? 'rgba(2,132,199,0.4)' : 'rgba(12,14,26,0.12)'}`,
                    background: creditIdx === i ? 'rgba(2,132,199,0.1)' : 'transparent',
                    color: creditIdx === i ? '#0369a1' : '#0c0e1a',
                    cursor: 'pointer',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <NumField label="MONTHLY DEBTS" value={debts} onChange={setDebts} prefix="$" suffix="/ mo" />

          <div>
            <FieldLabel>TARGET STATES <span style={{ fontWeight: 500, color: '#a3a5b8' }}>(pick up to 3)</span></FieldLabel>
            <div className="flex gap-1.5 flex-wrap">
              {POPULAR_STATES.map((abbr) => {
                const active = selectedStates.includes(abbr);
                const disabled = !active && selectedStates.length >= 3;
                const state = statesData.find((s) => s.abbreviation === abbr);
                return (
                  <button
                    key={abbr}
                    onClick={() => toggleState(abbr)}
                    disabled={disabled}
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      background: active ? 'rgba(2,132,199,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(2,132,199,0.3)' : 'rgba(12,14,26,0.12)'}`,
                      color: active ? '#0369a1' : disabled ? '#c4c5d2' : '#0c0e1a',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {state?.name || abbr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full mt-4 rounded-lg transition-opacity hover:opacity-90"
          style={{
            background: '#0c0e1a',
            color: '#f7f4ee',
            fontWeight: 700,
            fontSize: '0.72rem',
            padding: '10px 0',
            letterSpacing: '0.02em',
            cursor: 'pointer',
          }}
        >
          Calculate My Buying Power
        </button>

        {results.length > 0 && (
          <>
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1" style={{ height: 1, background: 'rgba(12,14,26,0.08)' }} />
              <span style={{ fontSize: '0.55rem', color: '#787a92', fontWeight: 600, letterSpacing: '0.06em' }}>
                YOUR RESULTS — {results.length} MARKET{results.length !== 1 ? 'S' : ''}
              </span>
              <div className="flex-1" style={{ height: 1, background: 'rgba(12,14,26,0.08)' }} />
            </div>

            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <ResultCard key={r.abbr} state={r.name} abbr={r.abbr} price={fmtMoney(r.price)} rate={`${r.rate.toFixed(2)}%`} />
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <ActionBtn label="See Full Breakdown" filled onClick={goToFull} />
            </div>

            <p className="text-center mt-3" style={{ fontSize: '0.5rem', color: '#a3a5b8' }}>
              🔒 Estimate only. Contact info never shared without your consent.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', color: '#787a92', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

function NumField({ label, value, onChange, prefix, suffix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string }) {
  const display = value ? Number(value).toLocaleString() : "";
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        className="rounded-md flex items-center"
        style={{
          background: 'rgba(12,14,26,0.03)',
          border: '1px solid rgba(12,14,26,0.08)',
          padding: '6px 10px',
        }}
      >
        {prefix && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0c0e1a', marginRight: 2 }}>{prefix}</span>}
        <input
          inputMode="numeric"
          value={display}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#0c0e1a',
            width: '100%',
            padding: 0,
          }}
        />
        {suffix && <span style={{ fontSize: '0.7rem', color: '#787a92', marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ResultCard({ state, abbr, price, rate }: { state: string; abbr: string; price: string; rate: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3.5 py-2.5"
      style={{
        background: 'white',
        border: '1px solid rgba(12,14,26,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 28, height: 28, background: 'rgba(2,132,199,0.08)', color: '#0284c7', fontSize: '0.7rem', fontWeight: 700 }}
        >
          {abbr}
        </div>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#787a92', fontWeight: 500 }}>{state}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c0e1a' }}>{price}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.6rem', color: '#787a92', textAlign: 'right' }}>
        {rate} · 30yr
      </div>
    </div>
  );
}

function ActionBtn({ label, filled, onClick }: { label: string; filled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-md py-1.5 transition-opacity hover:opacity-90"
      style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        cursor: 'pointer',
        ...(filled
          ? { background: '#0c0e1a', color: '#f7f4ee', border: 'none' }
          : { background: 'transparent', border: '1px solid rgba(12,14,26,0.12)', color: '#0c0e1a' }),
      }}
    >
      {label}
    </button>
  );
}
