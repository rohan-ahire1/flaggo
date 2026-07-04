import { useEffect } from "react";
import { Platform } from "react-native";

export default function PwaRegistration() {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.protocol === "file:") return;

    navigator.serviceWorker.register("/service-worker.js").catch(() => undefined);
  }, []);

  return null;
}
