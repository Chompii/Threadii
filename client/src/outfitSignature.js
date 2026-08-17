export function signatureOf(pieces) {
  return signatureOfIds(pieces.map((p) => p.id));
}

export function signatureOfIds(ids) {
  return [...ids].sort().join(",");
}
