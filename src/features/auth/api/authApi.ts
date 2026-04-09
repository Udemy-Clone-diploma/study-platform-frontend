import { request } from "@/shared/api/base";
import {
    RegisterPayload,
    RegisterResponse,
} from "../model/types/register_types";

import { 
    LoginPayload, 
    LoginResponse, 
    TokenRefreshResponse
} from "../model/types/login_types";
import { UserData } from "../model/types/user_data";
import { UserProfile } from "../model/types/profiles_types";


export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
    return request<RegisterResponse>("auth/register/", {
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

export async function refreshToken(refresh: string): Promise<TokenRefreshResponse> {
    return request<TokenRefreshResponse>("auth/refresh/", {
        method: "POST",
        body: { refresh },
    });
}
 

export async function getMe(): Promise<UserData> { 
    return request<UserData>("auth/me/", {
        method: "GET",
    })
 }

 export async function updateMe(data: Partial<UserData>): Promise<UserData> { 
    return request<UserData>("auth/me/", {
        method: "PATCH",
        body: data,
    })
 }

export async function updateMeProfile(data: UserProfile): Promise<UserData> { 
    return request<UserData>("auth/me/profile/", {
        method: "PATCH",
        body: data,
    })
 }