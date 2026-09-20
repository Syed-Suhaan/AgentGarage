import SandboxDetail from "./sandbox-detail";

// Static export pre-renders the canonical demo sandbox. New sandbox IDs run
// fully client-side: judges navigate via Test-in-Sandbox / Run buttons and
// the detail fetches + polls the live API (see useSandbox). Direct-URL
// refresh on a brand-new ID 404s on static hosting — use in-app navigation.
export function generateStaticParams() {
  return [{ sandboxId: "sb_07" }];
}

export default function SandboxPage({
  params,
}: {
  params: { sandboxId: string };
}) {
  return <SandboxDetail sandboxId={params.sandboxId} />;
}
