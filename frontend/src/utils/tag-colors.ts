/**
 * Tag Color Palette
 * 50 distinct colors for tags with automatic circulation
 */

export interface TagColor {
  bg: string;
  color: string;
  border: string;
}

/**
 * 50 distinct color combinations for tags
 * Optimized for both light and dark themes with better contrast
 */
export const TAG_COLOR_PALETTE: TagColor[] = [
  // Blues (1-5)
  {
    bg: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
    border: "rgba(59, 130, 246, 0.4)",
  },
  {
    bg: "rgba(14, 165, 233, 0.15)",
    color: "#38bdf8",
    border: "rgba(14, 165, 233, 0.4)",
  },
  {
    bg: "rgba(6, 182, 212, 0.15)",
    color: "#22d3ee",
    border: "rgba(6, 182, 212, 0.4)",
  },
  {
    bg: "rgba(20, 184, 166, 0.15)",
    color: "#2dd4bf",
    border: "rgba(20, 184, 166, 0.4)",
  },
  {
    bg: "rgba(16, 185, 129, 0.15)",
    color: "#34d399",
    border: "rgba(16, 185, 129, 0.4)",
  },

  // Greens (6-10)
  {
    bg: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
    border: "rgba(34, 197, 94, 0.4)",
  },
  {
    bg: "rgba(132, 204, 22, 0.15)",
    color: "#a3e635",
    border: "rgba(132, 204, 22, 0.4)",
  },
  {
    bg: "rgba(234, 179, 8, 0.15)",
    color: "#facc15",
    border: "rgba(234, 179, 8, 0.4)",
  },
  {
    bg: "rgba(245, 158, 11, 0.15)",
    color: "#fbbf24",
    border: "rgba(245, 158, 11, 0.4)",
  },
  {
    bg: "rgba(249, 115, 22, 0.15)",
    color: "#fb923c",
    border: "rgba(249, 115, 22, 0.4)",
  },

  // Oranges & Reds (11-15)
  {
    bg: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    border: "rgba(239, 68, 68, 0.4)",
  },
  {
    bg: "rgba(220, 38, 38, 0.15)",
    color: "#ef4444",
    border: "rgba(220, 38, 38, 0.4)",
  },
  {
    bg: "rgba(236, 72, 153, 0.15)",
    color: "#ec4899",
    border: "rgba(236, 72, 153, 0.4)",
  },
  {
    bg: "rgba(168, 85, 247, 0.15)",
    color: "#a78bfa",
    border: "rgba(168, 85, 247, 0.4)",
  },
  {
    bg: "rgba(139, 92, 246, 0.15)",
    color: "#8b5cf6",
    border: "rgba(139, 92, 246, 0.4)",
  },

  // Purples (16-20)
  {
    bg: "rgba(124, 58, 237, 0.15)",
    color: "#7c3aed",
    border: "rgba(124, 58, 237, 0.4)",
  },
  {
    bg: "rgba(99, 102, 241, 0.15)",
    color: "#6366f1",
    border: "rgba(99, 102, 241, 0.4)",
  },
  {
    bg: "rgba(79, 70, 229, 0.15)",
    color: "#818cf8",
    border: "rgba(79, 70, 229, 0.4)",
  },
  {
    bg: "rgba(59, 130, 246, 0.2)",
    color: "#93c5fd",
    border: "rgba(59, 130, 246, 0.5)",
  },
  {
    bg: "rgba(14, 165, 233, 0.2)",
    color: "#7dd3fc",
    border: "rgba(14, 165, 233, 0.5)",
  },

  // Cyans & Teals (21-25)
  {
    bg: "rgba(6, 182, 212, 0.2)",
    color: "#67e8f9",
    border: "rgba(6, 182, 212, 0.5)",
  },
  {
    bg: "rgba(20, 184, 166, 0.2)",
    color: "#5eead4",
    border: "rgba(20, 184, 166, 0.5)",
  },
  {
    bg: "rgba(16, 185, 129, 0.2)",
    color: "#6ee7b7",
    border: "rgba(16, 185, 129, 0.5)",
  },
  {
    bg: "rgba(34, 197, 94, 0.2)",
    color: "#86efac",
    border: "rgba(34, 197, 94, 0.5)",
  },
  {
    bg: "rgba(132, 204, 22, 0.2)",
    color: "#bef264",
    border: "rgba(132, 204, 22, 0.5)",
  },

  // Limes & Yellows (26-30)
  {
    bg: "rgba(234, 179, 8, 0.2)",
    color: "#fde047",
    border: "rgba(234, 179, 8, 0.5)",
  },
  {
    bg: "rgba(245, 158, 11, 0.2)",
    color: "#fcd34d",
    border: "rgba(245, 158, 11, 0.5)",
  },
  {
    bg: "rgba(249, 115, 22, 0.2)",
    color: "#fdba74",
    border: "rgba(249, 115, 22, 0.5)",
  },
  {
    bg: "rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
    border: "rgba(239, 68, 68, 0.5)",
  },
  {
    bg: "rgba(236, 72, 153, 0.2)",
    color: "#f9a8d4",
    border: "rgba(236, 72, 153, 0.5)",
  },

  // Pinks & Purples (31-35)
  {
    bg: "rgba(168, 85, 247, 0.2)",
    color: "#c4b5fd",
    border: "rgba(168, 85, 247, 0.5)",
  },
  {
    bg: "rgba(139, 92, 246, 0.2)",
    color: "#a78bfa",
    border: "rgba(139, 92, 246, 0.5)",
  },
  {
    bg: "rgba(124, 58, 237, 0.2)",
    color: "#a78bfa",
    border: "rgba(124, 58, 237, 0.5)",
  },
  {
    bg: "rgba(99, 102, 241, 0.2)",
    color: "#a5b4fc",
    border: "rgba(99, 102, 241, 0.5)",
  },
  {
    bg: "rgba(79, 70, 229, 0.2)",
    color: "#c7d2fe",
    border: "rgba(79, 70, 229, 0.5)",
  },

  // Blues variations (36-40)
  {
    bg: "rgba(37, 99, 235, 0.15)",
    color: "#60a5fa",
    border: "rgba(37, 99, 235, 0.4)",
  },
  {
    bg: "rgba(29, 78, 216, 0.15)",
    color: "#93c5fd",
    border: "rgba(29, 78, 216, 0.4)",
  },
  {
    bg: "rgba(30, 64, 175, 0.15)",
    color: "#93c5fd",
    border: "rgba(30, 64, 175, 0.4)",
  },
  {
    bg: "rgba(30, 58, 138, 0.15)",
    color: "#bfdbfe",
    border: "rgba(30, 58, 138, 0.4)",
  },
  {
    bg: "rgba(23, 37, 84, 0.2)",
    color: "#dbeafe",
    border: "rgba(23, 37, 84, 0.5)",
  },

  // Greens variations (41-45)
  {
    bg: "rgba(21, 128, 61, 0.15)",
    color: "#4ade80",
    border: "rgba(21, 128, 61, 0.4)",
  },
  {
    bg: "rgba(22, 163, 74, 0.15)",
    color: "#4ade80",
    border: "rgba(22, 163, 74, 0.4)",
  },
  {
    bg: "rgba(101, 163, 13, 0.15)",
    color: "#a3e635",
    border: "rgba(101, 163, 13, 0.4)",
  },
  {
    bg: "rgba(113, 113, 122, 0.15)",
    color: "#a1a1aa",
    border: "rgba(113, 113, 122, 0.4)",
  },
  {
    bg: "rgba(82, 82, 91, 0.15)",
    color: "#d4d4d8",
    border: "rgba(82, 82, 91, 0.4)",
  },

  // Mixed colors (46-50)
  {
    bg: "rgba(220, 38, 38, 0.2)",
    color: "#fca5a5",
    border: "rgba(220, 38, 38, 0.5)",
  },
  {
    bg: "rgba(225, 29, 72, 0.2)",
    color: "#fb7185",
    border: "rgba(225, 29, 72, 0.5)",
  },
  {
    bg: "rgba(190, 18, 60, 0.2)",
    color: "#f472b6",
    border: "rgba(190, 18, 60, 0.5)",
  },
  {
    bg: "rgba(157, 23, 77, 0.2)",
    color: "#ec4899",
    border: "rgba(157, 23, 77, 0.5)",
  },
  {
    bg: "rgba(126, 34, 206, 0.2)",
    color: "#c084fc",
    border: "rgba(126, 34, 206, 0.5)",
  },
];

/**
 * Simple hash function to convert string to number
 * This ensures the same tag always gets the same color
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color for a tag based on its name
 * Uses hash function to ensure consistent colors and automatic circulation
 */
export function getTagColor(tagName: string): TagColor {
  const hash = hashString(tagName);
  const index = hash % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}

/**
 * Get multiple tag colors for an array of tags
 */
export function getTagColors(tags: string[]): Map<string, TagColor> {
  const colorMap = new Map<string, TagColor>();
  tags.forEach((tag) => {
    colorMap.set(tag, getTagColor(tag));
  });
  return colorMap;
}

// ==================== ENTITY COLORS ====================
// Uses the full 50-color TAG_COLOR_PALETTE for maximum variety
// Provides index-based coloring for Organizations, Workspaces, Regions, etc.

/**
 * Alias for TAG_COLOR_PALETTE - 50 distinct colors for entities
 * @deprecated Use TAG_COLOR_PALETTE directly for consistency
 */
export const ENTITY_COLORS = TAG_COLOR_PALETTE;

/**
 * Get entity color by index
 * Uses the full 50-color palette for maximum variety
 * Used for Organizations, Workspaces, Regions, etc.
 * @param index - The index of the entity in a list
 */
export function getEntityColorByIndex(index: number): TagColor {
  const colorIndex = index >= 0 ? index % TAG_COLOR_PALETTE.length : 0;
  return TAG_COLOR_PALETTE[colorIndex];
}

/**
 * Get entity color by ID from a list
 * Finds the index of the entity in the list and returns the corresponding color
 * Uses the full 50-color palette
 * @param id - The ID of the entity
 * @param list - Array of entities with 'id' property
 */
export function getEntityColor<T extends { id: string }>(
  id: string,
  list: T[],
): TagColor {
  const index = list.findIndex((item) => item.id === id);
  return getEntityColorByIndex(index);
}
