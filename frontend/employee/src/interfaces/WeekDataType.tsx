import { Invoice } from "./index";

export type WeekData = {
    invoices: Invoice[];
    total: number;
};