// ============================================================================================
// FILE: frontend/src/utils/theme.js
// PART OF: Front end > Utils
// WHAT IT DOES: Night mode: saves each user's light/dark choice and puts it on the page (see index.css
//               for the colors).
// ============================================================================================
// NIGHT MODE (light / dark theme)
// Each user account has its own saved choice, so turning on night mode as the admin does not change the staff or the resident.
// The choice is kept in this browser (localStorage), under the id of the user.
// The theme itself is switched by one attribute on the <html> tag: data-theme="light" or data-theme="dark" (colors are in index.css).
const LAST = 'dormies-theme'        // the theme last shown in this browser, used by the login page of a new tab
const TAB = 'dormies-tab-theme'     // the theme of this tab (like the login session, every tab has its own)
const userKey = (userId) => `dormies-theme-user-${userId}`
const clean = (theme) => (theme === 'dark' ? 'dark' : 'light')

// the saved theme of one user, light if the user never chose one
export function getUserTheme(userId) {
  try { return clean(localStorage.getItem(userKey(userId))) } catch { return 'light' }
}

// show a theme on the page now (also remembered for this tab, so a refresh does not flash the other theme)
export function applyTheme(theme) {
  const value = clean(theme)
  document.documentElement.setAttribute('data-theme', value)
  try {
    sessionStorage.setItem(TAB, value)
    localStorage.setItem(LAST, value)
  } catch { /* private mode, the theme just will not be remembered */ }
}

// save the choice of one user (used by Settings > Appearance) and show it
export function saveUserTheme(userId, theme) {
  const value = clean(theme)
  try { localStorage.setItem(userKey(userId), value) } catch { /* not remembered */ }
  applyTheme(value)
}
