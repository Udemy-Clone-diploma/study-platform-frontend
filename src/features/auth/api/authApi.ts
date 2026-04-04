import { request } from "@/shared/api/base";
import {
    LoginPayload,
    LoginResponse,
    RegisterPayload,
    RegisterResponse,
} from "../model/types";

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
    return request<RegisterResponse>("users/", {
        method: "POST",
        body: payload,
    });
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
    return request<LoginResponse>("auth/login/", {
        method: "POST",
        body: payload,
    });
}
 