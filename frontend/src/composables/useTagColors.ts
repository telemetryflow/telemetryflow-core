/**
 * Composable for tag/badge colors
 * Provides 50 unique color combinations for tags with theme support (dark/light)
 * Colors automatically rotate if more than 50 tags
 */

// 50 color combinations for tags - Vibrant and colorful
const TAG_COLORS = [
  // Vibrant Blues
  {
    light: { bg: "#2196F3", text: "#FFFFFF", border: "#1976D2" },
    dark: { bg: "#1565C0", text: "#E3F2FD", border: "#42A5F5" },
  },
  {
    light: { bg: "#03A9F4", text: "#FFFFFF", border: "#0288D1" },
    dark: { bg: "#0277BD", text: "#B3E5FC", border: "#29B6F6" },
  },
  {
    light: { bg: "#00BCD4", text: "#FFFFFF", border: "#0097A7" },
    dark: { bg: "#00838F", text: "#B2EBF2", border: "#26C6DA" },
  },

  // Vibrant Greens
  {
    light: { bg: "#4CAF50", text: "#FFFFFF", border: "#388E3C" },
    dark: { bg: "#2E7D32", text: "#C8E6C9", border: "#66BB6A" },
  },
  {
    light: { bg: "#8BC34A", text: "#FFFFFF", border: "#689F38" },
    dark: { bg: "#558B2F", text: "#DCEDC8", border: "#9CCC65" },
  },
  {
    light: { bg: "#00E676", text: "#000000", border: "#00C853" },
    dark: { bg: "#00C853", text: "#B9F6CA", border: "#00E676" },
  },

  // Vibrant Oranges
  {
    light: { bg: "#FF9800", text: "#FFFFFF", border: "#F57C00" },
    dark: { bg: "#EF6C00", text: "#FFE0B2", border: "#FFA726" },
  },
  {
    light: { bg: "#FF6F00", text: "#FFFFFF", border: "#E65100" },
    dark: { bg: "#E65100", text: "#FFE0B2", border: "#FF8F00" },
  },
  {
    light: { bg: "#FF5722", text: "#FFFFFF", border: "#E64A19" },
    dark: { bg: "#D84315", text: "#FFCCBC", border: "#FF7043" },
  },

  // Vibrant Reds
  {
    light: { bg: "#F44336", text: "#FFFFFF", border: "#D32F2F" },
    dark: { bg: "#C62828", text: "#FFCDD2", border: "#EF5350" },
  },
  {
    light: { bg: "#E91E63", text: "#FFFFFF", border: "#C2185B" },
    dark: { bg: "#AD1457", text: "#F8BBD0", border: "#EC407A" },
  },
  {
    light: { bg: "#FF1744", text: "#FFFFFF", border: "#D50000" },
    dark: { bg: "#C62828", text: "#FF8A80", border: "#FF5252" },
  },

  // Vibrant Purples
  {
    light: { bg: "#9C27B0", text: "#FFFFFF", border: "#7B1FA2" },
    dark: { bg: "#6A1B9A", text: "#E1BEE7", border: "#AB47BC" },
  },
  {
    light: { bg: "#673AB7", text: "#FFFFFF", border: "#512DA8" },
    dark: { bg: "#4527A0", text: "#D1C4E9", border: "#7E57C2" },
  },
  {
    light: { bg: "#E040FB", text: "#FFFFFF", border: "#D500F9" },
    dark: { bg: "#AA00FF", text: "#EA80FC", border: "#E040FB" },
  },

  // Vibrant Teals
  {
    light: { bg: "#009688", text: "#FFFFFF", border: "#00796B" },
    dark: { bg: "#00695C", text: "#B2DFDB", border: "#26A69A" },
  },
  {
    light: { bg: "#00E5FF", text: "#000000", border: "#00B8D4" },
    dark: { bg: "#0097A7", text: "#B2EBF2", border: "#18FFFF" },
  },
  {
    light: { bg: "#1DE9B6", text: "#000000", border: "#00BFA5" },
    dark: { bg: "#00897B", text: "#A7FFEB", border: "#64FFDA" },
  },

  // Vibrant Ambers
  {
    light: { bg: "#FFC107", text: "#000000", border: "#FFA000" },
    dark: { bg: "#FF8F00", text: "#FFECB3", border: "#FFD54F" },
  },
  {
    light: { bg: "#FFAB00", text: "#000000", border: "#FF6F00" },
    dark: { bg: "#FF6F00", text: "#FFE57F", border: "#FFD740" },
  },
  {
    light: { bg: "#FFD600", text: "#000000", border: "#FFAB00" },
    dark: { bg: "#FFA000", text: "#FFFF8D", border: "#FFEA00" },
  },

  // Vibrant Indigos
  {
    light: { bg: "#3F51B5", text: "#FFFFFF", border: "#303F9F" },
    dark: { bg: "#283593", text: "#C5CAE9", border: "#5C6BC0" },
  },
  {
    light: { bg: "#536DFE", text: "#FFFFFF", border: "#3D5AFE" },
    dark: { bg: "#304FFE", text: "#8C9EFF", border: "#536DFE" },
  },
  {
    light: { bg: "#651FFF", text: "#FFFFFF", border: "#6200EA" },
    dark: { bg: "#6200EA", text: "#B388FF", border: "#7C4DFF" },
  },

  // Deep Purples
  {
    light: { bg: "#5E35B1", text: "#FFFFFF", border: "#512DA8" },
    dark: { bg: "#4527A0", text: "#D1C4E9", border: "#7E57C2" },
  },
  {
    light: { bg: "#7C4DFF", text: "#FFFFFF", border: "#651FFF" },
    dark: { bg: "#6200EA", text: "#B388FF", border: "#7C4DFF" },
  },
  {
    light: { bg: "#AA00FF", text: "#FFFFFF", border: "#9C27B0" },
    dark: { bg: "#7B1FA2", text: "#EA80FC", border: "#D500F9" },
  },

  // Cyan Variants
  {
    light: { bg: "#00ACC1", text: "#FFFFFF", border: "#0097A7" },
    dark: { bg: "#00838F", text: "#B2EBF2", border: "#26C6DA" },
  },
  {
    light: { bg: "#0097A7", text: "#FFFFFF", border: "#00838F" },
    dark: { bg: "#006064", text: "#80DEEA", border: "#00ACC1" },
  },
  {
    light: { bg: "#00B8D4", text: "#FFFFFF", border: "#0091EA" },
    dark: { bg: "#0277BD", text: "#80D8FF", border: "#00E5FF" },
  },

  // Lime & Light Greens
  {
    light: { bg: "#CDDC39", text: "#000000", border: "#AFB42B" },
    dark: { bg: "#9E9D24", text: "#F0F4C3", border: "#D4E157" },
  },
  {
    light: { bg: "#AEEA00", text: "#000000", border: "#9E9D24" },
    dark: { bg: "#827717", text: "#F4FF81", border: "#C6FF00" },
  },
  {
    light: { bg: "#76FF03", text: "#000000", border: "#64DD17" },
    dark: { bg: "#558B2F", text: "#CCFF90", border: "#B2FF59" },
  },

  // Yellow Variants
  {
    light: { bg: "#FFEB3B", text: "#000000", border: "#FBC02D" },
    dark: { bg: "#F9A825", text: "#FFF9C4", border: "#FFEE58" },
  },
  {
    light: { bg: "#FFD600", text: "#000000", border: "#FBC02D" },
    dark: { bg: "#F57F17", text: "#FFFF8D", border: "#FFEA00" },
  },
  {
    light: { bg: "#FDD835", text: "#000000", border: "#F9A825" },
    dark: { bg: "#F57F17", text: "#FFF59D", border: "#FFEB3B" },
  },

  // Deep Orange Variants
  {
    light: { bg: "#FF6E40", text: "#FFFFFF", border: "#FF3D00" },
    dark: { bg: "#DD2C00", text: "#FFCCBC", border: "#FF9E80" },
  },
  {
    light: { bg: "#FF3D00", text: "#FFFFFF", border: "#DD2C00" },
    dark: { bg: "#BF360C", text: "#FF9E80", border: "#FF6E40" },
  },
  {
    light: { bg: "#DD2C00", text: "#FFFFFF", border: "#BF360C" },
    dark: { bg: "#BF360C", text: "#FFAB91", border: "#FF5722" },
  },

  // Pink Variants
  {
    light: { bg: "#FF4081", text: "#FFFFFF", border: "#F50057" },
    dark: { bg: "#C51162", text: "#F48FB1", border: "#FF80AB" },
  },
  {
    light: { bg: "#F50057", text: "#FFFFFF", border: "#C51162" },
    dark: { bg: "#880E4F", text: "#FF80AB", border: "#FF4081" },
  },
  {
    light: { bg: "#C51162", text: "#FFFFFF", border: "#880E4F" },
    dark: { bg: "#880E4F", text: "#F8BBD0", border: "#F50057" },
  },

  // Brown Variants
  {
    light: { bg: "#795548", text: "#FFFFFF", border: "#5D4037" },
    dark: { bg: "#4E342E", text: "#D7CCC8", border: "#8D6E63" },
  },
  {
    light: { bg: "#6D4C41", text: "#FFFFFF", border: "#5D4037" },
    dark: { bg: "#3E2723", text: "#BCAAA4", border: "#795548" },
  },
  {
    light: { bg: "#8D6E63", text: "#FFFFFF", border: "#6D4C41" },
    dark: { bg: "#5D4037", text: "#D7CCC8", border: "#A1887F" },
  },

  // Blue Grey Variants
  {
    light: { bg: "#607D8B", text: "#FFFFFF", border: "#455A64" },
    dark: { bg: "#37474F", text: "#CFD8DC", border: "#78909C" },
  },
  {
    light: { bg: "#546E7A", text: "#FFFFFF", border: "#455A64" },
    dark: { bg: "#263238", text: "#B0BEC5", border: "#607D8B" },
  },
  {
    light: { bg: "#78909C", text: "#FFFFFF", border: "#546E7A" },
    dark: { bg: "#455A64", text: "#CFD8DC", border: "#90A4AE" },
  },

  // Additional Vibrant Colors
  {
    light: { bg: "#1E88E5", text: "#FFFFFF", border: "#1565C0" },
    dark: { bg: "#0D47A1", text: "#90CAF9", border: "#42A5F5" },
  },
  {
    light: { bg: "#43A047", text: "#FFFFFF", border: "#2E7D32" },
    dark: { bg: "#1B5E20", text: "#A5D6A7", border: "#66BB6A" },
  },
  {
    light: { bg: "#EF5350", text: "#FFFFFF", border: "#D32F2F" },
    dark: { bg: "#B71C1C", text: "#EF9A9A", border: "#E57373" },
  },
  {
    light: { bg: "#AB47BC", text: "#FFFFFF", border: "#8E24AA" },
    dark: { bg: "#6A1B9A", text: "#CE93D8", border: "#BA68C8" },
  },
];

// Cloud Provider Brand Colors
const PROVIDER_COLORS: Record<
  string,
  {
    light: { bg: string; text: string; border: string };
    dark: { bg: string; text: string; border: string };
  }
> = {
  aws: {
    light: { bg: "#FF9900", text: "#FFFFFF", border: "#EC7211" },
    dark: { bg: "#FF9900", text: "#FFFFFF", border: "#FFAC31" },
  },
  gcp: {
    light: { bg: "#4285F4", text: "#FFFFFF", border: "#1967D2" },
    dark: { bg: "#4285F4", text: "#FFFFFF", border: "#669DF6" },
  },
  azure: {
    light: { bg: "#0078D4", text: "#FFFFFF", border: "#106EBE" },
    dark: { bg: "#0078D4", text: "#FFFFFF", border: "#50A0E6" },
  },
  digitalocean: {
    light: { bg: "#0080FF", text: "#FFFFFF", border: "#0069D9" },
    dark: { bg: "#0080FF", text: "#FFFFFF", border: "#3395FF" },
  },
  linode: {
    light: { bg: "#00B159", text: "#FFFFFF", border: "#00954A" },
    dark: { bg: "#00B159", text: "#FFFFFF", border: "#00D66B" },
  },
  "alibaba-cloud": {
    light: { bg: "#FF6A00", text: "#FFFFFF", border: "#E65C00" },
    dark: { bg: "#FF6A00", text: "#FFFFFF", border: "#FF8533" },
  },
  alibabacloud: {
    light: { bg: "#FF6A00", text: "#FFFFFF", border: "#E65C00" },
    dark: { bg: "#FF6A00", text: "#FFFFFF", border: "#FF8533" },
  },
  oracle: {
    light: { bg: "#F80000", text: "#FFFFFF", border: "#C70000" },
    dark: { bg: "#F80000", text: "#FFFFFF", border: "#FF3333" },
  },
  ibm: {
    light: { bg: "#0F62FE", text: "#FFFFFF", border: "#0043CE" },
    dark: { bg: "#0F62FE", text: "#FFFFFF", border: "#4589FF" },
  },
  vultr: {
    light: { bg: "#007BFC", text: "#FFFFFF", border: "#0056B3" },
    dark: { bg: "#007BFC", text: "#FFFFFF", border: "#3395FF" },
  },
  hetzner: {
    light: { bg: "#D50C2D", text: "#FFFFFF", border: "#B0092A" },
    dark: { bg: "#D50C2D", text: "#FFFFFF", border: "#E63D5A" },
  },
};

/**
 * Hash function to convert string to number for consistent color assignment
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
 * Get provider-specific color if available
 */
function getProviderColor(providerName: string, isDark: boolean = false) {
  const normalized = providerName.toLowerCase().trim();

  if (PROVIDER_COLORS[normalized]) {
    return isDark
      ? PROVIDER_COLORS[normalized].dark
      : PROVIDER_COLORS[normalized].light;
  }

  return null;
}

/**
 * Get color configuration for a tag based on its index or name
 */
export function useTagColors() {
  /**
   * Get tag color by index
   * @param index - The index of the tag (will be modulo 50)
   * @param isDark - Whether dark theme is active
   */
  const getColorByIndex = (index: number, isDark: boolean = false) => {
    const colorIndex = index % TAG_COLORS.length;
    const colorSet = TAG_COLORS[colorIndex];
    return isDark ? colorSet.dark : colorSet.light;
  };

  /**
   * Get tag color by tag name (consistent color for same name)
   * Checks for provider-specific colors first
   * @param tagName - The name of the tag
   * @param isDark - Whether dark theme is active
   */
  const getColorByName = (tagName: string, isDark: boolean = false) => {
    // Check if this is a provider tag and use brand color
    const providerColor = getProviderColor(tagName, isDark);
    if (providerColor) {
      return providerColor;
    }

    // Otherwise use hash-based color
    const hash = hashString(tagName);
    return getColorByIndex(hash, isDark);
  };

  /**
   * Get tag style object for use in template
   * @param tagName - The name of the tag
   * @param isDark - Whether dark theme is active
   */
  const getTagStyle = (tagName: string, isDark: boolean = false) => {
    const colors = getColorByName(tagName, isDark);
    return {
      backgroundColor: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      padding: "4px 12px",
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: "500",
      display: "inline-block",
    };
  };

  /**
   * Get all 50 colors (useful for preview/testing)
   */
  const getAllColors = () => TAG_COLORS;

  return {
    getColorByIndex,
    getColorByName,
    getTagStyle,
    getAllColors,
  };
}
