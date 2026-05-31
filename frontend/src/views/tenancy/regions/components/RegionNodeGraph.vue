<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { NButtonGroup, NButton, NTooltip, NModal } from 'naive-ui';
import { Icon } from '@iconify/vue';
import type { Region, Organization, Workspace, Tenant } from '@/types';
import { useAppStore } from '@/store';

interface TenancyGraphNode {
  id: string;
  name: string;
  slug?: string;
  code?: string;
  type: 'region' | 'organization' | 'workspace' | 'tenant';
  childCount: number;
  description?: string;
  parentId?: string;
}

interface TenancyGraphEdge {
  id: string;
  source: string;
  target: string;
}

type NodeGraphLayout = 'layered' | 'force' | 'grid';

const props = defineProps<{
  regions: Region[];
  organizations: Organization[];
  workspaces: Workspace[];
  tenants: Tenant[];
}>();

const appStore = useAppStore();
const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLDivElement>();
const layout = ref<NodeGraphLayout>('layered');
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
const NODE_RADIUS_REGION = 50;
const NODE_RADIUS_ORG = 40;
const NODE_RADIUS_WS = 32;
const NODE_RADIUS_TENANT = 26;
const NODE_SPACING_X = 140;
const NODE_SPACING_Y = 120;

// Colors
const colors = computed(() => ({
  regionBorder: '#ef4444',
  orgBorder: '#f59e0b',
  wsBorder: '#3b82f6',
  tenantBorder: '#22c55e',
  nodeFill: appStore.isDarkMode ? '#1e293b' : '#ffffff',
  text: appStore.isDarkMode ? '#e5e7eb' : '#374151',
  textSecondary: appStore.isDarkMode ? '#9ca3af' : '#6b7280',
  edge: appStore.isDarkMode ? '#64748b' : '#94a3b8',
  edgeArrow: appStore.isDarkMode ? '#64748b' : '#94a3b8',
  background: appStore.isDarkMode ? '#0f172a' : '#f8fafc',
}));

// Build graph from all entities
const graphData = computed(() => {
  const nodes: TenancyGraphNode[] = [];
  const edges: TenancyGraphEdge[] = [];

  // Add region nodes
  props.regions.forEach(region => {
    const orgCount = props.organizations.filter(o => o.regionId === region.id).length;
    nodes.push({
      id: region.id,
      name: region.name,
      code: region.code,
      type: 'region',
      childCount: orgCount,
      description: region.description,
    });
  });

  // Add organization nodes and edges
  props.organizations.forEach(org => {
    const wsCount = props.workspaces.filter(w => w.organizationId === org.id).length;
    nodes.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: 'organization',
      childCount: wsCount,
      description: org.description,
      parentId: org.regionId,
    });

    if (org.regionId) {
      edges.push({
        id: `${org.regionId}->${org.id}`,
        source: org.regionId,
        target: org.id,
      });
    }
  });

  // Add workspace nodes and edges
  props.workspaces.forEach(ws => {
    const tenantCount = props.tenants.filter(t => t.workspaceId === ws.id).length;
    nodes.push({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      type: 'workspace',
      childCount: tenantCount,
      description: ws.description,
      parentId: ws.organizationId,
    });

    if (ws.organizationId) {
      edges.push({
        id: `${ws.organizationId}->${ws.id}`,
        source: ws.organizationId,
        target: ws.id,
      });
    }
  });

  // Add tenant nodes and edges
  props.tenants.forEach(tenant => {
    nodes.push({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      type: 'tenant',
      childCount: 0,
      description: tenant.description,
      parentId: tenant.workspaceId,
    });

    if (tenant.workspaceId) {
      edges.push({
        id: `${tenant.workspaceId}->${tenant.id}`,
        source: tenant.workspaceId,
        target: tenant.id,
      });
    }
  });

  return { nodes, edges };
});

function getNodeRadius(type: string): number {
  switch (type) {
    case 'region': return NODE_RADIUS_REGION;
    case 'organization': return NODE_RADIUS_ORG;
    case 'workspace': return NODE_RADIUS_WS;
    case 'tenant': return NODE_RADIUS_TENANT;
    default: return NODE_RADIUS_ORG;
  }
}

// Calculate node positions for 4-level hierarchy
function calculateNodePositions(container: HTMLDivElement | undefined): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const { nodes, edges } = graphData.value;

  if (nodes.length === 0) return positions;

  const regionNodes = nodes.filter(n => n.type === 'region');
  const orgNodes = nodes.filter(n => n.type === 'organization');
  const wsNodes = nodes.filter(n => n.type === 'workspace');
  const tenantNodes = nodes.filter(n => n.type === 'tenant');
  const canvasWidth = container?.clientWidth || 1200;

  if (layout.value === 'layered') {
    const TENANT_SPACING = NODE_SPACING_X * 0.6;
    const WS_SPACING = NODE_SPACING_X * 0.7;
    const ORG_SPACING = NODE_SPACING_X * 0.85;

    // Calculate widths bottom-up
    // First, calculate tenant widths per workspace
    const wsWidths = new Map<string, number>();
    wsNodes.forEach(ws => {
      const wsTenants = tenantNodes.filter(t => t.parentId === ws.id);
      const tenantWidth = Math.max(TENANT_SPACING, wsTenants.length * TENANT_SPACING);
      wsWidths.set(ws.id, tenantWidth);
    });

    // Calculate org widths based on workspace widths
    const orgWidths = new Map<string, number>();
    orgNodes.forEach(org => {
      const orgWs = wsNodes.filter(w => w.parentId === org.id);
      let orgWidth = 0;
      orgWs.forEach(ws => {
        orgWidth += wsWidths.get(ws.id) || WS_SPACING;
      });
      orgWidth = Math.max(ORG_SPACING, orgWidth);
      orgWidths.set(org.id, orgWidth);
    });

    // Calculate region widths based on org widths
    const regionWidthsArray: number[] = [];
    regionNodes.forEach(region => {
      const regionOrgs = orgNodes.filter(org => org.parentId === region.id);
      let regionWidth = 0;
      regionOrgs.forEach(org => {
        regionWidth += orgWidths.get(org.id) || ORG_SPACING;
      });
      regionWidth = Math.max(NODE_SPACING_X, regionWidth);
      regionWidthsArray.push(regionWidth);
    });

    // Calculate total width and starting position
    const totalWidth = regionWidthsArray.reduce((sum, w) => sum + w, 0);
    let currentX = (canvasWidth - totalWidth) / 2;

    // Position regions
    regionNodes.forEach((region, i) => {
      const centerX = currentX + regionWidthsArray[i] / 2;
      positions.set(region.id, {
        x: centerX,
        y: 80,
      });

      // Position organizations under this region
      const regionOrgs = orgNodes.filter(org => org.parentId === region.id);
      let orgStartX = currentX;

      regionOrgs.forEach(org => {
        const orgWidth = orgWidths.get(org.id) || ORG_SPACING;
        const orgCenterX = orgStartX + orgWidth / 2;
        positions.set(org.id, {
          x: orgCenterX,
          y: 80 + NODE_SPACING_Y,
        });

        // Position workspaces under this org
        const orgWs = wsNodes.filter(w => w.parentId === org.id);
        let wsStartX = orgStartX;

        orgWs.forEach(ws => {
          const wsWidth = wsWidths.get(ws.id) || WS_SPACING;
          const wsCenterX = wsStartX + wsWidth / 2;
          positions.set(ws.id, {
            x: wsCenterX,
            y: 80 + NODE_SPACING_Y * 2,
          });

          // Position tenants under this workspace
          const wsTenants = tenantNodes.filter(t => t.parentId === ws.id);
          const tenantCount = wsTenants.length;
          const tenantTotalWidth = tenantCount * TENANT_SPACING;
          const tenantStartX = wsCenterX - tenantTotalWidth / 2 + TENANT_SPACING / 2;

          wsTenants.forEach((tenant, tenantIndex) => {
            positions.set(tenant.id, {
              x: tenantStartX + tenantIndex * TENANT_SPACING,
              y: 80 + NODE_SPACING_Y * 3,
            });
          });

          wsStartX += wsWidth;
        });

        orgStartX += orgWidth;
      });

      currentX += regionWidthsArray[i];
    });
  } else if (layout.value === 'force') {
    const canvasHeight = container?.clientHeight || 600;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Much larger radii to prevent overlap in 4-level hierarchy
    const REGION_BASE_RADIUS = 250;
    const ORG_BASE_RADIUS = 300;
    const WS_BASE_RADIUS = 220;
    const TENANT_BASE_RADIUS = 160;

    // Place regions around center - spread based on number of regions
    const regionRadius = Math.max(REGION_BASE_RADIUS, regionNodes.length * 80);
    const regionAngleStep = (2 * Math.PI) / Math.max(regionNodes.length, 1);
    regionNodes.forEach((region, i) => {
      const angle = regionAngleStep * i - Math.PI / 2;
      positions.set(region.id, {
        x: centerX + Math.cos(angle) * regionRadius,
        y: centerY + Math.sin(angle) * regionRadius,
      });
    });

    // Place orgs around their region - dynamic radius based on org count
    orgNodes.forEach(org => {
      const regionPos = positions.get(org.parentId || '');
      if (regionPos) {
        const regionOrgs = orgNodes.filter(o => o.parentId === org.parentId);
        const idx = regionOrgs.indexOf(org);
        const orgRadius = Math.max(ORG_BASE_RADIUS, regionOrgs.length * 100);
        const angle = (2 * Math.PI * idx) / Math.max(regionOrgs.length, 1) - Math.PI / 2;
        positions.set(org.id, {
          x: regionPos.x + Math.cos(angle) * orgRadius,
          y: regionPos.y + Math.sin(angle) * orgRadius,
        });
      }
    });

    // Place workspaces around their org - dynamic radius based on ws count
    wsNodes.forEach(ws => {
      const orgPos = positions.get(ws.parentId || '');
      if (orgPos) {
        const orgWs = wsNodes.filter(w => w.parentId === ws.parentId);
        const idx = orgWs.indexOf(ws);
        const wsRadius = Math.max(WS_BASE_RADIUS, orgWs.length * 80);
        const angle = (2 * Math.PI * idx) / Math.max(orgWs.length, 1) - Math.PI / 2;
        positions.set(ws.id, {
          x: orgPos.x + Math.cos(angle) * wsRadius,
          y: orgPos.y + Math.sin(angle) * wsRadius,
        });
      }
    });

    // Place tenants around their workspace - dynamic radius based on tenant count
    tenantNodes.forEach(tenant => {
      const wsPos = positions.get(tenant.parentId || '');
      if (wsPos) {
        const wsTenants = tenantNodes.filter(t => t.parentId === tenant.parentId);
        const idx = wsTenants.indexOf(tenant);
        const tenantRadius = Math.max(TENANT_BASE_RADIUS, wsTenants.length * 60);
        const angle = (2 * Math.PI * idx) / Math.max(wsTenants.length, 1) - Math.PI / 2;
        positions.set(tenant.id, {
          x: wsPos.x + Math.cos(angle) * tenantRadius,
          y: wsPos.y + Math.sin(angle) * tenantRadius,
        });
      }
    });
  } else {
    // Grid layout - use larger spacing for 4-level hierarchy
    const GRID_SPACING_X = 200;
    const GRID_SPACING_Y = 180;
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const startX = Math.max(100, (canvasWidth - (cols - 1) * GRID_SPACING_X) / 2);

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

const nodePositions = computed(() => calculateNodePositions(containerRef.value));
const modalNodePositions = computed(() => calculateNodePositions(modalContainerRef.value));

// Draw the graph
function drawGraph(
  canvas: HTMLCanvasElement | undefined,
  container: HTMLDivElement | undefined,
  positions: Map<string, { x: number; y: number }>,
  currentOffset: { x: number; y: number },
  currentScale: number,
  currentHoveredNode: TenancyGraphNode | null
) {
  if (!canvas || !container) return;

  const ctx = canvas.getContext('2d');
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
  edges.forEach(edge => {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);
    if (!sourcePos || !targetPos) return;

    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    const sourceRadius = getNodeRadius(sourceNode?.type || 'organization');
    const targetRadius = getNodeRadius(targetNode?.type || 'organization');

    ctx.beginPath();
    ctx.strokeStyle = colors.value.edge;
    ctx.lineWidth = 1.5;

    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const nx = dx / dist;
    const ny = dy / dist;

    const startX = sourcePos.x + nx * sourceRadius;
    const startY = sourcePos.y + ny * sourceRadius;
    const endX = targetPos.x - nx * (targetRadius + 8);
    const endY = targetPos.y - ny * (targetRadius + 8);

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
      endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
      endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  });

  // Draw nodes
  nodes.forEach(node => {
    const pos = positions.get(node.id);
    if (!pos) return;

    const isHovered = currentHoveredNode?.id === node.id;
    const radius = getNodeRadius(node.type);
    const borderColor = node.type === 'region' ? colors.value.regionBorder :
      node.type === 'organization' ? colors.value.orgBorder :
        node.type === 'workspace' ? colors.value.wsBorder :
          colors.value.tenantBorder;

    // Node circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = colors.value.nodeFill;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.stroke();

    // Icon in center
    const iconSize = node.type === 'region' ? 18 : node.type === 'organization' ? 14 : node.type === 'workspace' ? 12 : 10;
    ctx.font = `${iconSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = node.type === 'region' ? '🌍' : node.type === 'organization' ? '🏢' : node.type === 'workspace' ? '📁' : '👤';
    ctx.fillText(icon, pos.x, pos.y - (node.type === 'tenant' ? 0 : 3));

    // Child count badge (only for non-tenant nodes)
    if (node.childCount > 0 && node.type !== 'tenant') {
      ctx.fillStyle = borderColor;
      ctx.font = 'bold 9px Inter, sans-serif';
      const childLabel = node.type === 'region' ? `${node.childCount} orgs` :
        node.type === 'organization' ? `${node.childCount} ws` :
          `${node.childCount}`;
      ctx.fillText(childLabel, pos.x, pos.y + (node.type === 'region' ? 12 : 8));
    }

    // Name below node
    ctx.fillStyle = colors.value.text;
    ctx.font = `bold ${node.type === 'tenant' ? 9 : 10}px Inter, sans-serif`;
    const maxNameLen = node.type === 'tenant' ? 10 : 14;
    const name = node.name.length > maxNameLen ? node.name.slice(0, maxNameLen - 3) + '...' : node.name;
    ctx.fillText(name, pos.x, pos.y + radius + 12);

    // Code/Slug (only for region, org, workspace)
    if (node.type !== 'tenant') {
      ctx.fillStyle = colors.value.textSecondary;
      ctx.font = '8px Inter, sans-serif';
      const subLabel = node.type === 'region' ? (node.code || '') : (node.slug || '');
      const displayLabel = subLabel.length > 16 ? subLabel.slice(0, 13) + '...' : subLabel;
      ctx.fillText(displayLabel, pos.x, pos.y + radius + 24);
    }
  });

  ctx.restore();
}

function draw() {
  drawGraph(canvasRef.value, containerRef.value, mergePositions(nodePositions.value, customPositions), offset.value, scale.value, hoveredNode.value);
}

function drawModal() {
  drawGraph(modalCanvasRef.value, modalContainerRef.value, mergePositions(modalNodePositions.value, modalCustomPositions), modalOffset.value, modalScale.value, modalHoveredNode.value);
}

// Mouse handlers
function handleMouseDown(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - offset.value.x) / scale.value;
  const y = (e.clientY - rect.top - offset.value.y) / scale.value;

  // Check if clicking on a node
  let foundId: string | null = null;
  const positions = mergePositions(nodePositions.value, customPositions);

  graphData.value.nodes.forEach(node => {
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
    dragStart.value = { x: e.clientX - offset.value.x, y: e.clientY - offset.value.y };
  }
  if (canvasRef.value) canvasRef.value.style.cursor = 'grabbing';
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
    if (canvasRef.value) canvasRef.value.style.cursor = 'grabbing';
    draw();
  } else if (isDragging.value) {
    offset.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y,
    };
    showTooltip.value = false;
    if (canvasRef.value) canvasRef.value.style.cursor = 'grabbing';
    draw();
  } else {
    const hoverPositions = mergePositions(nodePositions.value, customPositions);
    let found: TenancyGraphNode | null = null;
    graphData.value.nodes.forEach(node => {
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
        if (canvasRef.value) canvasRef.value.style.cursor = 'pointer';
      } else {
        showTooltip.value = false;
        if (canvasRef.value) canvasRef.value.style.cursor = 'grab';
      }
      draw();
    } else if (found) {
      tooltipPos.value = { x: e.clientX, y: e.clientY };
      if (canvasRef.value) canvasRef.value.style.cursor = 'pointer';
    } else {
      if (canvasRef.value) canvasRef.value.style.cursor = 'grab';
    }
  }
}

function handleMouseUp() {
  isDragging.value = false;
  draggedNodeId = null;
  if (canvasRef.value) canvasRef.value.style.cursor = hoveredNode.value ? 'pointer' : 'grab';
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale.value = Math.max(0.2, Math.min(3, scale.value * delta));
  draw();
}

function zoomIn() {
  scale.value = Math.min(3, scale.value * 1.2);
  draw();
}

function zoomOut() {
  scale.value = Math.max(0.2, scale.value / 1.2);
  draw();
}

function handleMouseLeave() {
  isDragging.value = false;
  draggedNodeId = null;
  hoveredNode.value = null;
  showTooltip.value = false;
  if (canvasRef.value) canvasRef.value.style.cursor = 'grab';
}

// Modal handlers
function handleModalMouseDown(e: MouseEvent) {
  const rect = modalCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - modalOffset.value.x) / modalScale.value;
  const y = (e.clientY - rect.top - modalOffset.value.y) / modalScale.value;

  // Check if clicking on a node
  let foundId: string | null = null;
  const positions = mergePositions(modalNodePositions.value, modalCustomPositions);

  graphData.value.nodes.forEach(node => {
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
    modalDragStart.value = { x: e.clientX - modalOffset.value.x, y: e.clientY - modalOffset.value.y };
  }
  if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'grabbing';
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
    if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'grabbing';
    drawModal();
  } else if (isModalDragging.value) {
    modalOffset.value = {
      x: e.clientX - modalDragStart.value.x,
      y: e.clientY - modalDragStart.value.y,
    };
    showModalTooltip.value = false;
    if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'grabbing';
    drawModal();
  } else {
    const modalHoverPositions = mergePositions(modalNodePositions.value, modalCustomPositions);
    let found: TenancyGraphNode | null = null;
    graphData.value.nodes.forEach(node => {
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
        if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'pointer';
      } else {
        showModalTooltip.value = false;
        if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'grab';
      }
      drawModal();
    } else if (found) {
      modalTooltipPos.value = { x: e.clientX, y: e.clientY };
      if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'pointer';
    } else {
      if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'grab';
    }
  }
}

function handleModalMouseUp() {
  isModalDragging.value = false;
  modalDraggedNodeId = null;
  if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = modalHoveredNode.value ? 'pointer' : 'grab';
}

function handleModalWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  modalScale.value = Math.max(0.2, Math.min(3, modalScale.value * delta));
  drawModal();
}

function modalZoomIn() {
  modalScale.value = Math.min(3, modalScale.value * 1.2);
  drawModal();
}

function modalZoomOut() {
  modalScale.value = Math.max(0.2, modalScale.value / 1.2);
  drawModal();
}

function handleModalMouseLeave() {
  isModalDragging.value = false;
  modalDraggedNodeId = null;
  modalHoveredNode.value = null;
  showModalTooltip.value = false;
  if (modalCanvasRef.value) modalCanvasRef.value.style.cursor = 'grab';
}

function openZoomModal() {
  showZoomModal.value = true;
  modalScale.value = 0.8;
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

function getTypeLabel(type: string): string {
  switch (type) {
    case 'region': return 'Region';
    case 'organization': return 'Organization';
    case 'workspace': return 'Workspace';
    case 'tenant': return 'Tenant';
    default: return type;
  }
}

watch([() => props.regions, () => props.organizations, () => props.workspaces, () => props.tenants, layout], () => {
  customPositions.clear();
  modalCustomPositions.clear();
});

watch([() => props.regions, () => props.organizations, () => props.workspaces, () => props.tenants, layout, () => appStore.isDarkMode], () => {
  requestAnimationFrame(draw);
  if (showZoomModal.value) {
    requestAnimationFrame(drawModal);
  }
});

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
  window.addEventListener('resize', draw);
});

onUnmounted(() => {
  window.removeEventListener('resize', draw);
});
</script>

<template>
  <div class="node-graph-wrapper">
    <div class="layout-toolbar">
      <NButtonGroup size="small" class="layout-buttons">
        <NButton :type="layout === 'layered' ? 'primary' : 'default'" @click="layout = 'layered'">
          Layered
        </NButton>
        <NButton :type="layout === 'force' ? 'primary' : 'default'" @click="layout = 'force'">
          Radial
        </NButton>
        <NButton :type="layout === 'grid' ? 'primary' : 'default'" @click="layout = 'grid'">
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
        ref="canvasRef" class="node-graph-canvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
        @mouseup="handleMouseUp" @mouseleave="handleMouseLeave" @wheel="handleWheel"
      />

      <!-- Node Tooltip -->
      <div
        v-if="showTooltip && hoveredNode" class="node-graph-tooltip"
        :class="{ 'light-tooltip': appStore.isDarkMode }" :style="{
          left: `${tooltipPos.x + 15}px`,
          top: `${tooltipPos.y + 15}px`,
        }"
      >
        <table class="tooltip-table">
          <tbody>
            <tr>
              <td class="tooltip-label">Type:</td>
              <td class="tooltip-value">{{ getTypeLabel(hoveredNode.type) }}</td>
            </tr>
            <tr>
              <td class="tooltip-label">Name:</td>
              <td class="tooltip-value">{{ hoveredNode.name }}</td>
            </tr>
            <tr v-if="hoveredNode.type === 'region'">
              <td class="tooltip-label">Code:</td>
              <td class="tooltip-value">{{ hoveredNode.code }}</td>
            </tr>
            <tr v-if="hoveredNode.type !== 'region'">
              <td class="tooltip-label">Slug:</td>
              <td class="tooltip-value">{{ hoveredNode.slug }}</td>
            </tr>
            <tr v-if="hoveredNode.description">
              <td class="tooltip-label">Description:</td>
              <td class="tooltip-value">{{ hoveredNode.description }}</td>
            </tr>
            <tr v-if="hoveredNode.childCount > 0">
              <td class="tooltip-label">Children:</td>
              <td class="tooltip-value">{{ hoveredNode.childCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="legend" :class="{ 'light-theme': appStore.isDarkMode }">
        <div class="legend-item">
          <span class="legend-color region-color" />
          <span>Region</span>
        </div>
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
      <div class="zoom-controls" :class="{ 'light-theme': appStore.isDarkMode }">
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
      v-model:show="showZoomModal" preset="card" class="node-graph-zoom-modal"
      :style="{ width: '95vw', height: '90vh', maxWidth: '1800px' }" :bordered="false" :closable="false" size="huge"
    >
      <template #header>
        <div class="modal-header">
          <div class="modal-title-section">
            <Icon icon="carbon:network-4" class="modal-title-icon" />
            <span class="modal-title">Tenancy Hierarchy</span>
            <span class="modal-subtitle">Regions → Organizations → Workspaces → Tenants</span>
          </div>
          <div class="modal-actions">
            <NButtonGroup size="small" class="modal-layout-buttons">
              <NButton :type="layout === 'layered' ? 'primary' : 'default'" @click="layout = 'layered'">
                Layered
              </NButton>
              <NButton :type="layout === 'force' ? 'primary' : 'default'" @click="layout = 'force'">
                Radial
              </NButton>
              <NButton :type="layout === 'grid' ? 'primary' : 'default'" @click="layout = 'grid'">
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
            ref="modalCanvasRef" class="modal-graph-canvas" @mousedown="handleModalMouseDown"
            @mousemove="handleModalMouseMove" @mouseup="handleModalMouseUp" @mouseleave="handleModalMouseLeave"
            @wheel="handleModalWheel"
          />

          <div
            v-if="showModalTooltip && modalHoveredNode" class="node-graph-tooltip"
            :class="{ 'light-tooltip': appStore.isDarkMode }" :style="{
              left: `${modalTooltipPos.x + 15}px`,
              top: `${modalTooltipPos.y + 15}px`,
            }"
          >
            <table class="tooltip-table">
              <tbody>
                <tr>
                  <td class="tooltip-label">Type:</td>
                  <td class="tooltip-value">{{ getTypeLabel(modalHoveredNode.type) }}</td>
                </tr>
                <tr>
                  <td class="tooltip-label">Name:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.name }}</td>
                </tr>
                <tr v-if="modalHoveredNode.type === 'region'">
                  <td class="tooltip-label">Code:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.code }}</td>
                </tr>
                <tr v-if="modalHoveredNode.type !== 'region'">
                  <td class="tooltip-label">Slug:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.slug }}</td>
                </tr>
                <tr v-if="modalHoveredNode.description">
                  <td class="tooltip-label">Description:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.description }}</td>
                </tr>
                <tr v-if="modalHoveredNode.childCount > 0">
                  <td class="tooltip-label">Children:</td>
                  <td class="tooltip-value">{{ modalHoveredNode.childCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="legend modal-legend" :class="{ 'light-theme': appStore.isDarkMode }">
            <div class="legend-item">
              <span class="legend-color region-color" />
              <span>Region</span>
            </div>
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

          <div class="zoom-controls modal-zoom-controls" :class="{ 'light-theme': appStore.isDarkMode }">
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
@import '@/styles/tfo-node-graph-styles.scss';
</style>