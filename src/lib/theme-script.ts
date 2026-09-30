export const THEME_STORAGE_KEY = "impactlens-theme";

/** Runs before first paint (inlined in <head>) so the page never flashes the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var r=t==="light"||t==="dark"?t:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);}catch(e){}})()`;
