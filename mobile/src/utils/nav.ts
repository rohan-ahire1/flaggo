import { router } from "expo-router";

// router.back() is a no-op on web when there is no history entry to pop (e.g.
// the round was opened via a fresh navigation with nothing behind it). Fall back
// to a known route so close/back/done buttons always do something.
export function dismiss(fallback = "/") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as never);
}
