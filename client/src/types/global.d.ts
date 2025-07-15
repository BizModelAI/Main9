declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    gravity?: number;
    drift?: number;
    scalar?: number;
    angle?: number;
    zIndex?: number;
  }

  function confetti(options?: ConfettiOptions): Promise<void>;
  export = confetti;
}
