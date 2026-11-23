export interface GameInput {
  held: Set<string>;
  interact: boolean;
  flashlight: boolean;
  distract: boolean;
}

export interface HudState {
  stage: number;
  stamina: number;
  hearts: number;
  flashlight: boolean;
  distractions: number;
  hidden: boolean;
  alert: boolean;
  dizzy: boolean;
  prompt: string;
}

export interface GameBridge {
  input: GameInput;
  startStage: number;
  muted: boolean;
  onHud: (hud: HudState) => void;
  onDialogue: (speaker: string, text: string) => void;
  onCheckpoint: (stage: number) => void;
  onVictory: () => void;
  onFailure: () => void;
}