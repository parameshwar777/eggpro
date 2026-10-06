// Splash plays once per app launch. Module memory covers in-app navigation;
// sessionStorage covers WebView/page reloads within the same launch (it is
// cleared when the app process is closed, so a fresh launch plays it again).
const KEY = "eggpro_splash_done";

const readSession = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

let memoryDone = false;

export const startupProgress = {
  get splashComplete() {
    return memoryDone || readSession();
  },
  set splashComplete(value: boolean) {
    memoryDone = value;
    try {
      if (value) sessionStorage.setItem(KEY, "1");
      else sessionStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  },
};
