import { api } from "@/shared/api/base";
import type { CourseDeliveryFormat, CourseDeliveryFormatPayload } from "../model/delivery-format";

export async function getDeliveryFormats(slug: string): Promise<CourseDeliveryFormat[]> {
  const res = await api.get<CourseDeliveryFormat[]>(`/courses/${slug}/delivery-formats/`);
  return res.data;
}

export async function createDeliveryFormat(
  slug: string,
  payload: CourseDeliveryFormatPayload,
): Promise<CourseDeliveryFormat> {
  const res = await api.post<CourseDeliveryFormat>(`/courses/${slug}/delivery-formats/`, payload);
  return res.data;
}

export async function updateDeliveryFormat(
  slug: string,
  id: number,
  payload: Partial<CourseDeliveryFormatPayload>,
): Promise<CourseDeliveryFormat> {
  const res = await api.patch<CourseDeliveryFormat>(
    `/courses/${slug}/delivery-formats/${id}/`,
    payload,
  );
  return res.data;
}

export async function deleteDeliveryFormat(slug: string, id: number): Promise<void> {
  await api.delete(`/courses/${slug}/delivery-formats/${id}/`);
}
