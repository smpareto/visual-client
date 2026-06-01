import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { inventoryApi } from "@/services/api";

/**
 * Lightweight part lookup popup for the Engineering BOM tree.
 *
 * Given a partId (from a WO or MAT node), fetches the part's drawing info
 * and specifications from the Inventory API and shows them in a dialog —
 * so users don't have to leave the Engineering module to look up a part.
 *
 * Only surfaces the fields the user cares about: Drawing ID / Rev + Specs.
 *
 * The fetch + display lives in a keyed child (PartInfoContent) so each part
 * gets a fresh mount with loading state already true. This avoids resetting
 * state synchronously inside an effect (which triggers React's
 * "set-state-in-effect" warning and an extra render pass).
 */
export default function PartInfoDialog({ partId, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {partId && <PartInfoContent key={partId} partId={partId} />}
      </DialogContent>
    </Dialog>
  );
}

function PartInfoContent({ partId }) {
  // Starts in the loading state — no synchronous reset needed because the
  // parent keys this component by partId, so it remounts fresh per part.
  const [state, setState] = useState({
    part: null,
    specs: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [part, specs] = await Promise.all([
          inventoryApi.getPart(partId),
          // A part with no spec record returns null rather than throwing,
          // but guard anyway so a spec failure never blocks the drawing info.
          inventoryApi.getSpecifications(partId).catch(() => null),
        ]);
        if (!cancelled) setState({ part, specs, loading: false, error: null });
      } catch (err) {
        if (!cancelled)
          setState({
            part: null,
            specs: null,
            loading: false,
            error: err.message || "Failed to load part information",
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [partId]);

  const { part, specs, loading, error } = state;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{partId}</DialogTitle>
        <DialogDescription>
          {part?.description || (loading ? "Loading…" : "Part details")}
        </DialogDescription>
      </DialogHeader>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!error && (
        <div className="space-y-4 text-sm">
          {/* Drawing */}
          <div className="border rounded p-3 space-y-2">
            <h3 className="font-semibold">Drawing</h3>
            <Row label="Drawing ID" value={part?.drawingId} loading={loading} />
            <Row label="Revision" value={part?.drawingRev} loading={loading} />
          </div>

          {/* Specifications */}
          <div className="border rounded p-3 space-y-2">
            <h3 className="font-semibold">Specifications</h3>
            {loading ? (
              <div className="text-gray-500">Loading…</div>
            ) : specs ? (
              <p className="whitespace-pre-wrap text-gray-800 max-h-60 overflow-auto">
                {specs}
              </p>
            ) : (
              <div className="text-gray-400">No specifications on file.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, loading }) {
  return (
    <div className="flex">
      <span className="w-28 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900">{loading ? "…" : value || "—"}</span>
    </div>
  );
}
