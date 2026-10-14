import type { ID } from "./common";

export type UserRole = "user" | "admin";

export type SubscriptionPlan = "free" | "pro";

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  subscription: SubscriptionPlan;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
}
