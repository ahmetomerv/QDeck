import { Archive, Copy, CopyPlus, Link2, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { copyGoogleUrl, copyQuery } from "@/lib/googleSearch";
import type { SearchQuery } from "@/lib/types";
import { deleteQuery, duplicateQuery, setQueryStatus } from "@/state/actions";

export function QueryMenu({ q, onEdit }: { q: SearchQuery; onEdit: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicateQuery(q.id)}>
          <CopyPlus /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyQuery(q.query)}>
          <Copy /> Copy query
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyGoogleUrl(q.query)}>
          <Link2 /> Copy Google URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {q.status === "active" ? (
          <DropdownMenuItem onClick={() => setQueryStatus(q.id, "paused")}>
            <Pause /> Pause
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => setQueryStatus(q.id, "active")}>
            <Play /> Activate
          </DropdownMenuItem>
        )}
        {q.status !== "archived" && (
          <DropdownMenuItem onClick={() => setQueryStatus(q.id, "archived")}>
            <Archive /> Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => deleteQuery(q.id)} className="text-destructive focus:text-destructive">
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
