"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { automationTemplates } from "../data";
import { AutomationNode } from "../types";
import { ActionButton, PageHeader, SectionTitle, SurfaceCard, StatusBadge } from "../components/primitives";

const edges = [
  ["n1", "n2"],
  ["n2", "n3"],
  ["n2", "n4"],
  ["n5", "n6"],
  ["n6", "n7"],
  ["n6", "n8"],
  ["n9", "n10"],
  ["n10", "n11"],
  ["n10", "n12"],
];

function nodeStyles(kind: AutomationNode["kind"]) {
  if (kind === "trigger") return "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300";
  if (kind === "condition") return "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300";
}

export default function AutomationModule() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(automationTemplates[0]?.id ?? "");
  const [nodes, setNodes] = useState(automationTemplates[0]?.nodes ?? []);
  const dragging = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const selectedTemplate = useMemo(
    () => automationTemplates.find((template) => template.id === selectedTemplateId) ?? automationTemplates[0],
    [selectedTemplateId],
  );

  const canvasEdges = useMemo(
    () => edges.filter(([from]) => nodes.some((node) => node.id === from)),
    [nodes],
  );

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const { id, offsetX, offsetY } = dragging.current;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - offsetX;
    const y = event.clientY - rect.top - offsetY;
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, x, y } : node)));
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Workflow Orchestration"
        title="Automation Builder"
        description="Create no-code triggers, conditions, and actions for inbox routing, content follow-ups, and growth alerts. Nodes are draggable and template-driven."
        actions={
          <ActionButton tone="secondary">
            <Plus size={16} />
            New workflow
          </ActionButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SurfaceCard>
          <SectionTitle title="Templates" description="Launch a workflow from a proven operating pattern." />
          <div className="space-y-3">
            {automationTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  setNodes(template.nodes);
                }}
                className={`w-full rounded-[24px] border p-4 text-left transition ${selectedTemplateId === template.id ? "border-slate-950 bg-slate-50 dark:border-white dark:bg-slate-800/60" : "border-slate-200 bg-white hover:border-teal-300 dark:border-slate-800 dark:bg-slate-950/50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-950 dark:text-white">{template.name}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{template.description}</div>
                  </div>
                  <StatusBadge value={`${template.nodes.length} nodes`} />
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionTitle title={selectedTemplate?.name ?? "Workflow canvas"} description="Drag nodes to reshape the flow. Connections are rendered live." />
          <div
            className="relative h-[620px] overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_28%),linear-gradient(to_bottom,_rgba(248,250,252,0.85),_rgba(241,245,249,0.98))] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_28%),linear-gradient(to_bottom,_rgba(2,6,23,0.7),_rgba(15,23,42,0.96))]"
            onMouseMove={onMove}
            onMouseUp={() => {
              dragging.current = null;
            }}
            onMouseLeave={() => {
              dragging.current = null;
            }}
          >
            <svg className="absolute inset-0 h-full w-full">
              {canvasEdges.map(([from, to]) => {
                const source = nodes.find((node) => node.id === from);
                const target = nodes.find((node) => node.id === to);
                if (!source || !target) return null;
                const startX = source.x + 220;
                const startY = source.y + 42;
                const endX = target.x;
                const endY = target.y + 42;
                const path = `M ${startX} ${startY} C ${startX + 80} ${startY}, ${endX - 80} ${endY}, ${endX} ${endY}`;
                return <path key={`${from}-${to}`} d={path} fill="none" stroke="#14b8a6" strokeWidth="3" strokeOpacity="0.65" />;
              })}
            </svg>

            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute w-[220px] cursor-grab rounded-[24px] border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                style={{ left: node.x, top: node.y }}
                onMouseDown={(event) => {
                  const target = event.currentTarget.getBoundingClientRect();
                  dragging.current = {
                    id: node.id,
                    offsetX: event.clientX - target.left,
                    offsetY: event.clientY - target.top,
                  };
                }}
              >
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${nodeStyles(node.kind)}`}>
                  {node.kind}
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">{node.title}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{node.subtitle}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ActionButton>
              <Sparkles size={16} />
              Save workflow
            </ActionButton>
            <ActionButton tone="secondary">Run simulation</ActionButton>
            <ActionButton tone="secondary">Publish automation</ActionButton>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
