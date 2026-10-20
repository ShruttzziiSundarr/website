import type { ComponentType } from "react";
import { LogicIllustration } from "./LogicIllustration";
import { AtelierIllustration } from "./AtelierIllustration";
import { CipherIllustration } from "./CipherIllustration";
import { NeuralIllustration } from "./NeuralIllustration";
import { HarborIllustration } from "./HarborIllustration";
import { SignalIllustration } from "./SignalIllustration";

/**
 * One looping illustration per district. To use a Rive or Lottie file instead, point the
 * district's entry at a component that renders the player; panels only care that it fills its box.
 */
export const districtIllustrations: Record<string, ComponentType> = {
  logic: LogicIllustration,
  atelier: AtelierIllustration,
  cipher: CipherIllustration,
  neural: NeuralIllustration,
  harbor: HarborIllustration,
  signal: SignalIllustration,
};
