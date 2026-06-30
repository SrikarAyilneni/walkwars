const R = 6371000;

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function haversineTotal(positions) {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    const [lat1, lon1] = positions[i - 1];
    const [lat2, lon2] = positions[i];
    total += haversineMeters(lat1, lon1, lat2, lon2);
  }
  return total;
}
