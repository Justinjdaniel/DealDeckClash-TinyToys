export type HapticType = "tap" | "success" | "combo" | "error";

export const triggerHaptic = (type: HapticType) => {
  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.vibrate
  ) {
    try {
      switch (type) {
        case "tap":
          navigator.vibrate(10);
          break;
        case "success":
          navigator.vibrate([15, 30, 25]);
          break;
        case "combo":
        case "error":
          navigator.vibrate([40, 60, 40, 60, 80]);
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn("Haptic vibration failed or was ignored:", e);
    }
  }
};
