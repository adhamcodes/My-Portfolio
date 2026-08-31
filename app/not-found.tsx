import Link from "next/link";

export default function NotFound() {
  return (
    <main className="master-system-state">
      <div className="master-system-inner">
        <p className="master-system-label">404</p>
        <h1>That page is not here.</h1>
        <p>The portfolio may have changed, or the address may no longer exist.</p>
        <Link href="/">Return to the current frame</Link>
      </div>
    </main>
  );
}
