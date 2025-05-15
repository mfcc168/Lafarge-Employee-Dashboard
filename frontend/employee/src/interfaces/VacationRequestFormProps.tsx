import { DateItem } from "./index";

export interface VacationRequestFormProps {
  dateItems: DateItem[];
  submitting: boolean;
  getTotalVacationDay: number;
  getVacationDayLeft?: number;
  addItem: () => void;
  updateItem: (index: number, updated: DateItem) => void;
  removeItem: (index: number) => void;
  handleSubmit: () => Promise<void>;
}