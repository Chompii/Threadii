export function outfitSignature(itemIds) {
  return [...itemIds].sort().join(",");
}
