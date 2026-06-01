(() => {
const { STORAGE_KEY } = window.CardStudioDefaults;

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Draft load failed", error);
    return null;
  }
}

function saveStoredState(state) {
  const payload = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Draft save failed", error);
  }
  return payload.updatedAt;
}

function clearStoredState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Draft clear failed", error);
  }
}

window.CardStudioStorage = {
  loadStoredState,
  saveStoredState,
  clearStoredState,
};
})();
