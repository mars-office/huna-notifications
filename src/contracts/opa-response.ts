import { UserClaims } from "./user-claims";

export interface OpaResponseResult {
  allow: boolean;
  user?: UserClaims;
  is_admin?: boolean;
}

export interface OpaResponse {
  result: OpaResponseResult;
}