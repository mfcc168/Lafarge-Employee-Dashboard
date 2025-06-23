import { ReportEntry } from "./index";

export interface ReportEntryFormProps {
  entries: ReportEntry[];
  submitting: boolean;
  submittingAll: boolean;
  deleting: boolean;
  isLoading: boolean;
  pagedDate: string;
  currentPage: number;
  sortedDates: string[];
  timeRangeSuggestions: string[];
  doctorNameSuggestions: string[];
  districtSuggestions: string[];
  getTelOrderSuggestions: (doctorName: string) => string[];
  setCurrentPage: (page: number) => void;
  handleChange: <T extends keyof ReportEntry>(
    index: number, 
    field: T, 
    value: ReportEntry[T]
  ) => void;
  handleSubmitEntry: (index: number) => Promise<void>;
  handleSubmitAllEntries: () => void;
  handleDelete: (index: number) => Promise<void>;
  addEmptyEntry: () => void;
}