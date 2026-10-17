/*
 * The logo's two squares on its 256 grid, traced from the icon: each is drawn with a cut where the other passes over
 * it, so they interlock like links of a chain (the first is in front at the top right, the second at the bottom left).
 */
export const logoStroke = 15;
/** The top left square, open at the bottom where the second square's left edge passes in front. */
export const logoFirst =
  "M121 150H133A17 17 0 0 0 150 133V72A17 17 0 0 0 133 55H72A17 17 0 0 0 55 72V133A17 17 0 0 0 72 150H91";
/** The bottom right square, open at the top where the first square's right edge passes in front. */
export const logoSecond =
  "M165 106H184A17 17 0 0 1 201 123V184A17 17 0 0 1 184 201H123A17 17 0 0 1 106 184V123A17 17 0 0 1 123 106H135";
/** What fills the first square's cut while the second square isn't there. */
export const logoFirstCut = "M91 150H121";
