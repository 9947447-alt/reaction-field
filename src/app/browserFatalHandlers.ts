type BrowserFatalCallback = () => void;

let activeCleanup: (() => void) | undefined;

export function installBrowserFatalHandlers(
  onFatal: BrowserFatalCallback,
): () => void {
  activeCleanup?.();

  let reported = false;
  const reportOnce = () => {
    if (reported) {
      return;
    }

    reported = true;
    onFatal();
  };
  const handleError = (event: ErrorEvent) => {
    event.preventDefault();
    reportOnce();
  };
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    reportOnce();
  };
  const detachFatalListeners = () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
  const attachFatalListeners = () => {
    detachFatalListeners();
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
  };
  const handlePageHide = () => detachFatalListeners();
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      attachFatalListeners();
    }
  };

  attachFatalListeners();
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);

  function cleanup() {
    detachFatalListeners();
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("pageshow", handlePageShow);
    if (activeCleanup === cleanup) {
      activeCleanup = undefined;
    }
  }
  activeCleanup = cleanup;
  return cleanup;
}
