import { addWeeks, addMonths, addQuarters, addYears } from "date-fns";

export function advanceDueDate(current: Date, billingCycle: string): Date {
  switch (billingCycle) {
    case "WEEKLY":
      return addWeeks(current, 1);
    case "QUARTERLY":
      return addQuarters(current, 1);
    case "YEARLY":
      return addYears(current, 1);
    default:
      return addMonths(current, 1);
  }
}
