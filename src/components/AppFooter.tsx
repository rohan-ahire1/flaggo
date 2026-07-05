import { Link } from "react-router-dom";

export default function AppFooter() {
  return (
    <footer className="px-5 pb-6 pt-4 text-center text-xs font-bold text-muted">
      <Link className="hover:text-primary" to="/privacy">Privacy</Link>
      <span className="mx-2">.</span>
      <Link className="hover:text-primary" to="/terms">Terms</Link>
    </footer>
  );
}
