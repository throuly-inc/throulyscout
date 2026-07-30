import { statesData, getStateByAbbreviation, getStateByName } from "./states";

// ZIP prefix to state abbreviation mapping
const zipPrefixToState: [number, number, string][] = [
  [100, 199, "NY"], [200, 209, "DC"], [210, 219, "MD"], [220, 246, "VA"],
  [247, 268, "WV"], [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"],
  [320, 349, "FL"], [350, 369, "AL"], [370, 385, "TN"], [386, 397, "MS"],
  [400, 427, "KY"], [430, 459, "OH"], [460, 479, "IN"], [480, 499, "MI"],
  [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [570, 577, "SD"],
  [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"],
  [660, 679, "KS"], [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"],
  [730, 749, "OK"], [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"],
  [832, 838, "ID"], [840, 847, "UT"], [850, 865, "AZ"], [870, 884, "NM"],
  [889, 898, "NV"], [900, 966, "CA"], [967, 968, "HI"], [970, 979, "OR"],
  [980, 994, "WA"], [995, 999, "AK"],
];

export function zipToState(zip: string): string | null {
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (isNaN(prefix)) return null;
  for (const [lo, hi, st] of zipPrefixToState) {
    if (prefix >= lo && prefix <= hi) return st;
  }
  return null;
}

// Rent-to-price monthly ratio
const rentToPriceRatio: Record<string, number> = {
  CA: 0.004, NY: 0.005, TX: 0.006, FL: 0.006, OH: 0.008, GA: 0.006,
  AZ: 0.005, IL: 0.007, PA: 0.007, NC: 0.006, MI: 0.008, IN: 0.008,
  MO: 0.007, WI: 0.007, MN: 0.006, LA: 0.007, AL: 0.007, KY: 0.007,
  SC: 0.006, OK: 0.008, AR: 0.007, MS: 0.008, KS: 0.007, NE: 0.007,
  WV: 0.008, NM: 0.006, ND: 0.007, SD: 0.007, MT: 0.005, WY: 0.005,
  ID: 0.005, UT: 0.005, NV: 0.005, CO: 0.005, OR: 0.005, WA: 0.005,
  HI: 0.004, AK: 0.005, DC: 0.005, CT: 0.006, NJ: 0.006, MA: 0.005,
  NH: 0.006, VT: 0.006, ME: 0.006, RI: 0.006, DE: 0.006, MD: 0.006,
  VA: 0.006, TN: 0.006, IA: 0.007,
};

export function getRentRatio(abbr: string): number {
  return rentToPriceRatio[abbr] ?? 0.006;
}

// YoY price change category
const hotMarkets = ["FL", "TX", "AZ", "NC", "SC", "GA", "TN", "ID", "NV", "UT"];
const coolingMarkets = ["CA", "CO", "WA", "OR", "HI", "MA", "CT"];

export function getYoYChange(abbr: string): { pct: number; label: string } {
  if (hotMarkets.includes(abbr)) {
    const pct = 3 + Math.round(Math.random() * 2 * 10) / 10;
    return { pct, label: "Hot Market" };
  }
  if (coolingMarkets.includes(abbr)) {
    const pct = Math.round(Math.random() * 1 * 10) / 10;
    return { pct, label: "Cooling Market" };
  }
  const pct = 1 + Math.round(Math.random() * 1 * 10) / 10;
  return { pct, label: "Stable Market" };
}

// Extra state market data
export interface StateMarketExtras {
  population: string;
  medianHouseholdIncome: number;
  costOfLivingIndex: number;
  top3Cities: string[];
  medianDaysOnMarket: number;
  inventoryLevel: "Low" | "Moderate" | "High";
}

const stateExtras: Record<string, StateMarketExtras> = {
  AL: { population: "5.1M", medianHouseholdIncome: 56200, costOfLivingIndex: 88, top3Cities: ["Birmingham", "Huntsville", "Mobile"], medianDaysOnMarket: 45, inventoryLevel: "Moderate" },
  AK: { population: "733K", medianHouseholdIncome: 77800, costOfLivingIndex: 127, top3Cities: ["Anchorage", "Fairbanks", "Juneau"], medianDaysOnMarket: 55, inventoryLevel: "Moderate" },
  AZ: { population: "7.4M", medianHouseholdIncome: 65900, costOfLivingIndex: 103, top3Cities: ["Phoenix", "Tucson", "Mesa"], medianDaysOnMarket: 32, inventoryLevel: "Low" },
  AR: { population: "3.0M", medianHouseholdIncome: 52100, costOfLivingIndex: 87, top3Cities: ["Little Rock", "Fayetteville", "Fort Smith"], medianDaysOnMarket: 48, inventoryLevel: "Moderate" },
  CA: { population: "39.0M", medianHouseholdIncome: 84900, costOfLivingIndex: 142, top3Cities: ["Los Angeles", "San Francisco", "San Diego"], medianDaysOnMarket: 28, inventoryLevel: "Low" },
  CO: { population: "5.8M", medianHouseholdIncome: 80200, costOfLivingIndex: 105, top3Cities: ["Denver", "Colorado Springs", "Aurora"], medianDaysOnMarket: 30, inventoryLevel: "Low" },
  CT: { population: "3.6M", medianHouseholdIncome: 79900, costOfLivingIndex: 111, top3Cities: ["Bridgeport", "New Haven", "Hartford"], medianDaysOnMarket: 38, inventoryLevel: "Low" },
  DE: { population: "1.0M", medianHouseholdIncome: 69100, costOfLivingIndex: 103, top3Cities: ["Wilmington", "Dover", "Newark"], medianDaysOnMarket: 40, inventoryLevel: "Moderate" },
  FL: { population: "22.6M", medianHouseholdIncome: 63100, costOfLivingIndex: 103, top3Cities: ["Miami", "Tampa", "Orlando"], medianDaysOnMarket: 35, inventoryLevel: "Low" },
  GA: { population: "11.0M", medianHouseholdIncome: 61200, costOfLivingIndex: 93, top3Cities: ["Atlanta", "Savannah", "Augusta"], medianDaysOnMarket: 38, inventoryLevel: "Moderate" },
  HI: { population: "1.4M", medianHouseholdIncome: 83200, costOfLivingIndex: 193, top3Cities: ["Honolulu", "Hilo", "Kailua"], medianDaysOnMarket: 42, inventoryLevel: "Low" },
  ID: { population: "1.9M", medianHouseholdIncome: 60900, costOfLivingIndex: 97, top3Cities: ["Boise", "Meridian", "Nampa"], medianDaysOnMarket: 33, inventoryLevel: "Low" },
  IL: { population: "12.5M", medianHouseholdIncome: 68400, costOfLivingIndex: 93, top3Cities: ["Chicago", "Aurora", "Naperville"], medianDaysOnMarket: 40, inventoryLevel: "Moderate" },
  IN: { population: "6.8M", medianHouseholdIncome: 58200, costOfLivingIndex: 90, top3Cities: ["Indianapolis", "Fort Wayne", "Evansville"], medianDaysOnMarket: 42, inventoryLevel: "Moderate" },
  IA: { population: "3.2M", medianHouseholdIncome: 60500, costOfLivingIndex: 90, top3Cities: ["Des Moines", "Cedar Rapids", "Davenport"], medianDaysOnMarket: 45, inventoryLevel: "Moderate" },
  KS: { population: "2.9M", medianHouseholdIncome: 59600, costOfLivingIndex: 89, top3Cities: ["Wichita", "Overland Park", "Kansas City"], medianDaysOnMarket: 42, inventoryLevel: "Moderate" },
  KY: { population: "4.5M", medianHouseholdIncome: 52200, costOfLivingIndex: 90, top3Cities: ["Louisville", "Lexington", "Bowling Green"], medianDaysOnMarket: 44, inventoryLevel: "Moderate" },
  LA: { population: "4.6M", medianHouseholdIncome: 51000, costOfLivingIndex: 91, top3Cities: ["New Orleans", "Baton Rouge", "Shreveport"], medianDaysOnMarket: 50, inventoryLevel: "High" },
  ME: { population: "1.4M", medianHouseholdIncome: 57900, costOfLivingIndex: 99, top3Cities: ["Portland", "Lewiston", "Bangor"], medianDaysOnMarket: 35, inventoryLevel: "Low" },
  MD: { population: "6.2M", medianHouseholdIncome: 87100, costOfLivingIndex: 113, top3Cities: ["Baltimore", "Columbia", "Silver Spring"], medianDaysOnMarket: 32, inventoryLevel: "Low" },
  MA: { population: "7.0M", medianHouseholdIncome: 84400, costOfLivingIndex: 131, top3Cities: ["Boston", "Worcester", "Springfield"], medianDaysOnMarket: 25, inventoryLevel: "Low" },
  MI: { population: "10.0M", medianHouseholdIncome: 59200, costOfLivingIndex: 90, top3Cities: ["Detroit", "Grand Rapids", "Ann Arbor"], medianDaysOnMarket: 40, inventoryLevel: "Moderate" },
  MN: { population: "5.7M", medianHouseholdIncome: 73400, costOfLivingIndex: 98, top3Cities: ["Minneapolis", "St. Paul", "Rochester"], medianDaysOnMarket: 35, inventoryLevel: "Low" },
  MS: { population: "2.9M", medianHouseholdIncome: 46500, costOfLivingIndex: 84, top3Cities: ["Jackson", "Gulfport", "Hattiesburg"], medianDaysOnMarket: 55, inventoryLevel: "High" },
  MO: { population: "6.2M", medianHouseholdIncome: 57200, costOfLivingIndex: 89, top3Cities: ["Kansas City", "St. Louis", "Springfield"], medianDaysOnMarket: 42, inventoryLevel: "Moderate" },
  MT: { population: "1.1M", medianHouseholdIncome: 56500, costOfLivingIndex: 100, top3Cities: ["Billings", "Missoula", "Great Falls"], medianDaysOnMarket: 45, inventoryLevel: "Moderate" },
  NE: { population: "2.0M", medianHouseholdIncome: 63200, costOfLivingIndex: 92, top3Cities: ["Omaha", "Lincoln", "Bellevue"], medianDaysOnMarket: 40, inventoryLevel: "Moderate" },
  NV: { population: "3.2M", medianHouseholdIncome: 63200, costOfLivingIndex: 104, top3Cities: ["Las Vegas", "Henderson", "Reno"], medianDaysOnMarket: 35, inventoryLevel: "Low" },
  NH: { population: "1.4M", medianHouseholdIncome: 76800, costOfLivingIndex: 106, top3Cities: ["Manchester", "Nashua", "Concord"], medianDaysOnMarket: 28, inventoryLevel: "Low" },
  NJ: { population: "9.3M", medianHouseholdIncome: 85200, costOfLivingIndex: 115, top3Cities: ["Newark", "Jersey City", "Trenton"], medianDaysOnMarket: 32, inventoryLevel: "Low" },
  NM: { population: "2.1M", medianHouseholdIncome: 53000, costOfLivingIndex: 93, top3Cities: ["Albuquerque", "Santa Fe", "Las Cruces"], medianDaysOnMarket: 48, inventoryLevel: "Moderate" },
  NY: { population: "19.5M", medianHouseholdIncome: 71100, costOfLivingIndex: 126, top3Cities: ["New York City", "Buffalo", "Rochester"], medianDaysOnMarket: 38, inventoryLevel: "Low" },
  NC: { population: "10.7M", medianHouseholdIncome: 57300, costOfLivingIndex: 96, top3Cities: ["Charlotte", "Raleigh", "Durham"], medianDaysOnMarket: 33, inventoryLevel: "Low" },
  ND: { population: "780K", medianHouseholdIncome: 64800, costOfLivingIndex: 93, top3Cities: ["Fargo", "Bismarck", "Grand Forks"], medianDaysOnMarket: 50, inventoryLevel: "High" },
  OH: { population: "11.8M", medianHouseholdIncome: 56600, costOfLivingIndex: 90, top3Cities: ["Columbus", "Cleveland", "Cincinnati"], medianDaysOnMarket: 38, inventoryLevel: "Moderate" },
  OK: { population: "4.0M", medianHouseholdIncome: 54000, costOfLivingIndex: 87, top3Cities: ["Oklahoma City", "Tulsa", "Norman"], medianDaysOnMarket: 45, inventoryLevel: "Moderate" },
  OR: { population: "4.2M", medianHouseholdIncome: 65600, costOfLivingIndex: 113, top3Cities: ["Portland", "Salem", "Eugene"], medianDaysOnMarket: 35, inventoryLevel: "Moderate" },
  PA: { population: "13.0M", medianHouseholdIncome: 63600, costOfLivingIndex: 97, top3Cities: ["Philadelphia", "Pittsburgh", "Allentown"], medianDaysOnMarket: 38, inventoryLevel: "Moderate" },
  RI: { population: "1.1M", medianHouseholdIncome: 67100, costOfLivingIndex: 107, top3Cities: ["Providence", "Cranston", "Warwick"], medianDaysOnMarket: 30, inventoryLevel: "Low" },
  SC: { population: "5.3M", medianHouseholdIncome: 56100, costOfLivingIndex: 93, top3Cities: ["Charleston", "Columbia", "Greenville"], medianDaysOnMarket: 38, inventoryLevel: "Moderate" },
  SD: { population: "900K", medianHouseholdIncome: 59500, costOfLivingIndex: 93, top3Cities: ["Sioux Falls", "Rapid City", "Aberdeen"], medianDaysOnMarket: 48, inventoryLevel: "Moderate" },
  TN: { population: "7.1M", medianHouseholdIncome: 56000, costOfLivingIndex: 90, top3Cities: ["Nashville", "Memphis", "Knoxville"], medianDaysOnMarket: 35, inventoryLevel: "Low" },
  TX: { population: "30.5M", medianHouseholdIncome: 64000, costOfLivingIndex: 93, top3Cities: ["Houston", "Dallas", "Austin"], medianDaysOnMarket: 38, inventoryLevel: "Moderate" },
  UT: { population: "3.4M", medianHouseholdIncome: 74800, costOfLivingIndex: 101, top3Cities: ["Salt Lake City", "Provo", "Ogden"], medianDaysOnMarket: 32, inventoryLevel: "Low" },
  VT: { population: "647K", medianHouseholdIncome: 61400, costOfLivingIndex: 108, top3Cities: ["Burlington", "South Burlington", "Rutland"], medianDaysOnMarket: 35, inventoryLevel: "Low" },
  VA: { population: "8.6M", medianHouseholdIncome: 76400, costOfLivingIndex: 104, top3Cities: ["Virginia Beach", "Richmond", "Arlington"], medianDaysOnMarket: 30, inventoryLevel: "Low" },
  WA: { population: "7.8M", medianHouseholdIncome: 78700, costOfLivingIndex: 110, top3Cities: ["Seattle", "Spokane", "Tacoma"], medianDaysOnMarket: 28, inventoryLevel: "Low" },
  WV: { population: "1.8M", medianHouseholdIncome: 46700, costOfLivingIndex: 84, top3Cities: ["Charleston", "Huntington", "Morgantown"], medianDaysOnMarket: 58, inventoryLevel: "High" },
  WI: { population: "5.9M", medianHouseholdIncome: 63300, costOfLivingIndex: 93, top3Cities: ["Milwaukee", "Madison", "Green Bay"], medianDaysOnMarket: 38, inventoryLevel: "Moderate" },
  WY: { population: "577K", medianHouseholdIncome: 65000, costOfLivingIndex: 96, top3Cities: ["Cheyenne", "Casper", "Laramie"], medianDaysOnMarket: 52, inventoryLevel: "Moderate" },
  DC: { population: "690K", medianHouseholdIncome: 90100, costOfLivingIndex: 152, top3Cities: ["Georgetown", "Capitol Hill", "Dupont Circle"], medianDaysOnMarket: 28, inventoryLevel: "Low" },
};

export function getStateExtras(abbr: string): StateMarketExtras {
  return stateExtras[abbr] ?? {
    population: "N/A", medianHouseholdIncome: 60000, costOfLivingIndex: 100,
    top3Cities: [], medianDaysOnMarket: 40, inventoryLevel: "Moderate" as const,
  };
}

// First-time buyer programs per state
export interface BuyerProgram {
  name: string;
  description: string;
  eligibility: string;
}

const ftbPrograms: Record<string, BuyerProgram[]> = {
  CA: [
    { name: "CalHFA Dream For All", description: "Shared appreciation loan covering up to 20% of home price for down payment & closing costs.", eligibility: "First-time buyers, income limits apply, owner-occupied." },
    { name: "CalHFA MyHome Assistance", description: "Deferred-payment junior loan up to 3.5% of purchase price.", eligibility: "First-time buyers purchasing in California." },
  ],
  TX: [
    { name: "TDHCA My First Texas Home", description: "30-year fixed-rate mortgage with down payment assistance up to 5%.", eligibility: "First-time buyers or those who haven't owned in 3 years, income limits." },
    { name: "My Choice Texas Home", description: "Similar to My First Texas Home but not limited to first-time buyers.", eligibility: "All buyers meeting income and purchase price limits." },
  ],
  FL: [
    { name: "Florida Hometown Heroes", description: "Up to $35,000 in down payment and closing cost assistance as 0% interest loan.", eligibility: "Full-time workers in over 50 professions, first-time buyers." },
    { name: "FL Assist", description: "$10,000 second mortgage at 0% interest, deferred.", eligibility: "Used with FL Housing first mortgage, income limits." },
  ],
  NY: [
    { name: "SONYMA Achieving the Dream", description: "Low-interest rate mortgages for first-time buyers with down payment assistance.", eligibility: "First-time buyers, income limits by region." },
  ],
  GA: [
    { name: "Georgia Dream Homeownership", description: "Affordable mortgages plus up to $10,000 in down payment assistance.", eligibility: "First-time buyers, income below $80,000." },
  ],
  OH: [
    { name: "OHFA First-Time Homebuyer", description: "Below-market rate 30-year mortgage with 2.5% or 5% down payment assistance.", eligibility: "First-time buyers or buying in target area, income limits." },
  ],
  NC: [
    { name: "NC Home Advantage Mortgage", description: "Down payment assistance up to 3% of loan as a forgivable second mortgage.", eligibility: "First-time and move-up buyers, income limits." },
  ],
  PA: [
    { name: "PHFA Keystone Home Loan", description: "Below-market interest rate with down payment and closing cost assistance.", eligibility: "First-time buyers, income and purchase price limits." },
  ],
  AZ: [
    { name: "Home Plus Program", description: "Up to 5% down payment assistance as a forgivable second mortgage.", eligibility: "First-time and repeat buyers, income limits vary by county." },
  ],
  CO: [
    { name: "CHFA SmartStep", description: "Second mortgage for down payment assistance at favorable terms.", eligibility: "First-time buyers meeting income and purchase price limits." },
  ],
};

export function getBuyerPrograms(abbr: string): BuyerProgram[] {
  return ftbPrograms[abbr] ?? [];
}

// Parse user input to identify state(s)
export interface ParsedLocation {
  stateAbbr: string;
  inputCity?: string;
  isSpecificAddress: boolean;
}

export function parseLocationInput(input: string): ParsedLocation | null {
  const trimmed = input.trim();

  // Check for ZIP code
  const zipMatch = trimmed.match(/\b(\d{5})\b/);
  if (zipMatch) {
    const st = zipToState(zipMatch[1]);
    if (st) {
      const isAddr = /\d+\s+[A-Za-z]/.test(trimmed);
      const cityMatch = trimmed.match(/([A-Za-z\s]+),\s*[A-Z]{2}/i);
      return { stateAbbr: st, inputCity: cityMatch?.[1]?.trim(), isSpecificAddress: isAddr };
    }
  }

  // Check for state abbreviation (2 uppercase letters)
  const abbrMatch = trimmed.match(/\b([A-Z]{2})\b/);
  if (abbrMatch) {
    const sd = getStateByAbbreviation(abbrMatch[1]);
    if (sd) {
      const isAddr = /\d+\s+[A-Za-z]/.test(trimmed);
      const parts = trimmed.split(",").map(s => s.trim());
      const city = parts.length > 1 ? parts[0].replace(/^\d+\s+.*?(St|Street|Ave|Avenue|Blvd|Dr|Drive|Ln|Rd|Way|Ct|Pl|Cir)\b.*$/i, "").trim() : undefined;
      const cleanCity = city && city.match(/^\d/) ? undefined : city;
      return { stateAbbr: sd.abbreviation, inputCity: cleanCity, isSpecificAddress: /\d+\s+[A-Za-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Way|Ct|Court|Pl|Place|Cir|Circle)/i.test(trimmed) };
    }
  }

  // Check for full state name
  for (const s of statesData) {
    if (trimmed.toLowerCase().includes(s.name.toLowerCase())) {
      const isAddr = /\d+\s+[A-Za-z]+\s+(St|Street|Ave|Avenue|Blvd|Dr|Drive|Ln|Rd|Way|Ct|Pl|Cir)/i.test(trimmed);
      return { stateAbbr: s.abbreviation, inputCity: undefined, isSpecificAddress: isAddr };
    }
  }

  // Check for known city names from extras
  const lower = trimmed.toLowerCase();
  for (const [abbr, extras] of Object.entries(stateExtras)) {
    for (const city of extras.top3Cities) {
      if (lower.includes(city.toLowerCase())) {
        return { stateAbbr: abbr, inputCity: city, isSpecificAddress: false };
      }
    }
  }

  return null;
}

// Parse comparison input
export function parseCompareInput(input: string): [ParsedLocation, ParsedLocation] | null {
  const compareMatch = input.match(/compare\s+(.+?)\s+vs\.?\s+(.+)/i);
  if (!compareMatch) return null;
  const loc1 = parseLocationInput(compareMatch[1]);
  const loc2 = parseLocationInput(compareMatch[2]);
  if (loc1 && loc2) return [loc1, loc2];
  return null;
}


// Generate full analysis data for a state
export interface StateAnalysis {
  stateAbbr: string;
  stateName: string;
  medianHomePrice: number;
  propertyTaxRate: number;
  closingCostPct: number;
  avgMortgageRate: number;
  avgHomeInsurance: number;
  yoyChange: { pct: number; label: string };
  extras: StateMarketExtras;
  rentRatio: number;
  monthlyRent: number;
  grossYield: number;
  capRate: number;
  cashOnCashReturn: number;
  monthlyPayment: number;
  minIncomeRequired: number;
  fhaDownPayment: number;
  conventionalDown5: number;
  conventionalDown20: number;
  closingCosts: number;
  annualPropertyTax: number;
  buyerPrograms: BuyerProgram[];
  investmentVerdict: { label: string; color: "green" | "yellow" | "orange" };
}

export function analyzeState(abbr: string): StateAnalysis | null {
  const sd = getStateByAbbreviation(abbr);
  if (!sd) return null;

  const price = sd.medianHomePrice;
  const taxRate = sd.avgPropertyTax / 100;
  const closingPct = sd.avgClosingCost / 100;
  const rate = sd.avgMortgageRate / 100;
  const insurance = sd.avgHomeInsurance;

  // Monthly mortgage P&I (30yr fixed, 20% down)
  const loanAmount = price * 0.8;
  const monthlyRate = rate / 12;
  const numPayments = 360;
  const pi = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const monthlyTax = (price * taxRate) / 12;
  const monthlyIns = insurance / 12;
  const monthlyPayment = Math.round(pi + monthlyTax + monthlyIns);

  // Income required (31% front-end DTI)
  const minIncome = Math.round((monthlyPayment / 0.31) * 12);

  // Down payments
  const fhaDown = Math.round(price * 0.035);
  const conv5 = Math.round(price * 0.05);
  const conv20 = Math.round(price * 0.2);

  // Closing costs
  const closingCosts = Math.round(price * closingPct);

  // Investment
  const ratio = getRentRatio(abbr);
  const monthlyRent = Math.round(price * ratio);
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / price) * 100;
  const capRate = grossYield - 1.5;
  const downPayment = conv20;
  const annualCashFlow = annualRent - (pi + monthlyTax + monthlyIns) * 12;
  const cashOnCash = (annualCashFlow / downPayment) * 100;

  const annualPropTax = Math.round(price * taxRate);

  let investmentVerdict: StateAnalysis["investmentVerdict"];
  if (grossYield > 7) investmentVerdict = { label: "Strong Investment Market", color: "green" };
  else if (grossYield >= 5) investmentVerdict = { label: "Moderate Returns", color: "yellow" };
  else investmentVerdict = { label: "Appreciation Play", color: "orange" };

  const yoyChange = getYoYChange(abbr);
  const extras = getStateExtras(abbr);
  const buyerPrograms = getBuyerPrograms(abbr);

  return {
    stateAbbr: abbr, stateName: sd.name, medianHomePrice: price,
    propertyTaxRate: sd.avgPropertyTax, closingCostPct: sd.avgClosingCost,
    avgMortgageRate: sd.avgMortgageRate, avgHomeInsurance: insurance,
    yoyChange, extras, rentRatio: ratio, monthlyRent, grossYield: Math.round(grossYield * 10) / 10,
    capRate: Math.round(capRate * 10) / 10,
    cashOnCashReturn: Math.round(cashOnCash * 10) / 10,
    monthlyPayment, minIncomeRequired: minIncome,
    fhaDownPayment: fhaDown, conventionalDown5: conv5, conventionalDown20: conv20,
    closingCosts, annualPropertyTax: annualPropTax, buyerPrograms, investmentVerdict,
  };
}

