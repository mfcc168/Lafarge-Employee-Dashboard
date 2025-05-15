export type Invoice = {
    number: string;
    customer: string;
    care_of: string;
    sample_customer: string | null;
    salesman: string;
    total_price: number;
    delivery_date: string;
    payment_date: string | null;
    items: string[];
  };