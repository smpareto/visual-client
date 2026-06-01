import { useMemo, useState } from "react";
import BOMTreeNode from "./BOMTreeNode";
import PartInfoDialog from "./PartInfoDialog";

/** Walk the tree and return the maximum depth (0-based). */
function getMaxDepth(node, depth = 0) {
  if (!node.children || node.children.length === 0) return depth;
  return Math.max(...node.children.map((c) => getMaxDepth(c, depth + 1)));
}

export default function BOMTree({
  data,
  mode = "simplified",
  expandedDepth = 1,
  onExpandedDepthChange,
}) {
  const [selectedPartId, setSelectedPartId] = useState(null);
  const maxDepth = useMemo(() => (data ? getMaxDepth(data) : 0), [data]);

  const canDrillDown = expandedDepth <= maxDepth;
  const canCollapse = expandedDepth > 1;

  function drillDown() {
    if (canDrillDown) onExpandedDepthChange?.((d) => d + 1);
  }

  function collapse() {
    if (canCollapse) onExpandedDepthChange?.((d) => d - 1);
  }

  return (
    <div className="font-mono text-sm">
      {/* Toolbar row */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 border-b bg-slate-50">
        {/* Drill-down / collapse buttons */}
        <button
          onClick={() => canCollapse && collapse()}
          disabled={!canCollapse}
          className={`px-2 py-0.5 text-xs font-medium rounded border transition-colors ${
            canCollapse
              ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
          }`}
          title="Collapse one level"
        >
          ▲ Collapse
        </button>
        <button
          onClick={() => canDrillDown && drillDown()}
          disabled={!canDrillDown}
          className={`px-2 py-0.5 text-xs font-medium rounded border transition-colors ${
            canDrillDown
              ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
          }`}
          title="Drill down one level"
        >
          ▼ Drill Down
        </button>

        <span className="text-[10px] text-gray-400 tabular-nums ml-1">
          Level {expandedDepth} / {maxDepth + 1}
        </span>

        {/* Color legend — detailed mode only */}
        {mode === "detailed" && (
          <div className="flex items-center gap-4 ml-auto text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-600" />
              Operation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-600" />
              Non-manufactured part
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-600" />
              Work order
            </span>
          </div>
        )}
      </div>

      {/* Tree content */}
      <div className="py-1">
        <BOMTreeNode
          node={data}
          depth={0}
          mode={mode}
          expandedDepth={expandedDepth}
          onPartClick={setSelectedPartId}
        />
      </div>
      <PartInfoDialog
        partId={selectedPartId}
        open={!!selectedPartId}
        onOpenChange={(o) => !o && setSelectedPartId(null)}
      />
    </div>
  );
}
