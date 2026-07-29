export interface StateData {
  name: string;
  abbreviation: string;
  avgPropertyTax: number; // percentage
  avgHomeInsurance: number; // annual cost per $100k value
  avgClosingCost: number; // percentage of home price
  medianHomePrice: number;
  avgMortgageRate: number; // current 30-year fixed
  firstTimeBuyerPrograms: boolean;
}

export const statesData: StateData[] = [
  { name: "Alabama", abbreviation: "AL", avgPropertyTax: 0.41, avgHomeInsurance: 1800, avgClosingCost: 2.5, medianHomePrice: 225000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Alaska", abbreviation: "AK", avgPropertyTax: 1.19, avgHomeInsurance: 1200, avgClosingCost: 2.8, medianHomePrice: 350000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Arizona", abbreviation: "AZ", avgPropertyTax: 0.62, avgHomeInsurance: 1600, avgClosingCost: 2.6, medianHomePrice: 425000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Arkansas", abbreviation: "AR", avgPropertyTax: 0.61, avgHomeInsurance: 2200, avgClosingCost: 2.4, medianHomePrice: 195000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "California", abbreviation: "CA", avgPropertyTax: 0.74, avgHomeInsurance: 1800, avgClosingCost: 3.0, medianHomePrice: 785000, avgMortgageRate: 6.65, firstTimeBuyerPrograms: true },
  { name: "Colorado", abbreviation: "CO", avgPropertyTax: 0.51, avgHomeInsurance: 2800, avgClosingCost: 2.7, medianHomePrice: 545000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Connecticut", abbreviation: "CT", avgPropertyTax: 2.14, avgHomeInsurance: 1800, avgClosingCost: 2.9, medianHomePrice: 395000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Delaware", abbreviation: "DE", avgPropertyTax: 0.57, avgHomeInsurance: 900, avgClosingCost: 3.2, medianHomePrice: 355000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Florida", abbreviation: "FL", avgPropertyTax: 0.89, avgHomeInsurance: 4200, avgClosingCost: 2.8, medianHomePrice: 410000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Georgia", abbreviation: "GA", avgPropertyTax: 0.92, avgHomeInsurance: 2100, avgClosingCost: 2.5, medianHomePrice: 340000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Hawaii", abbreviation: "HI", avgPropertyTax: 0.28, avgHomeInsurance: 1200, avgClosingCost: 3.5, medianHomePrice: 895000, avgMortgageRate: 6.85, firstTimeBuyerPrograms: true },
  { name: "Idaho", abbreviation: "ID", avgPropertyTax: 0.69, avgHomeInsurance: 1400, avgClosingCost: 2.6, medianHomePrice: 445000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Illinois", abbreviation: "IL", avgPropertyTax: 2.27, avgHomeInsurance: 1500, avgClosingCost: 2.7, medianHomePrice: 265000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Indiana", abbreviation: "IN", avgPropertyTax: 0.85, avgHomeInsurance: 1400, avgClosingCost: 2.4, medianHomePrice: 235000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Iowa", abbreviation: "IA", avgPropertyTax: 1.57, avgHomeInsurance: 1600, avgClosingCost: 2.5, medianHomePrice: 210000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Kansas", abbreviation: "KS", avgPropertyTax: 1.41, avgHomeInsurance: 2400, avgClosingCost: 2.5, medianHomePrice: 225000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Kentucky", abbreviation: "KY", avgPropertyTax: 0.86, avgHomeInsurance: 1900, avgClosingCost: 2.4, medianHomePrice: 205000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Louisiana", abbreviation: "LA", avgPropertyTax: 0.55, avgHomeInsurance: 3500, avgClosingCost: 2.6, medianHomePrice: 195000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Maine", abbreviation: "ME", avgPropertyTax: 1.36, avgHomeInsurance: 1200, avgClosingCost: 2.8, medianHomePrice: 355000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Maryland", abbreviation: "MD", avgPropertyTax: 1.09, avgHomeInsurance: 1400, avgClosingCost: 3.0, medianHomePrice: 410000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Massachusetts", abbreviation: "MA", avgPropertyTax: 1.23, avgHomeInsurance: 1800, avgClosingCost: 2.9, medianHomePrice: 595000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Michigan", abbreviation: "MI", avgPropertyTax: 1.54, avgHomeInsurance: 1500, avgClosingCost: 2.6, medianHomePrice: 235000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Minnesota", abbreviation: "MN", avgPropertyTax: 1.12, avgHomeInsurance: 1800, avgClosingCost: 2.5, medianHomePrice: 335000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Mississippi", abbreviation: "MS", avgPropertyTax: 0.81, avgHomeInsurance: 2400, avgClosingCost: 2.4, medianHomePrice: 175000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Missouri", abbreviation: "MO", avgPropertyTax: 0.97, avgHomeInsurance: 1900, avgClosingCost: 2.5, medianHomePrice: 240000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Montana", abbreviation: "MT", avgPropertyTax: 0.84, avgHomeInsurance: 1600, avgClosingCost: 2.6, medianHomePrice: 455000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Nebraska", abbreviation: "NE", avgPropertyTax: 1.73, avgHomeInsurance: 2200, avgClosingCost: 2.5, medianHomePrice: 255000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Nevada", abbreviation: "NV", avgPropertyTax: 0.60, avgHomeInsurance: 1400, avgClosingCost: 2.8, medianHomePrice: 445000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "New Hampshire", abbreviation: "NH", avgPropertyTax: 2.18, avgHomeInsurance: 1200, avgClosingCost: 2.7, medianHomePrice: 465000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "New Jersey", abbreviation: "NJ", avgPropertyTax: 2.49, avgHomeInsurance: 1300, avgClosingCost: 2.9, medianHomePrice: 505000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "New Mexico", abbreviation: "NM", avgPropertyTax: 0.80, avgHomeInsurance: 1500, avgClosingCost: 2.5, medianHomePrice: 295000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "New York", abbreviation: "NY", avgPropertyTax: 1.72, avgHomeInsurance: 1600, avgClosingCost: 3.2, medianHomePrice: 435000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "North Carolina", abbreviation: "NC", avgPropertyTax: 0.84, avgHomeInsurance: 1800, avgClosingCost: 2.5, medianHomePrice: 335000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "North Dakota", abbreviation: "ND", avgPropertyTax: 0.98, avgHomeInsurance: 1800, avgClosingCost: 2.4, medianHomePrice: 265000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Ohio", abbreviation: "OH", avgPropertyTax: 1.56, avgHomeInsurance: 1200, avgClosingCost: 2.5, medianHomePrice: 215000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Oklahoma", abbreviation: "OK", avgPropertyTax: 0.90, avgHomeInsurance: 2600, avgClosingCost: 2.5, medianHomePrice: 195000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Oregon", abbreviation: "OR", avgPropertyTax: 0.97, avgHomeInsurance: 1200, avgClosingCost: 2.7, medianHomePrice: 485000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Pennsylvania", abbreviation: "PA", avgPropertyTax: 1.58, avgHomeInsurance: 1200, avgClosingCost: 2.8, medianHomePrice: 275000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Rhode Island", abbreviation: "RI", avgPropertyTax: 1.63, avgHomeInsurance: 2000, avgClosingCost: 2.7, medianHomePrice: 435000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "South Carolina", abbreviation: "SC", avgPropertyTax: 0.57, avgHomeInsurance: 2100, avgClosingCost: 2.5, medianHomePrice: 305000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "South Dakota", abbreviation: "SD", avgPropertyTax: 1.31, avgHomeInsurance: 2000, avgClosingCost: 2.4, medianHomePrice: 295000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Tennessee", abbreviation: "TN", avgPropertyTax: 0.71, avgHomeInsurance: 2000, avgClosingCost: 2.5, medianHomePrice: 345000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Texas", abbreviation: "TX", avgPropertyTax: 1.80, avgHomeInsurance: 3200, avgClosingCost: 2.6, medianHomePrice: 335000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Utah", abbreviation: "UT", avgPropertyTax: 0.63, avgHomeInsurance: 1200, avgClosingCost: 2.6, medianHomePrice: 505000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Vermont", abbreviation: "VT", avgPropertyTax: 1.90, avgHomeInsurance: 1100, avgClosingCost: 2.7, medianHomePrice: 365000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Virginia", abbreviation: "VA", avgPropertyTax: 0.82, avgHomeInsurance: 1400, avgClosingCost: 2.7, medianHomePrice: 395000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "Washington", abbreviation: "WA", avgPropertyTax: 0.98, avgHomeInsurance: 1400, avgClosingCost: 2.7, medianHomePrice: 585000, avgMortgageRate: 6.70, firstTimeBuyerPrograms: true },
  { name: "West Virginia", abbreviation: "WV", avgPropertyTax: 0.58, avgHomeInsurance: 1400, avgClosingCost: 2.5, medianHomePrice: 165000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
  { name: "Wisconsin", abbreviation: "WI", avgPropertyTax: 1.85, avgHomeInsurance: 1100, avgClosingCost: 2.6, medianHomePrice: 285000, avgMortgageRate: 6.75, firstTimeBuyerPrograms: true },
  { name: "Wyoming", abbreviation: "WY", avgPropertyTax: 0.61, avgHomeInsurance: 1400, avgClosingCost: 2.5, medianHomePrice: 335000, avgMortgageRate: 6.80, firstTimeBuyerPrograms: true },
];

export const getStateByAbbreviation = (abbr: string): StateData | undefined => {
  return statesData.find(state => state.abbreviation === abbr);
};

export const getStateByName = (name: string): StateData | undefined => {
  return statesData.find(state => state.name.toLowerCase() === name.toLowerCase());
};

export const US_STATES = statesData.map((s) => ({ value: s.abbreviation, label: s.name }));
