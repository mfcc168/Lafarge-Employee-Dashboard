// Short, bounded motion. theme.css enforces the reduced-motion preference globally.
export const durations = {
  instant: "0ms",
  fast: "100ms",
  normal: "140ms",
  panel: "180ms",
};
export const timingFunctions = { standard: "cubic-bezier(.2,.75,.25,1)" };
export const keyframes = {
  enter: {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};
export const animations = { enter: "enter 160ms cubic-bezier(.2,.75,.25,1)" };
export default { durations, timingFunctions, keyframes, animations };
