import { api } from "@/shared/api/base";
import type { Cart } from "../model/types";

const CART_ENDPOINT = "cart/";

export async function getCart(): Promise<Cart> {
  const { data } = await api.get<Cart>(CART_ENDPOINT);
  return data;
}

export async function addCartItem(courseId: number, pricingPlanId?: number): Promise<Cart> {
  const { data } = await api.post<Cart>(`${CART_ENDPOINT}items/`, {
    course_id: courseId,
    ...(pricingPlanId ? { pricing_plan_id: pricingPlanId } : {}),
  });
  return data;
}

export async function removeCartItem(courseId: number): Promise<Cart> {
  const { data } = await api.delete<Cart>(`${CART_ENDPOINT}items/${courseId}/`);
  return data;
}

export async function clearCart(): Promise<Cart> {
  const { data } = await api.delete<Cart>(`${CART_ENDPOINT}clear/`);
  return data;
}
