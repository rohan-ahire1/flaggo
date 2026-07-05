export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 top-3 z-40 mx-auto max-w-md px-4">
      <div className="rounded-2xl bg-ink px-4 py-3 text-center text-sm font-display font-semibold text-white shadow-soft animate-fade-in">
        {message}
      </div>
    </div>
  );
}
