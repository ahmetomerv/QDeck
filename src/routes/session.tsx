import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Controls";
import { SessionComplete, SessionRunner, SessionSetup } from "@/components/session";
import { useSearchSession } from "@/hooks/useAppData";

export const Route = createFileRoute("/session")({
  head: () => ({
    meta: [
      { title: "Search Session — QDECK" },
      { name: "description", content: "Work through a prioritized queue of Google job searches, one by one." },
      { property: "og:title", content: "Search Session — QDECK" },
      { property: "og:description", content: "Work through a prioritized queue of Google job searches, one by one." },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const session = useSearchSession();
  if (session?.completedAt) return <SessionComplete session={session} />;
  if (session) return <SessionRunner session={session} />;
  return (
    <>
      <PageHeader title="Search Session" sub="Pick what to cover, then work through the queue. Mark each search done after reviewing Google." />
      <SessionSetup />
    </>
  );
}
