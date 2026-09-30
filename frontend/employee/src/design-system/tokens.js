// Programmatic counterparts for theme.css. All UI styling is compiled from theme.css.
export const grayscale = {
  50: "#FFFFFF",
  100: "#F3F4F8",
  200: "#D2D4DA",
  300: "#B3B5BD",
  400: "#9496A1",
  500: "#777986",
  600: "#5B5D6B",
  700: "#404252",
  800: "#282A3A",
  900: "#101223",
};
export const designTokens = {
  colors: {
    gray: grayscale,
    white: "#FFFFFF",
    primary: grayscale,
    secondary: grayscale,
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      display: ["Inter", "system-ui", "sans-serif"],
    },
  },
  spacing: {
    1: ".25rem",
    2: ".5rem",
    3: ".75rem",
    4: "1rem",
    6: "1.5rem",
    8: "2rem",
  },
  borderRadius: { md: "12px", lg: "18px", xl: "22px" },
  boxShadow: {
    soft: "7px 7px 18px #d2d4da75, -7px -7px 18px #ffffff",
    inner: "inset 2px 2px 5px #d2d4da70, inset -2px -2px 5px #ffffff",
  },
};
export const componentTokens = {
  button: { height: { sm: "44px", md: "44px", lg: "48px" } },
  input: { height: { md: "44px" } },
};
export default designTokens;
