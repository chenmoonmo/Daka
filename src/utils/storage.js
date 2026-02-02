const PROJECTS_KEY = 'daka-projects';
const CHECKINS_KEY = 'daka-checkins';

export function loadProjects() {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadCheckins() {
  const raw = localStorage.getItem(CHECKINS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCheckins(checkins) {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins));
}
