// Type declarations for modules that TypeScript can't find

declare module "express" {
  export * from "@types/express";
}

declare module "express-session" {
  export * from "@types/express-session";
}

declare module "bcrypt" {
  export * from "@types/bcrypt";
}

declare module "memorystore" {
  function MemoryStore(session: any): any;
  export = MemoryStore;
}

// Extend express-session types properly
declare module "express-session" {
  interface SessionData {
    userId?: number;
    testValue?: string;
  }
}
