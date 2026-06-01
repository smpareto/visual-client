import { useState } from "react";

/**
 * Returns color classes based on nodeType for detailed mode.
 *   OP  → green  (operation)
 *   MAT → red    (non-manufactured part / raw material)
 *   WO  → blue   (work order / manufactured sub-assembly)
 */
function getNodeColorClasses(nodeType) {
  switch (nodeType) {
    case "OP":
      return "text-green-800 bg-green-50 hover:bg-green-100";
    case "MAT":
      return "text-red-800 bg-red-50 hover:bg-red-100";
    case "WO":
      return "text-blue-800 bg-blue-50 hover:bg-blue-100";
    default:
      return "hover:bg-blue-50";
  }
}

/**
 * Build the label JSX from separate fields.
 *
 * Simplified WO: "[C] 8113-314/26 - M28803 - TOP BEARING COVER"
 * Detailed WO:   "[C] 8113-314/26 - M28803 - TOP BEARING COVER"
 * Detailed OP:   description only (formattedDescription from server)
 * Detailed MAT:  "M28803 - TOP BEARING COVER" (partId bold)
 */
function buildLabel(node, isDetailed) {
  const nodeType = node.nodeType;

  // OP nodes — just show the description (e.g. "10 LASER [Laser Cutter]")
  if (isDetailed && nodeType === "OP") {
    return <span>{node.description}</span>;
  }

  // MAT nodes — "partId - description"
  if (isDetailed && nodeType === "MAT") {
    const parts = [];
    if (node.pieceNo != null) {
      parts.push(<span key="seq">{node.pieceNo} </span>);
    }
    if (node.partId) {
      parts.push(
        <span key="pid" className="font-bold">
          {node.partId}
        </span>,
      );
    }
    if (node.description && node.description !== "Unknown") {
      if (node.partId || node.pieceNo != null)
        parts.push(<span key="sep1"> - </span>);
      parts.push(<span key="desc">{node.description}</span>);
    }
    if (
      !node.partId &&
      (!node.description || node.description === "Unknown") &&
      node.pieceNo == null
    ) {
      parts.push(
        <span key="unk" className="italic text-gray-400">
          No part info
        </span>,
      );
    }
    return <>{parts}</>;
  }

  // WO nodes (both simplified and detailed)
  const parts = [];
  if (node.status) {
    parts.push(
      <span key="st" className="text-gray-500">
        {node.status}{" "}
      </span>,
    );
  }
  if (node.formattedId) {
    parts.push(<span key="fid">{node.formattedId}</span>);
  }
  if (node.partId) {
    parts.push(<span key="sep1"> - </span>);
    parts.push(
      <span key="pid" className="font-bold">
        {node.partId}
      </span>,
    );
  }
  if (node.description) {
    parts.push(<span key="sep2"> - </span>);
    parts.push(<span key="desc">{node.description}</span>);
  }
  return <>{parts}</>;
}

export default function BOMTreeNode({
  node,
  depth,
  mode = "simplified",
  expandedDepth = 1,
  onPartClick,
}) {
  // Track manual override + which expandedDepth it was set at.
  // If expandedDepth changes, the override is stale and ignored — no effect needed.
  const [toggle, setToggle] = useState({ value: null, atDepth: expandedDepth });

  const manualToggle = toggle.atDepth === expandedDepth ? toggle.value : null;

  const hasChildren = node.children && node.children.length > 0;
  const expanded = manualToggle !== null ? manualToggle : depth < expandedDepth;
  const indent = depth * 24;

  const isDetailed = mode === "detailed";
  const colorClasses = isDetailed
    ? getNodeColorClasses(node.nodeType)
    : "hover:bg-blue-50";

  // Only a non-empty, trimmed part ID can open the lookup dialog. Lines like
  // "90 - SSS M16-2.00 x 25mm Unbrako" (no part ID) and OP rows stay inert.
  const partId = node.partId?.trim();

  // Single click toggles expand/collapse for nodes with children.
  function handleClick() {
    if (hasChildren) {
      const current =
        manualToggle !== null ? manualToggle : depth < expandedDepth;
      setToggle({ value: !current, atDepth: expandedDepth });
    }
  }

  // Double click anywhere on the row opens the part lookup dialog.
  function handleDoubleClick() {
    if (partId) onPartClick?.(partId);
  }

  return (
    <div>
      {/* Node row */}
      <div
        className={`flex items-baseline cursor-pointer select-none ${colorClasses}
          ${node.selected ? "bg-blue-600 text-white" : ""}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={
          partId ? "Double-click to view specifications & drawing" : undefined
        }
      >
        {/* Left section — fixed width, indent lives inside */}
        <div
          className="flex items-baseline min-w-0"
          style={{ width: 800, flexShrink: 0, paddingLeft: `${indent + 8}px` }}
        >
          {/* Expand/collapse indicator */}
          <span className="w-4 shrink-0 text-gray-400 select-none">
            {hasChildren ? (expanded ? "▾" : "▸") : " "}
          </span>

          {/* Node type badge for detailed mode */}
          {isDetailed && node.nodeType && (
            <span
              className={`w-8 shrink-0 text-[10px] font-bold mr-1.5 text-center rounded px-0.5 ${
                node.nodeType === "OP"
                  ? "bg-green-200 text-green-800"
                  : node.nodeType === "MAT"
                    ? "bg-red-200 text-red-800"
                    : "bg-blue-200 text-blue-800"
              }`}
            >
              {node.nodeType}
            </span>
          )}

          {/* Label */}
          <span className="truncate">{buildLabel(node, isDetailed)}</span>
        </div>

        {/* Right section — data columns, always at same position */}
        <span className="w-16 text-right shrink-0 tabular-nums">
          {node.quantity != null ? node.quantity.toFixed(4) : ""}
        </span>

        <span className="w-24 text-right shrink-0 truncate text-gray-500 pl-2">
          {node.details || ""}
        </span>

        <span className="w-48 text-right shrink-0 text-gray-500 pl-2">
          {node.dateRange || ""}
        </span>
      </div>

      {/* Children — recursion */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <BOMTreeNode
              key={child.id || i}
              node={child}
              depth={depth + 1}
              mode={mode}
              expandedDepth={expandedDepth}
              onPartClick={onPartClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
