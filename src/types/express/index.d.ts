// src/types/express/index.d.ts

import { UserClaims } from "../../contracts/user-claims";

// to make the file a module and avoid the TypeScript error
export {}

declare global {
  namespace Express {
    export interface Request {
      user?: UserClaims;
    }
  }
}