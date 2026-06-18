import { Link } from "react-router-dom";

export default function AppFooter() {
  return (
    <footer className="px-5 pb-6 pt-4 text-center text-xs font-bold text-flaggo-muted">
      <Link className="hover:text-flaggo-green" to="/privacy">Privacy</Link>
      <span className="mx-2">.</span>
      <Link className="hover:text-flaggo-green" to="/terms">Terms</Link>
      <span className="mx-2">.</span>
      <Link className="hover:text-flaggo-green" to="/refund">Refunds</Link>
    </footer>
  );
}
