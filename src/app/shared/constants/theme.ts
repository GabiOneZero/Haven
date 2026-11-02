/**
 * Utility to access CSS variables defined in variables.scss
 */
export const Theme = {
  getVar: (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),

  // Helpers específicos para la paleta de la navbar
  colors: {
    get navBackground() { return Theme.getVar('--haven-nav-background'); },
    get iconUnselected() { return Theme.getVar('--haven-icon-unselected'); },
    get iconSelected() { return Theme.getVar('--haven-icon-selected'); },
    get highlightColor() { return Theme.getVar('--haven-highlight'); },
  },

  // Home page palette
  get scheduleCardBg() { return Theme.getVar('--haven-schedule-card-bg'); },
  get textPrimary() { return Theme.getVar('--haven-text-primary'); },
  get textSecondary() { return Theme.getVar('--haven-text-secondary'); },
  get eventLineGreen() { return Theme.getVar('--haven-event-line-green'); },
  get eventLinePurple() { return Theme.getVar('--haven-event-line-purple'); },
  get eventLineOrange() { return Theme.getVar('--haven-event-line-orange'); },
  get moodGabiBg() { return Theme.getVar('--haven-mood-gabi-bg'); },
  get moodAldaraBg() { return Theme.getVar('--haven-mood-aldara-bg'); },
  get dailyQuestionBg() { return Theme.getVar('--haven-daily-question-bg'); },
  get shoppingCardBg() { return Theme.getVar('--haven-shopping-card-bg'); },
  get decisionCardBg() { return Theme.getVar('--haven-decision-card-bg'); },
};
