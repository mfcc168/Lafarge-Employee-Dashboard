export type ClientType = 'doctor' | 'nurse';

export type ReportEntry = {
  id?: string;
  date: string;
  time_range: string;
  doctor_name: string;
  district: string;
  client_type: ClientType;
  new_client: boolean;
  orders: string;
  samples: string;
  tel_orders: string;
  new_product_intro: string;
  old_product_followup: string;
  delivery_time_update: string;
  salesman_name: string;
}