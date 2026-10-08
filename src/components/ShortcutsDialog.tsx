import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUi } from "@/hooks/useAppData";
import { SHORTCUTS } from "@/lib/keyboard";
import { setHelpOpen } from "@/state/actions";
import { Kbd } from "./Controls";

export function ShortcutsDialog() {
  const { helpOpen } = useUi();
  const scopes = Array.from(new Set(SHORTCUTS.map((s) => s.scope)));
  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        {scopes.map((scope) => (
          <div key={scope}>
            <div className="label mb-1.5">{scope}</div>
            <div className="divide-y rounded-md border">
              {SHORTCUTS.filter((s) => s.scope === scope).map((s) => (
                <div key={s.label} className="flex items-center justify-between px-2.5 py-1.5 text-xs">
                  <span>{s.label}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Shortcuts are ignored while typing in a field.</p>
      </DialogContent>
    </Dialog>
  );
}
