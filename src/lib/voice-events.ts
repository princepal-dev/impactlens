export const VOICE_EVENT = "impactlens:voice";

export function openVoiceAgent(listen = true) {
  window.dispatchEvent(new CustomEvent(VOICE_EVENT, { detail: { listen } }));
}
