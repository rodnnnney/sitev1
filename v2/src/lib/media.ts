/** True when the device has real hover (not sticky touch hover). */
export const canHover = () =>
  window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
