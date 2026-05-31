<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { NButtonGroup, NButton, NTooltip, NModal } from "naive-ui";
import { Icon } from "@iconify/vue";
import type { Organization, Workspace, Tenant } from "@/types";
import { useAppStore } from "@/store";

interface TenancyGraphNode {
  id: string;
  name: string;
  slug: string;
  type: "organization" | "workspace" | "tenant";
  parentId?: string;
  childCount: number;
  description?: string;
}

interface TenancyGraphEdge {
  id: string;
  source: string;
  target: string;
}

type NodeGraphLayout = "layered" | "force" | "grid";

const props = defineProps<{
  organizations: Organization[];
  workspaces: Workspace[];
  tenants: Tenant[];
}>();

const appStore = useAppStore();
const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLDivElement>();
const layout = ref<NodeGraphLayout>("layered");
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const hoveredNode = ref<TenancyGraphNode | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });
const showTooltip = ref(false);
let draggedNodeId: string | null = null;
const customPositions = new Map<string, { x: number; y: number }>();

// Modal state
const showZoomModal = ref(false);
const modalCanvasRef = ref<HTMLCanvasElement>();
const modalContainerRef = ref<HTMLDivElement>();
const modalScale = ref(1);
const modalOffset = ref({ x: 0, y: 0 });
const isModalDragging = ref(false);
const modalDragStart = ref({ x: 0, y: 0 });
const modalHoveredNode = ref<TenancyGraphNode | null>(null);
const modalTooltipPos = ref({ x: 0, y: 0 });
const showModalTooltip = ref(false);
let modalDraggedNodeId: string | null = null;
const modalCustomPositions = new Map<string, { x: number; y: number }>();

// Node dimensions
const NODE_RADIUS_ORG = 50;
const NODE_RADIUS_WS = 45;
const NODE_RADIUS_TENANT = 35;
const NODE_SPACING_X = 160;
const NODE_SPACING_Y = 130;

// Colors
const colors = computed(() => ({
  orgBorder: "#f59e0b",
  wsBorder: "#3b82f6",
  tenantBorder: "#22c55e",
  nodeFill: appStore.isDarkMode ? "#1e293b" : "#ffffff",
  text: appStore.isDarkMode ? "#e5e7eb" : "#374151",
  textSecondary: appStore.isDarkMode ? "#9ca3af" : "#6b7280",
  edge: appStore.isDarkMode ? "#64748b" : "#94a3b8",
  edgeArrow: appStore.isDarkMode ? "#64748b" : "#94a3b8",
  background: appStore.isDarkMode ? "#0f172a" : "#f8fafc",
}));

// Build graph from data
const graphData = computed(() => {
  const nodes: TenancyGraphNode[] = [];
  const edges: TenancyGraphEdge[] = [];

  // Get unique organizations that have workspaces
  const orgIds = new Set(props.workspaces.map((w) => w.organizationId));
  const relevantOrgs = props.organizations.filter((o) => orgIds.has(o.id));

  // Add organization nodes
  relevantOrgs.forEach((org) => {
    const wsCount = props.workspaces.filter(
      (w) => w.organizationId === org.id,
    ).length;
    nodes.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: "organization",
      childCount: wsCount,
      description: org.description,
    });
  });

  // Add workspace nodes and org->ws edges
  props.workspaces.forEach((ws) => {
    const tenantCount = props.tenants.filter(
      (t) => t.workspaceId === ws.id,
    ).length;
    nodes.push({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      type: "workspace",
      parentId: ws.organizationId,
      childCount: tenantCount,
      description: ws.description,
    });

    edges.push({
      id: `${ws.organizationId}->${ws.id}`,
      source: ws.organizationId,
      target: ws.id,
    });
  });

  // Add tenant nodes and ws->tenant edges
  props.tenants.forEach((tenant) => {
    nodes.push({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      type: "tenant",
      parentId: tenant.workspaceId,
      childCount: 0,
      description: tenant.description,
    });

    edges.push({
      id: `${tenant.workspaceId}->${tenant.id}`,
      source: tenant.workspaceId,
      target: tenant.id,
    });
  });

  return { nodes, edges };
});

// Calculate node positions
function calculateNodePositions(
  container: HTMLDivElement | undefined,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const { nodes, edges } = graphData.value;

  if (nodes.length === 0) return positions;

  const orgNodes = nodes.filter((n) => n.type === "organization");
  const wsNodes = nodes.filter((n) => n.type === "workspace");
  const tenantNodes = nodes.filter((n) => n.type === "tenant");
  const canvasWidth = container?.clientWidth || 800;

  if (layout.value === "layered") {
    const WS_SPACING = NODE_SPACING_X * 0.9;
    const TENANT_SPACING = NODE_SPACING_X * 0.75;

    // Calculate width needed for each organization based on its workspaces and tenants
    const orgWidths: number[] = [];
    orgNodes.forEach((org) => {
      const orgWs = wsNodes.filter((ws) => ws.parentId === org.id);
      let maxWidth = NODE_SPACING_X;

      // Width based on workspaces
      const wsWidth = orgWs.length * WS_SPACING;
      maxWidth = Math.max(maxWidth, wsWidth);

      // Width based on tenants under each workspace
      orgWs.forEach((ws) => {
        const wsTenants = tenantNodes.filter((t) => t.parentId === ws.id);
        const tenantWidth = wsTenants.length * TENANT_SPACING;
        maxWidth = Math.max(maxWidth, tenantWidth);
      });

      orgWidths.push(maxWidth);
    });

    // Calculate total width and starting position
    const totalWidth = orgWidths.reduce((sum, w) => sum + w, 0);
    let currentX = (canvasWidth - totalWidth) / 2;

    // Layer 1: Position organizations
    orgNodes.forEach((node, i) => {
      const centerX = currentX + orgWidths[i] / 2;
      positions.set(node.id, {
        x: centerX,
        y: 80,
      });
      currentX += orgWidths[i];
    });

    // Layer 2: Position workspaces below their parent organization
    currentX = (canvasWidth - totalWidth) / 2;
    orgNodes.forEach((org, orgIndex) => {
      const orgWs = wsNodes.filter((ws) => ws.parentId === org.id);
      const orgCenterX = currentX + orgWidths[orgIndex] / 2;

      if (orgWs.length > 0) {
        const wsWidth = orgWs.length * WS_SPACING;
        const wsStartX = orgCenterX - wsWidth / 2 + WS_SPACING / 2;

        orgWs.forEach((ws, i) => {
          positions.set(ws.id, {
            x: wsStartX + i * WS_SPACING,
            y: 80 + NODE_SPACING_Y,
          });
        });
      }
      currentX += orgWidths[orgIndex];
    });

    // Layer 3: Position tenants below their parent workspace
    wsNodes.forEach((ws) => {
      const wsTenants = tenantNodes.filter((t) => t.parentId === ws.id);
      const wsPos = positions.get(ws.id);
      if (!wsPos || wsTenants.length === 0) return;

      const tenantWidth = wsTenants.length * TENANT_SPACING;
      const tenantStartX = wsPos.x - tenantWidth / 2 + TENANT_SPACING / 2;

      wsTenants.forEach((tenant, i) => {
        positions.set(tenant.id, {
          x: tenantStartX + i * TENANT_SPACING,
          y: 80 + NODE_SPACING_Y * 2,
        });
      });
    });
  } else if (layout.value === "force") {
    const canvasHeight = container?.clientHeight || 600;

    // Dynamic spacing constants
    const ORG_SPACING = Math.max(NODE_SPACING_X, 300);
    const WS_BASE_RADIUS = 180;
    const TENANT_BASE_RADIUS = 120;

    // Place organizations at top with more spacing
    const orgLayerWidth = orgNodes.length * ORG_SPACING;
    const orgStartX = (canvasWidth - orgLayerWidth) / 2 + ORG_SPACING / 2;

    orgNodes.forEach((node, i) => {
      positions.set(node.id, {
        x: orgStartX + i * ORG_SPACING,
        y: 100,
      });
    });

    // Place workspaces around organizations with dynamic radius
    orgNodes.forEach((org) => {
      const orgPos = positions.get(org.id)!;
      const orgWs = wsNodes.filter((ws) => ws.parentId === org.id);

      // Dynamic radius based on workspace count
      const wsRadius = Math.max(WS_BASE_RADIUS, orgWs.length * 60);

      orgWs.forEach((ws, i) => {
        const angle = (Math.PI * (i + 1)) / (orgWs.length + 1);
        positions.set(ws.id, {
          x: orgPos.x + wsRadius * Math.cos(angle - Math.PI / 2),
          y: orgPos.y + wsRadius * Math.sin(angle - Math.PI / 2) + 120,
        });
      });
    });

    // Place tenants around workspaces with dynamic radius
    wsNodes.forEach((ws) => {
      const wsPos = positions.get(ws.id);
      if (!wsPos) return;

      const wsTenants = tenantNodes.filter((t) => t.parentId === ws.id);
      // Dynamic radius based on tenant count
      const tenantRadius = Math.max(TENANT_BASE_RADIUS, wsTenants.length * 40);

      wsTenants.forEach((tenant, i) => {
        const angle = (2 * Math.PI * i) / Math.max(wsTenants.length, 1);
        positions.set(tenant.id, {
          x: wsPos.x + tenantRadius * Math.cos(angle),
          y: wsPos.y + tenantRadius * Math.sin(angle) + 60,
        });
      });
    });
  } else {
    // Grid layout with larger spacing
    const GRID_SPACING_X = 200;
    const GRID_SPACING_Y = 160;
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const startX = Math.max(
      100,
      (canvasWidth - (cols - 1) * GRID_SPACING_X) / 2,
    );

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.set(node.id, {
        x: startX + col * GRID_SPACING_X,
        y: 100 + row * GRID_SPACING_Y,
      });
    });
  }

  return positions;
}

function mergePositions(
  base: Map<string, { x: number; y: number }>,
  overrides: Map<string, { x: number; y: number }>,
): Map<string, { x: number; y: number }> {
  if (overrides.size === 0) return base;
  const result = new Map(base);
  overrides.forEach((pos, id) => result.set(id, pos));
  return result;
}

const nodePositions = computed(() =>
  calculateNodePositions(containerRef.value),
);
const modalNodePositions = computed(() =>
  calculateNodePositions(modalContainerRef.value),
);

function getNodeRadius(type: string): number {
  if (type === "organization") return NODE_RADIUS_ORG;
  if (type === "workspace") return NODE_RADIUS_WS;
  return NODE_RADIUS_TENANT;
}

function getNodeColor(type: string): string {
  if (type === "organization") return colors.value.orgBorder;
  if (type === "workspace") return colors.value.wsBorder;
  return colors.value.tenantBorder;
}

// Draw the graph
function drawGraph(
  canvas: HTMLCanvasElement | undefined,
  container: HTMLDivElement | undefined,
  positions: Map<string, { x: number; y: number }>,
  currentOffset: { x: number; y: number },
  currentScale: number,
  currentHoveredNode: TenancyGraphNode | null,
) {
  if (!canvas || !container) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = colors.value.background;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.save();
  ctx.translate(currentOffset.x, currentOffset.y);
  ctx.scale(currentScale, currentScale);

  const { nodes, edges } = graphData.value;

  // Draw edges
  edges.forEach((edge) => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    if (!sourcePos || !targetPos) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    const sourceRadius = getNodeRadius(sourceNode?.type || "tenant");
    const targetRadius = getNodeRadius(targetNode?.type || "tenant");

    ctx.beginPath();
    ctx.strokeStyle = colors.value.edge;
    ctx.lineWidth = 2;

    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;

    const startX = sourcePos.x + nx * sourceRadius;
    const startY = sourcePos.y + ny * sourceRadius;
    const endX = targetPos.x - nx * (targetRadius + 10);
    const endY = targetPos.y - ny * (targetRadius + 10);

    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrow
    const arrowSize = 8;
    const arrowAngle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.fillStyle = colors.value.edgeArrow;
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
      endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6),
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
      endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  });

  // Draw nodes
  nodes.forEach((node) => {
    const pos = positions.get(node.id);
    if (!pos) return;

    const isHovered = currentHoveredNode?.id === node.id;
    const radius = getNodeRadius(node.type);
    const borderColor = getNodeColor(node.type);

    // Node circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = colors.value.nodeFill;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isHovered ? 4 : 3;
    ctx.stroke();

    // Icon
    ctx.font = `${radius > 40 ? 18 : 14}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const icon =
      node.type === "organization"
        ? "🏢"
        : node.type === "workspace"
          ? "📁"
          : "👤";
    ctx.fillText(icon, pos.x, pos.y - 5);

    // Child count
    if (node.childCount > 0) {
      ctx.fillStyle = borderColor;
      ctx.font = "bold 10px Inter, sans-serif";
      const label = node.type === "organization" ? "workspaces" : "tenants";
      ctx.fillText(`${node.childCount} ${label}`, pos.x, pos.y + 12);
    }

    // Name below node
    ctx.fillStyle = colors.value.text;
    ctx.font = "bold 11px Inter, sans-serif";
    const name =
      node.name.length > 16 ? node.name.slice(0, 13) + "..." : node.name;
    ctx.fillText(name, pos.x, pos.y + radius + 15);

    // Type label
    ctx.fillStyle = borderColor;
    ctx.font = "8px Inter, sans-serif";
    const typeLabel = node.type.toUpperCase();
    ctx.fillText(typeLabel, pos.x, pos.y + radius + 28);
  });

  ctx.restore();
}

function draw() {
  drawGraph(
    canvasRef.value,
    containerRef.value,
    mergePositions(nodePositions.value, customPositions),
    offset.value,
    scale.value,
    hoveredNode.value,
  );
}

function drawModal() {
  drawGraph(
    modalCanvasRef.value,
    modalContainerRef.value,
    mergePositions(modalNodePositions.value, modalCustomPositions),
    modalOffset.value,
    modalScale.value,
    modalHoveredNode.value,
  );
}

// Mouse handlers
function handleMouseDown(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - offset.value.x) / scale.value;
  const y = (e.clientY - rect.top - offset.value.y) / scale.value;

  const positions = mergePositions(nodePositions.value, customPositions);
  let foundId: string | null = null;
  graphData.value.nodes.forEach((node) => {
    const pos = positions.get(node.id);
    if (pos) {
      const radius = getNodeRadius(node.type);
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= radius) {
        foundId = node.id;
      }
    }
  });

  if (foundId) {
    draggedNodeId = foundId;
    const pos = positions.get(foundId)!;
    dragStart.value = { x: x - pos.x, y: y - pos.y };
  } else {
    isDragging.value = true;
    dragStart.value = {
      x: e.clientX - offset.value.x,
      y: e.clientY - offset.value.y,
    };
  }
  if (canvasRef.value) canvasRef.value.style.cursor = "grabbing";
}

function handleMouseMove(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - offset.value.x) / scale.value;
  const y = (e.clientY - rect.top - offset.value.y) / scale.value;

  if (draggedNodeId) {
    customPositions.set(draggedNodeId, {
      x: x - dragStart.value.x,
      y: y - dragStart.value.y,
    });
    showTooltip.value = false;
    if (canvasRef.value) canvasRef.value.style.cursor = "grabbing";
    draw();
    return;
  }

  if (isDragging.value) {
    offset.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y,
    };
    showTooltip.value = false;
    if (canvasRef.value) canvasRef.value.style.cursor = "grabbing";
    draw();
  } else {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offset.value.x) / scale.value;
    const y = (e.clientY - rect.top - offset.value.y) / scale.value;

    const hoverPositions = mergePositions(nodePositions.value, customPositions);
    let found: TenancyGraphNode | null = null;
    graphData.value.nodes.forEach((node) => {
      const pos = hoverPositions.get(node.id);
      if (pos) {
        const radius = getNodeRadius(node.type);
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist <= radius) {
          found = node;
        }
      }
    });

    if (found !== hoveredNode.value) {
      hoveredNode.value = found;
      if (found) {
        tooltipPos.value = { x: e.clientX, y: e.clientY };
        showTooltip.value = true;
        if (canvasRef.value) canvasRef.value.style.cursor = "pointer";
      } else {
        showTooltip.value = false;
        if (canvasRef.value) canvasRef.value.style.cursor = "grab";
      }
      draw();
    } else if (found) {
      tooltipPos.value = { x: e.clientX, y: e.clientY };
      if (canvasRef.value) canvasRef.value.style.cursor = "pointer";
    } else {
      if (canvasRef.value) canvasRef.value.style.cursor = "grab";
    }
  }
}

function handleMouseUp() {
  isDragging.value = false;
  draggedNodeId = null;
  if (canvasRef.value)
    canvasRef.value.style.cursor = hoveredNode.value ? "pointer" : "grab";
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale.value = Math.max(0.3, Math.min(3, scale.value * delta));
  draw();
}

function zoomIn() {
  scale.value = Math.min(3, scale.value * 1.2);
  draw();
}

function zoomOut() {
  scale.value = Math.max(0.3, scale.value / 1.2);
  draw();
}

function handleMouseLeave() {
  isDragging.value = false;
  draggedNodeId = null;
  hoveredNode.value = null;
  showTooltip.value = false;
  if (canvasRef.value) canvasRef.value.style.cursor = "grab";
}

// Modal handlers
function handleModalMouseDown(e: MouseEvent) {
  const rect = modalCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - modalOffset.value.x) / modalScale.value;
  const y = (e.clientY - rect.top - modalOffset.value.y) / modalScale.value;

  const positions = mergePositions(
    modalNodePositions.value,
    modalCustomPositions,
  );
  let foundId: string | null = null;
  graphData.value.nodes.forEach((node) => {
    const pos = positions.get(node.id);
    if (pos) {
      const radius = getNodeRadius(node.type);
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= radius) {
        foundId = node.id;
      }
    }
  });

  if (foundId) {
    modalDraggedNodeId = foundId;
    const pos = positions.get(foundId)!;
    modalDragStart.value = { x: x - pos.x, y: y - pos.y };
  } else {
    isModalDragging.value = true;
    modalDragStart.value = {
      x: e.clientX - modalOffset.value.x,
      y: e.clientY - modalOffset.value.y,
    };
  }
  if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "grabbing";
}

function handleModalMouseMove(e: MouseEvent) {
  const rect = modalCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - modalOffset.value.x) / modalScale.value;
  const y = (e.clientY - rect.top - modalOffset.value.y) / modalScale.value;

  if (modalDraggedNodeId) {
    modalCustomPositions.set(modalDraggedNodeId, {
      x: x - modalDragStart.value.x,
      y: y - modalDragStart.value.y,
    });
    showModalTooltip.value = false;
    if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "grabbing";
    drawModal();
    return;
  }

  if (isModalDragging.value) {
    modalOffset.value = {
      x: e.clientX - modalDragStart.value.x,
      y: e.clientY - modalDragStart.value.y,
    };
    showModalTooltip.value = false;
    if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "grabbing";
    drawModal();
  } else {
    const modalHoverPositions = mergePositions(
      modalNodePositions.value,
      modalCustomPositions,
    );
    let found: TenancyGraphNode | null = null;
    graphData.value.nodes.forEach((node) => {
      const pos = modalHoverPositions.get(node.id);
      if (pos) {
        const radius = getNodeRadius(node.type);
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist <= radius) {
          found = node;
        }
      }
    });

    if (found !== modalHoveredNode.value) {
      modalHoveredNode.value = found;
      if (found) {
        modalTooltipPos.value = { x: e.clientX, y: e.clientY };
        showModalTooltip.value = true;
        if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "pointer";
      } else {
        showModalTooltip.value = false;
        if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "grab";
      }
      drawModal();
    } else if (found) {
      modalTooltipPos.value = { x: e.clientX, y: e.clientY };
      if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "pointer";
    } else {
      if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "grab";
    }
  }
}

function handleModalMouseUp() {
  isModalDragging.value = false;
  modalDraggedNodeId = null;
  if (modalCanvasRef.value)
    modalCanvasRef.value.style.cursor = modalHoveredNode.value
      ? "pointer"
      : "grab";
}

function handleModalWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  modalScale.value = Math.max(0.3, Math.min(3, modalScale.value * delta));
  drawModal();
}

function modalZoomIn() {
  modalScale.value = Math.min(3, modalScale.value * 1.2);
  drawModal();
}

function modalZoomOut() {
  modalScale.value = Math.max(0.3, modalScale.value / 1.2);
  drawModal();
}

function handleModalMouseLeave() {
  isModalDragging.value = false;
  modalDraggedNodeId = null;
  modalHoveredNode.value = null;
  showModalTooltip.value = false;
  if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = "grab";
}

function openZoomModal() {
  showZoomModal.value = true;
  modalScale.value = 1;
  modalOffset.value = { x: 0, y: 0 };
  modalHoveredNode.value = null;
  showModalTooltip.value = false;

  nextTick(() => {
    setTimeout(() => {
      drawModal();
    }, 100);
  });
}

function closeZoomModal() {
  showZoomModal.value = false;
}

function getParentName(node: TenancyGraphNode): string {
  if (node.type === "workspace") {
    const org = props.organizations.find((o) => o.id === node.parentId);
    return org?.name || "Unknown";
  }
  if (node.type === "tenant") {
    const ws = props.workspaces.find((w) => w.id === node.parentId);
    return ws?.name || "Unknown";
  }
  return "";
}

watch(
  [
    () => props.organizations,
    () => props.workspaces,
    () => props.tenants,
    layout,
  ],
  () => {
    customPositions.clear();
    modalCustomPositions.clear();
  },
);

watch(
  [
    () => props.organizations,
    () => props.workspaces,
    () => props.tenants,
    layout,
    () => appStore.isDarkMode,
  ],
  () => {
    requestAnimationFrame(draw);
    if (showZoomModal.value) {
      requestAnimationFrame(drawModal);
    }
  },
);

watch(showZoomModal, (visible) => {
  if (visible) {
    nextTick(() => {
      setTimeout(() => {
        drawModal();
      }, 100);
    });
  }
});

onMounted(() => {
  requestAnimationFrame(draw);
  window.addEventListener("resize", draw);
});

onUnmounted(() => {
  window.removeEventListener("resize", draw);
});
</script>

<template>
  <div class="node-graph-wrapper">
    <div class="layout-toolbar">
      <NButtonGroup size="small" class="layout-buttons">
        <NButton
          :type="layout === 'layered' ? 'primary' : 'default'"
          @click="layout = 'layered'"
        >
          Layered
        </NButton>
        <NButton
          :type="layout === 'force' ? 'primary' : 'default'"
          @click="layout = 'force'"
        >
          Radial
        </NButton>
        <NButton
          :type="layout === 'grid' ? 'primary' : 'default'"
          @click="layout = 'grid'"
        >
          Grid
        </NButton>
        <NTooltip placement="bottom">
          <template #trigger>
            <NButton @click="openZoomModal">
              <template #icon>
                <Icon icon="carbon:fit-to-screen" :width="14" :height="14" />
              </template>
            </NButton>
          </template>
          Expand to fullscreen
        </NTooltip>
      </NButtonGroup>
    </div>

    <div ref="containerRef" class="node-graph-container">
      <canvas
        ref="canvasRef"
        class="node-graph-canvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
        @wheel="handleWheel"
      />

      <!-- Node Tooltip -->
      <div
        v-if="showTooltip && hoveredNode"
        class="node-graph-tooltip"
        :class="{ 'light-tooltip': appStore.isDarkMode }"
        :style="{
          left: `${tooltipPos.x + 15}px`,
          top: `${tooltipPos.y + 15}px`,
        }"
      >
        <table class="tooltip-table">
          <tbody>
            <tr>
              <td class="tooltip-label">Type:</td>
              <td class="tooltip-value">
                {{
                  hoveredNode.type.charAt(0).toUpperCase() +
                    hoveredNode.type.slice(1)
                }}
              </td>
            </tr>
            <tr>
              <td class="tooltip-label">Name:</td>
              <td class="tooltip-value">{{ hoveredNode.name }}</td>
            </tr>
            <tr>
              <td class="tooltip-label">Slug:</td>
              <td class="tooltip-value">{{ hoveredNode.slug }}</td>
            </tr>
            <tr v-if="hoveredNode.type !== 'organization'">
              <td class="tooltip-label">Parent:</td>
              <td class="tooltip-value">{{ getParentName(hoveredNode) }}</td>
            </tr>
            <tr v-if="hoveredNode.description">
              <td class="tooltip-label">Description:</td>
              <td class="tooltip-value">{{ hoveredNode.description }}</td>
            </tr>
            <tr v-if="hoveredNode.childCount > 0">
              <td class="tooltip-label">
                {{
                  hoveredNode.type === "organization"
                    ? "Workspaces"
                    : "Tenants"
                }}:
              </td>
              <td class="tooltip-value">{{ hoveredNode.childCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="legend" :class="{ 'light-theme': appStore.isDarkMode }">
        <div class="legend-item">
          <span class="legend-color org-color" />
          <span>Organization</span>
        </div>
        <div class="legend-item">
          <span class="legend-color ws-color" />
          <span>Workspace</span>
        </div>
        <div class="legend-item">
          <span class="legend-color tenant-color" />
          <span>Tenant</span>
        </div>
      </div>

      <!-- Zoom controls -->
      <div
        class="zoom-controls"
        :class="{ 'light-theme': appStore.isDarkMode }"
      >
        <NTooltip>
          <template #trigger>
            <NButton quaternary size="small" @click="zoomIn">
              <template #icon>
                <Icon icon="carbon:zoom-in" />
              </template>
            </NButton>
          </template>
          Zoom In
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton quaternary size="small" @click="zoomOut">
              <template #icon>
                <Icon icon="carbon:zoom-out" />
              </template>
            </NButton>
          </template>
          Zoom Out
        </NTooltip>
      </div>
    </div>

    <!-- Zoom Modal -->
    <NModal
      v-model:show="showZoomModal"
      preset="card"
      class="node-graph-zoom-modal"
      :style="{ width: '95vw', height: '90vh', maxWidth: '1800px' }"
      :bordered="false"
      :closable="false"
      size="huge"
    >
      <template #header>
        <div class="modal-header">
          <div class="modal-title-section">
            <Icon icon="carbon:network-4" class="modal-title-icon" />
            <span class="modal-title">Workspace Hierarchy</span>
            <span class="modal-subtitle">Organizations → Workspaces → Tenants</span>
          </div>
          <div class="modal-actions">
            <NButtonGroup size="small" class="modal-layout-buttons">
              <NButton
                :type="layout === 'layered' ? 'primary' : 'default'"
                @click="layout = 'layered'"
              >
                Layered
              </NButton>
              <NButton
                :type="layout === 'force' ? 'primary' : 'default'"
                @click="layout = 'force'"
              >
                Radial
              </NButton>
              <NButton
                :type="layout === 'grid' ? 'primary' : 'default'"
                @click="layout = 'grid'"
              >
                Grid
              </NButton>
            </NButtonGroup>
            <NButton text class="close-btn" @click="closeZoomModal">
              <template #icon>
                <Icon icon="carbon:close" :width="20" :height="20" />
              </template>
            </NButton>
          </div>
        </div>
      </template>

      <div class="modal-content">
        <div ref="modalContainerRef" class="modal-graph-container">
          <canvas
            ref="modalCanvasRef"
            class="modal-graph-canvas"
            @mousedown="handleModalMouseDown"
            @mousemove="handleModalMouseMove"
            @mouseup="handleModalMouseUp"
            @mouseleave="handleModalMouseLeave"
            @wheel="handleModalWheel"
          />

          <div
            v-if="showModalTooltip && modalHoveredNode"
            class="node-graph-tooltip"
            :class="{ 'light-tooltip': appStore.isDarkMode }"
            :style="{
              left: `${modalTooltipPos.x + 15}px`,
              top: `${modalTooltipPos.y + 15}px`,
            }"
          >
            <table class="tooltip-table">
              <tbody>
                <tr>
                  <td class="tooltip-label">Type:</td>
                  <td class="tooltip-value">
                    {{
                      modalHoveredNode.type.charAt(0).toUpperCase() +
                        modalHoveredNode.type.slice(1)
                    }}
                  </td>
                </tr>
                <tr>
                  <td class="tooltip-label">Name:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.name }}</td>
                </tr>
                <tr>
                  <td class="tooltip-label">Slug:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.slug }}</td>
                </tr>
                <tr v-if="modalHoveredNode.type !== 'organization'">
                  <td class="tooltip-label">Parent:</td>
                  <td class="tooltip-value">
                    {{ getParentName(modalHoveredNode) }}
                  </td>
                </tr>
                <tr v-if="modalHoveredNode.description">
                  <td class="tooltip-label">Description:</td>
                  <td class="tooltip-value">
                    {{ modalHoveredNode.description }}
                  </td>
                </tr>
                <tr v-if="modalHoveredNode.childCount > 0">
                  <td class="tooltip-label">
                    {{
                      modalHoveredNode.type === "organization"
                        ? "Workspaces"
                        : "Tenants"
                    }}:
                  </td>
                  <td class="tooltip-value">
                    {{ modalHoveredNode.childCount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="legend modal-legend"
            :class="{ 'light-theme': appStore.isDarkMode }"
          >
            <div class="legend-item">
              <span class="legend-color org-color" />
              <span>Organization</span>
            </div>
            <div class="legend-item">
              <span class="legend-color ws-color" />
              <span>Workspace</span>
            </div>
            <div class="legend-item">
              <span class="legend-color tenant-color" />
              <span>Tenant</span>
            </div>
          </div>

          <div
            class="zoom-controls modal-zoom-controls"
            :class="{ 'light-theme': appStore.isDarkMode }"
          >
            <NTooltip>
              <template #trigger>
                <NButton quaternary size="small" @click="modalZoomIn">
                  <template #icon>
                    <Icon icon="carbon:zoom-in" />
                  </template>
                </NButton>
              </template>
              Zoom In
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NButton quaternary size="small" @click="modalZoomOut">
                  <template #icon>
                    <Icon icon="carbon:zoom-out" />
                  </template>
                </NButton>
              </template>
              Zoom Out
            </NTooltip>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style lang="scss">
@import "@/styles/tfo-node-graph-styles.scss";
</style>

<style scoped lang="scss">
// Component-specific: taller container for 3-level hierarchy
.node-graph-container {
  height: 500px;
}
</style>
