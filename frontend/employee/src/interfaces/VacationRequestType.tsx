import { DateItem } from "./index";

export type VacationRequest = {
  employee: string;
  id: number;
  date_items: DateItem[];
  status: string;
};
