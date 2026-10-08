import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DuplicateResult } from "@/lib/queryNormalizer";
import { QueryText } from "./QueryText";

export function DuplicateDialog({
  result,
  onSaveAnyway,
  onCancel,
}: {
  result: DuplicateResult | null;
  onSaveAnyway: () => void;
  onCancel: () => void;
}) {
  const navigate = useNavigate();
  const target = result?.exact ?? result?.similar[0];
  return (
    <Dialog open={!!result} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-st-due" />
            {result?.exact ? "This query already exists." : "A very similar query exists."}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {result?.exact ? "An identical query (ignoring whitespace and case) is already in your library." : "These queries share almost all of the same terms."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {(result?.exact ? [result.exact] : (result?.similar ?? [])).map((q) => (
            <div key={q.id} className="rounded-md border bg-muted/40 p-2.5">
              <div className="mb-1 text-xs font-medium">{q.name}</div>
              <QueryText query={q.query} />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {target && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onCancel();
                navigate({ to: "/queries", search: { focus: target.id } });
              }}
            >
              Open existing query
            </Button>
          )}
          <Button size="sm" onClick={onSaveAnyway}>
            Save anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
