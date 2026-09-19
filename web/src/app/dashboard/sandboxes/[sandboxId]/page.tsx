import SandboxDetail from "./sandbox-detail";

// Required for `output: 'export'` — pre-render known sandbox IDs
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
