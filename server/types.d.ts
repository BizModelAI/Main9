// Type declarations for modules that TypeScript can't find

declare module "express" {
  import express from "express";
  export = express;
  export as namespace express;
}

declare module "bcrypt" {
  export function hash(
    data: string | Buffer,
    saltOrRounds: string | number,
  ): Promise<string>;
  export function compare(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean>;
  export function hashSync(
    data: string | Buffer,
    saltOrRounds: string | number,
  ): string;
  export function compareSync(
    data: string | Buffer,
    encrypted: string,
  ): boolean;
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
}

declare module "express-session" {
  import session from "express-session";
  export = session;
  export as namespace session;

  interface SessionData {
    userId?: number;
    testValue?: string;
  }
}

declare module "memorystore" {
  function MemoryStore(session: any): any;
  export = MemoryStore;
}
