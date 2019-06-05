/**
 * Shared dimensions between collective page's components
 */
export const Dimensions = {
  PADDING_X: [15, 30, null, null, 120],
  MAX_SECTION_WIDTH: 1700,
  HERO_FIXED_HEIGHT: 120,
};

/**
 * Durations for page animations
 */
export const AnimationsDurations = {
  HERO_COLLAPSE: 250,
};

/**
 * A map of unique identifiers for the sections of the page
 */
export const Sections = {
  CONTRIBUTE: 'contribute',
  CONVERSATIONS: 'conversations',
  BUDGET: 'budget',
  CONTRIBUTORS: 'contributors',
  ABOUT: 'about',
};

/** A list of all section names */
export const AllSectionsNames = Object.values(Sections);
