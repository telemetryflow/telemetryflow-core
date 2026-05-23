/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Copy JSON object to clipboard
 */
export async function copyJsonToClipboard(obj: unknown): Promise<boolean> {
  return copyToClipboard(JSON.stringify(obj, null, 2));
}
