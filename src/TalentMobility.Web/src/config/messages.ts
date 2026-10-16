/** User-facing copy for the web app (toasts, errors, empty states). API validation text comes from the backend. */
export const messages = {
  validation: {
    selectEmployee: "Select an employee.",
    selectCompetency: "Select a competency.",
    selectTechnology: "Select a technology.",
    selectSkillLevel: "Select a skill level.",
    notesTooLong: "Notes must be 1000 characters or fewer.",
  },
  api: {
    secureSessionFailed: "Unable to start a secure session.",
  },
  session: {
    expired: "Your session has expired. Please sign in again.",
  },
  toast: {
    assessmentAssigned: "Assessment assigned successfully.",
    assessmentSettingsSaved: "Assessment settings saved.",
    matchingWeightsUpdated: "Matching weights updated.",
    assessmentStartFailed: "Assessment could not be started.",
    assessmentSubmitFailed: "Assessment could not be submitted.",
    answerAllBeforeSubmit: (remaining: number) =>
      `Answer all questions before submitting. ${remaining} remaining.`,
  },
  errors: {
    genericTitle: "Something went wrong",
    genericDescription: "We could not load this page. Please try again.",
    tryAgain: "Try again",
  },
  boundary: {
    label: "Application error",
    title: "This page could not be displayed",
    description: "Reload the application to start a fresh session.",
    reload: "Reload application",
  },
  shell: {
    navigationFailed: "Navigation could not be loaded. Your current page is still available.",
  },
  theme: {
    providerRequired: "useTheme must be used inside ThemeProvider.",
  },
  pages: {
    assessmentUnavailable: {
      title: "Assessment unavailable",
      description: "This assessment may have been completed or is no longer available.",
    },
    resultUnavailable: {
      title: "Result unavailable",
      description: "This assessment result could not be loaded.",
    },
    profileUnavailable: { title: "Profile unavailable" },
    assessmentsUnavailable: { title: "Assessments unavailable" },
    attemptUnavailable: { title: "Attempt unavailable" },
    noAssessmentAttempts: {
      title: "No assessment attempts",
      description: "This employee has not started an assessment yet.",
    },
    noEmployeesFound: {
      title: "No employees found",
      description: "Try a different search term.",
    },
    noAuditActivity: {
      title: "No audit activity",
      description: "Recorded workspace actions will appear here.",
    },
    noAssignedTests: {
      title: "No assigned tests",
      description: "New manager-assigned assessments will appear here.",
    },
    noAssessmentHistory: {
      title: "No assessment history",
      description: "Completed and in-progress assessments will appear here.",
    },
  },
};
