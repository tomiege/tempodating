// Utility function to parse name and emoji from the preferredName field
export function parseNameAndEmoji(preferredName: string | null): { name: string; emoji: string } {
  if (!preferredName) {
    return { name: '', emoji: '' };
  }

  // Split by space and check if the last part is an emoji
  const parts = preferredName.trim().split(' ');
  const lastPart = parts[parts.length - 1];
  
  // Simple emoji detection - check if the last part is a single character that's not alphanumeric
  const isEmoji = lastPart.length <= 2 && !/^[a-zA-Z0-9]+$/.test(lastPart);
  
  if (isEmoji && parts.length > 1) {
    const name = parts.slice(0, -1).join(' ');
    return { name, emoji: lastPart };
  }
  
  return { name: preferredName, emoji: '' };
}
