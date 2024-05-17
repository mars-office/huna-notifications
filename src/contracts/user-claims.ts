export interface UserClaims {
  sub: string;
  email: string;
  aud: string;
  email_verified: boolean;
  name: string;
  isAdmin: boolean;
}