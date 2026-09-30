export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startReanalyzeWorker } = await import("./lib/reanalyze");
  startReanalyzeWorker();
}
