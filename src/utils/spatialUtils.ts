/**
 * Spatial Utilities - Thay thế Turf.js bằng các hàm thuần JS
 * Dùng cho phân tích chồng lấn dự án (Spatial Analysis)
 */

export type Coordinate = [number, number]; // [lng, lat]
export type Polygon = Coordinate[];

/**
 * Thuật toán Ray-casting: Kiểm tra điểm nằm trong polygon
 * https://en.wikipedia.org/wiki/Point_in_polygon
 */
export function pointInPolygon(point: Coordinate, polygon: Polygon): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Tính diện tích polygon (m²) bằng công thức Shoelace + chuyển đổi từ độ sang mét
 */
export function polygonAreaM2(polygon: Polygon): number {
  // Trung tâm polygon
  const latCenter = polygon.reduce((s, c) => s + c[1], 0) / polygon.length;
  // Chuyển đổi tọa độ WGS84 (degrees) sang mét xấp xỉ
  const mPerDegLng = (111320 * Math.cos((latCenter * Math.PI) / 180));
  const mPerDegLat = 110540;

  // Tính Shoelace
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0] * mPerDegLng;
    const yi = polygon[i][1] * mPerDegLat;
    const xj = polygon[j][0] * mPerDegLng;
    const yj = polygon[j][1] * mPerDegLat;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area) / 2;
}

/**
 * Tính bounding box mở rộng cho polygon (để filter nhanh)
 */
export function polygonBBox(polygon: Polygon): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of polygon) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, maxLng, minLat, maxLat };
}

/**
 * Tạo GeoJSON Feature cho polygon
 */
export function polygonToGeoJSON(polygon: Polygon, properties: Record<string, unknown> = {}) {
  return {
    type: "Feature" as const,
    properties,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[...polygon, polygon[0]]], // Close ring
    },
  };
}

/**
 * Tạo GeoJSON FeatureCollection
 */
export function featureCollection(features: ReturnType<typeof polygonToGeoJSON>[]) {
  return {
    type: "FeatureCollection" as const,
    features,
  };
}

/**
 * Sample GeoJSON ranh dự án mẫu (Metro line / Road project)
 */
export const SAMPLE_PROJECTS = [
  {
    name: "Ranh dự án Đường sắt Đô thị - Tuyến số 1",
    id: "proj-metro-1",
    polygon: [
      [106.6880, 10.7800],
      [106.6980, 10.7800],
      [106.6980, 10.7750],
      [106.6880, 10.7750],
    ] as Coordinate[],
    color: "#ef4444",
  },
  {
    name: "Ranh dự án Mở rộng đường Hai Bà Trưng",
    id: "proj-road-2",
    polygon: [
      [106.6920, 10.7730],
      [106.6960, 10.7730],
      [106.6960, 10.7690],
      [106.6920, 10.7690],
    ] as Coordinate[],
    color: "#f59e0b",
  },
];
