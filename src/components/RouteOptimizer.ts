export type Stop = {
  lat: number;
  lng: number;
  address: string;
  bags: number;
};

function distance(a: Stop, b: Stop): number {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;

  return Math.sqrt(dx * dx + dy * dy);
}

export function optimizeRoute(stops: Stop[]): Stop[] {
  if (stops.length <= 2) {
    return stops;
  }

  const depot = stops[0];

  const remaining = [...stops.slice(1)];

  const optimized: Stop[] = [depot];

  let current = depot;

  while (remaining.length > 0) {
    let closestIndex = 0;

    let closestDistance = distance(
      current,
      remaining[0]
    );

    for (let i = 1; i < remaining.length; i++) {
      const d = distance(
        current,
        remaining[i]
      );

      if (d < closestDistance) {
        closestDistance = d;
        closestIndex = i;
      }
    }

    const next = remaining.splice(
      closestIndex,
      1
    )[0];

    optimized.push(next);

    current = next;
  }

  return optimized;
}