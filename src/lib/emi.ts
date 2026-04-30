import { addMonths, format } from "date-fns";

export interface AmortizationRow {
  month: number;
  date: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
}

export function calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function buildAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date
): AmortizationRow[] {
  const emi = calculateEmi(principal, annualRate, tenureMonths);
  const r = annualRate / 12 / 100;
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const interestComponent = annualRate === 0 ? 0 : balance * r;
    const principalComponent = emi - interestComponent;
    balance = Math.max(0, balance - principalComponent);

    rows.push({
      month: i,
      date: format(addMonths(startDate, i - 1), "MMM yyyy"),
      emiAmount: emi,
      principalComponent,
      interestComponent,
      remainingBalance: balance,
    });
  }

  return rows;
}
