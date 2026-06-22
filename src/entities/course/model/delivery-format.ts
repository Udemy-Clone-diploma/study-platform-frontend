export type DeliveryFormatType = "self_paced" | "scheduled" | "individual" | "group";
export type DeliveryStartType = "date" | "manual";
export type DeliveryUnlockMode = "immediate" | "date_based" | "sequential";

export type DeliveryFormatPricing = {
  id: number;
  price: string;
  currency: "USD" | "EUR" | "UAH";
  installment_count: number | null;
  installment_amount: string | null;
};

export type CourseDeliveryFormat = {
  id: number;
  format_type: DeliveryFormatType;
  // self_paced
  start_type: DeliveryStartType | null;
  course_start_date: string | null;
  access_duration_days: number | null;
  // scheduled / group
  start_date: string | null;
  enrollment_deadline: string | null;
  unlock_mode: DeliveryUnlockMode | null;
  // individual
  max_students: number | null;
  // nested pricing (null when no pricing plan set yet)
  pricing: DeliveryFormatPricing | null;
};

export type CourseDeliveryFormatPayload = {
  format_type: DeliveryFormatType;
  start_type?: DeliveryStartType | null;
  course_start_date?: string | null;
  access_duration_days?: number | null;
  start_date?: string | null;
  enrollment_deadline?: string | null;
  unlock_mode?: DeliveryUnlockMode | null;
  max_students?: number | null;
  pricing?: {
    price: string;
    currency: "USD" | "EUR" | "UAH";
    installment_count?: number | null;
    installment_amount?: string | null;
  } | null;
};
