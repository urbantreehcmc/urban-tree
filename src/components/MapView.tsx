"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  Marker,
  NavigationControl,
  ScaleControl,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { FillLayerSpecification, LineLayerSpecification, CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import {
  type TreeRecord,
  type ParkRecord,
  type GreenAreaRecord,
} from "@/lib/types";
import SpatialAnalysisPanel from "@/components/SpatialAnalysisPanel";
import { type Coordinate, polygonToGeoJSON, featureCollection } from "@/utils/spatialUtils";
import { useMapTrees } from "@/lib/hooks/useMapTrees";
import StreetViewPanel from "@/components/StreetViewPanel";
import { supabase } from "@/lib/supabase";
import { useWards } from "@/lib/hooks/useWards";

interface MapViewProps {
  trees?: TreeRecord[];
  onManageTree?: (id: string) => void;
  onCreatePatrol?: (treeInfo: { id: string; name: string; location: string; lat: number; lng: number }) => void;
  defaultSpatialOpen?: boolean;
}

const INITIAL_VIEW = {
  longitude: 106.695,
  latitude: 10.775,
  zoom: 14,
};

// Convert trees to GeoJSON
// Helper để chuẩn hóa chuỗi tiếng Việt
function normalizeString(str: string): string {
  if (!str) return '';
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function treesToGeoJSON(trees: TreeRecord[]) {
  return {
    type: "FeatureCollection" as const,
    features: trees
      .filter((t) => t.lat !== null && t.lng !== null)
      .map((t) => {
        // Xác định phân loại cây
        let phanLoai = "";
        const plNorm = normalizeString(t.phanLoai || "");
        if (t.trangThai === "moi" || plNorm.includes("moi trong") || plNorm === "mt") phanLoai = "MT";
        else if (plNorm.includes("loai 1") || plNorm === "l1") phanLoai = "L1";
        else if (plNorm.includes("loai 2") || plNorm === "l2") phanLoai = "L2";
        else if (plNorm.includes("loai 3") || plNorm === "l3") phanLoai = "L3";



        return {
          type: "Feature" as const,
          properties: {
            id: t.id,
            ma: t.ma,
            loaiCay: t.loaiCay,
            soCay: t.soCay,
            phanLoai,
            hvn: t.hvn,
            c13: t.c13,
            trangThai: t.trangThai,
            phuong: t.phuong,
            quan: t.quan,
            tenDuong: t.tenDuong,
            namTrong: t.namTrong,
            le: t.le,
            bon: t.bon,
            phanTan: t.phanTan,
            giamSat: t.giamSat,
            cty: t.cty,
            xn: t.xn,
            goi: t.goi,
            kv: t.kv,
            diaChi: t.diaChi,
            ghiChu: t.ghiChu,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [t.lng!, t.lat!],
          },
        };
      }),
  };
}

// Convert parks to GeoJSON polygons
function parksToGeoJSON(parks: ParkRecord[]) {
  return {
    type: "FeatureCollection" as const,
    features: parks.map((p) => ({
      type: "Feature" as const,
      properties: {
        id: p.id,
        ten: p.ten,
        tongDienTich: p.tongDienTich,
        capDo: p.capDo,
        phuong: p.phuong,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[...p.coordinates, p.coordinates[0]]],
      },
    })),
  };
}

function greenAreasToGeoJSON(areas: GreenAreaRecord[]) {
  return {
    type: "FeatureCollection" as const,
    features: areas.map((g) => ({
      type: "Feature" as const,
      properties: {
        id: g.id,
        ten: g.ten,
        dienTich: g.dienTich,
        phuong: g.phuong,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[...g.coordinates, g.coordinates[0]]],
      },
    })),
  };
}

// Map layer styles
const treeLayerCircle: CircleLayerSpecification = {
  id: "tree-points",
  type: "circle",
  source: "trees",
  paint: {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      10, 3,
      14, 6,
      18, 12,
    ],
    "circle-color": [
      "match", ["get", "trangThai"],
      "khoe", "#22c55e",
      "sauBenh", "#f59e0b",
      "canDonHa", "#ef4444",
      "moi", "#3b82f6",
      "#22c55e",
    ],
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "rgba(255,255,255,0.5)",
    "circle-opacity": 0.85,
  },
};

const treeClusterLayer: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: "trees",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step", ["get", "point_count"],
      "#14b8a6", 10,
      "#0f766e", 50,
      "#0d4f48", 100,
      "#065f46",
    ],
    "circle-radius": [
      "step", ["get", "point_count"],
      18, 10,
      24, 50,
      32, 100,
      40,
    ],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255,255,255,0.2)",
  },
};

const clusterCountLayer: SymbolLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: "trees",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Open Sans Bold"],
    "text-size": 13,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const parkFillLayer: FillLayerSpecification = {
  id: "park-fill",
  type: "fill",
  source: "parks",
  paint: {
    "fill-color": "rgba(20, 184, 166, 0.2)",
    "fill-outline-color": "rgba(20, 184, 166, 0.6)",
  },
};

const parkOutlineLayer: LineLayerSpecification = {
  id: "park-outline",
  type: "line",
  source: "parks",
  paint: {
    "line-color": "#14b8a6",
    "line-width": 2,
    "line-dasharray": [3, 2],
  },
};

const greenFillLayer: FillLayerSpecification = {
  id: "green-fill",
  type: "fill",
  source: "green-areas",
  paint: {
    "fill-color": "rgba(34, 197, 94, 0.15)",
    "fill-outline-color": "rgba(34, 197, 94, 0.5)",
  },
};

const greenOutlineLayer: LineLayerSpecification = {
  id: "green-outline",
  type: "line",
  source: "green-areas",
  paint: {
    "line-color": "#22c55e",
    "line-width": 1.5,
    "line-dasharray": [4, 3],
  },
};

// Phường xã layers
const phuongXaFillLayer: FillLayerSpecification = {
  id: "phuongxa-fill",
  type: "fill",
  source: "phuongxa",
  paint: {
    "fill-color": "rgba(234, 179, 8, 0.08)",
    "fill-opacity": 0.08,
  },
};

const phuongXaHighlightLayer: FillLayerSpecification = {
  id: "phuongxa-highlight",
  type: "fill",
  source: "phuongxa",
  paint: {
    "fill-color": "#eab308",
    "fill-opacity": 0.25,
  },
};

const phuongXaOutlineLayer: LineLayerSpecification = {
  id: "phuongxa-outline",
  type: "line",
  source: "phuongxa",
  paint: {
    "line-color": "#eab308",
    "line-width": 2,
    "line-dasharray": [4, 4],
  },
};

const phuongXaLabelLayer: SymbolLayerSpecification = {
  id: "phuongxa-label",
  type: "symbol",
  source: "phuongxa",
  layout: {
    "text-field": [
      "case",
      ["any", 
        ["==", ["coalesce", ["get", "name"], ["get", "Name"], ["get", "ten_phuong"], ["get", "TEN_PHUONG"], ["get", "ten_quan"], ["get", "TEN_QUAN"], ["get", "description"], ""], "PA168"],
        ["==", ["coalesce", ["get", "name"], ["get", "Name"], ["get", "ten_phuong"], ["get", "TEN_PHUONG"], ["get", "ten_quan"], ["get", "TEN_QUAN"], ["get", "description"], ""], "PA168txt"]
      ],
      "",
      ["coalesce", ["get", "name"], ["get", "Name"], ["get", "ten_phuong"], ["get", "TEN_PHUONG"], ["get", "ten_quan"], ["get", "TEN_QUAN"], ["get", "description"], ""]
    ],
    "text-font": ["Open Sans Bold"],
    "text-size": [
      "interpolate", ["linear"], ["zoom"],
      10, 14,
      12, 18,
      14, 24,
      16, 28
    ],
    "text-justify": "center",
    "text-anchor": "center",
    "text-allow-overlap": false,
    "text-ignore-placement": false,
  },
  paint: {
    "text-color": "#fde047",
    "text-halo-color": "rgba(0,0,0,0.9)",
    "text-halo-width": 3,
  },
};

// Unclustered tree points - sử dụng CircleLayer đơn giản, ổn định
const unclusteredPointLayer: CircleLayerSpecification = {
  id: "unclustered-point",
  type: "circle",
  source: "trees",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      10, 5,
      14, 8,
      18, 12,
    ],
    "circle-color": [
      "match", ["get", "trangThai"],
      "khoe", "#22c55e",
      "sauBenh", "#f59e0b",
      "canDonHa", "#ef4444",
      "moi", "#3b82f6",
      "dangXuLy", "#a855f7",
      "#22c55e"
    ],
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255,255,255,0.7)",
    "circle-opacity": 0.9,
  },
};

// Text label layer - hiển thị "Loài cây" / "Số hiệu" / "Phân loại" bên dưới mỗi điểm
const treeLabelLayer: SymbolLayerSpecification = {
  id: "tree-labels",
  type: "symbol",
  source: "trees",
  filter: ["!", ["has", "point_count"]],
  layout: {
    "text-field": [
      "concat",
      ["get", "loaiCay"],
      "\n",
      ["get", "soCay"],
      "\n",
      ["get", "phanLoai"],
    ],
    "text-font": ["Open Sans Regular"],
    "text-size": [
      "interpolate", ["linear"], ["zoom"],
      12, 0,
      14, 10,
      16, 12,
      18, 14,
    ],
    "text-offset": [0, 1.4],
    "text-anchor": "top",
    "text-justify": "center",
    "text-allow-overlap": false,
    "text-ignore-placement": false,
    "text-optional": true,
    "text-max-width": 12,
  },
  paint: {
    "text-color": [
      "match", ["get", "trangThai"],
      "khoe", "#22c55e",
      "sauBenh", "#f59e0b",
      "canDonHa", "#ef4444",
      "moi", "#3b82f6",
      "dangXuLy", "#a855f7",
      "#ffffff"
    ],
    "text-halo-color": "rgba(0,0,0,0.9)",
    "text-halo-width": 2,
  },
};

type PopupInfo = {
  type: "tree" | "park" | "green" | "phuongxa";
  lng: number;
  lat: number;
  properties: Record<string, unknown>;
};

const GOOGLE_HYBRID_STYLE = {
  version: 8,
  // Dùng server glyph chính thức OpenMapTiles đá»ƒ hỗ trợ Open Sans
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "google-satellite": {
      type: "raster",
      tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
      tileSize: 256,
      attribution: "Map data © Google"
    },
    "esri-labels": {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Tiles Â© Esri — Source: Esri, DeLorme, NAVTEQ"
    }
  },
  layers: [
    {
      id: "google-satellite-layer",
      type: "raster",
      source: "google-satellite",
      minzoom: 0,
      maxzoom: 22
    },
    {
      id: "esri-labels-layer",
      type: "raster",
      source: "esri-labels",
      minzoom: 0,
      maxzoom: 22,
      paint: {
        "raster-opacity": 0.9
      }
    }
  ]
};

export default function MapView({ trees: initialTrees = [], onManageTree, onCreatePatrol, defaultSpatialOpen }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(INITIAL_VIEW.zoom);
  const [isSpatialOpen, setIsSpatialOpen] = useState(false);

  useEffect(() => {
    if (defaultSpatialOpen !== undefined) {
      setIsSpatialOpen(defaultSpatialOpen);
    }
  }, [defaultSpatialOpen]);

  useEffect(() => {
    const handleMoveTree = (e: any) => {
      setEditingTree({
        id: String(e.detail.id),
        lat: e.detail.lat,
        lng: e.detail.lng
      });
      setPopupInfo(null);
    };
    
    const handleStreetView = (e: any) => {
      setStreetViewCoord({ lat: e.detail.lat, lng: e.detail.lng });
      setPopupInfo(null);
    };

    window.addEventListener('START_MOVE_TREE', handleMoveTree);
    window.addEventListener('START_STREET_VIEW', handleStreetView);
    return () => {
      window.removeEventListener('START_MOVE_TREE', handleMoveTree);
      window.removeEventListener('START_STREET_VIEW', handleStreetView);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const { trees: mapTrees, loading: loadingTrees } = useMapTrees(viewportBounds, zoomLevel);
  const { wards: allWards } = useWards({ search: "" });

  // Mapping phường xã để xác định loại (Phường/Xã) và quận cũ
  const wardMap = useMemo(() => {
    const map: Record<string, { type: string; old_district: string }> = {};
    allWards.forEach(w => {
      map[w.name.toLowerCase()] = { type: w.type, old_district: w.old_district };
    });
    return map;
  }, [allWards]);

  const activeTrees = mapTrees.length > 0 ? mapTrees : initialTrees;

  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [selectedPhuongId, setSelectedPhuongId] = useState<number | null>(null);
  const [phuongXaData, setPhuongXaData] = useState<any>(null);
  const [layers, setLayers] = useState({
    parks: true,
    greenAreas: true,
    trees: true,
    phuongXa: true,
    // Tree status filters
    statusHealthy: true,
    statusSick: true,
    statusFell: true,
    statusNew: true,
    statusProcessing: true,
  });

  const [editingTree, setEditingTree] = useState<{ id: string; lat: number; lng: number } | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [streetViewCoord, setStreetViewCoord] = useState<{lat: number, lng: number} | null>(null);
  const [streetViewMode, setStreetViewMode] = useState<'inactive' | 'selecting'>('inactive');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 1500
          });
        }
      },
      (error) => {
        setIsLocating(false);
        console.error("Lỗi định vị:", error);
        let errorMsg = "Không thể lấy vị trí hiện tại.";
        if (error.code === 1) {
          errorMsg = "Vui lòng cấp quyền truy cập vị trí (GPS) trên trình duyệt của bạn.";
        }
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleViewportChange = useCallback(() => {
    try {
      const map = mapRef.current?.getMap();
      if (!map) return;
      
      const bounds = map.getBounds();
      if (!bounds) return;

      setViewportBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      setZoomLevel(map.getZoom());
    } catch (err) {
      console.warn("Cảnh báo: Không thể cập nhật vùng nhìn bản đồ:", err);
    }
  }, []);

  // Spatial Analysis state
  const [projectBoundary, setProjectBoundary] = useState<{ polygon: Coordinate[]; color: string } | null>(null);
  const [affectedTreeIds, setAffectedTreeIds] = useState<Set<string>>(new Set());

  const statusCounts = useMemo(() => {
    return activeTrees.reduce((acc, t) => {
      acc[t.trangThai] = (acc[t.trangThai] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [activeTrees]);

  const treeGeoJSON = useMemo(() => {
    if (!layers.trees) return treesToGeoJSON([]);
    const filtered = activeTrees.filter(t => {
      if (editingTree && t.id === editingTree.id) return false;
      if (t.trangThai === "khoe" && !layers.statusHealthy) return false;
      if (t.trangThai === "sauBenh" && !layers.statusSick) return false;
      if (t.trangThai === "canDonHa" && !layers.statusFell) return false;
      if (t.trangThai === "moi" && !layers.statusNew) return false;
      if (t.trangThai === "dangXuLy" && !layers.statusProcessing) return false;
      return true;
    });
    return treesToGeoJSON(filtered);
  }, [activeTrees, layers]);
  const parkGeoJSON = useMemo(() => parksToGeoJSON([]), []);
  const greenGeoJSON = useMemo(() => greenAreasToGeoJSON([]), []);

  // GeoJSON for project boundary polygon overlay
  const boundaryGeoJSON = useMemo(() => {
    if (!projectBoundary) return featureCollection([]);
    return featureCollection([polygonToGeoJSON(projectBoundary.polygon, { color: projectBoundary.color })]);
  }, [projectBoundary]);

  // Fetch and process Phường/Xã data to add unique IDs
  useEffect(() => {
    fetch("/data/phuong_xa.json")
      .then(res => res.json())
      .then(data => {
        if (data && data.features) {
          // Gán ID duy nhất cho từng feature để highlight chính xác từng đối tượng
          data.features = data.features.map((f: any, index: number) => ({
            ...f,
            id: index + 1
          }));
        }
        setPhuongXaData(data);
      })
      .catch(err => console.error("Error loading Phường/Xã GeoJSON:", err));
  }, []);

  // Update viewport bounds once map is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      handleViewportChange();
    }, 1000);
    return () => clearTimeout(timer);
  }, [handleViewportChange]);

  // GeoJSON for affected trees (highlighted)
  const affectedTreesGeoJSON = useMemo(() => {
    if (affectedTreeIds.size === 0) return { type: "FeatureCollection" as const, features: [] };
    const affected = activeTrees.filter(t => affectedTreeIds.has(t.id) && t.lat !== null && t.lng !== null);
    return {
      type: "FeatureCollection" as const,
      features: affected.map(t => ({
        type: "Feature" as const,
        properties: { id: t.id },
        geometry: { type: "Point" as const, coordinates: [t.lng!, t.lat!] },
      })),
    };
  }, [affectedTreeIds, activeTrees]);

  // Xóa handleMapLoad vì đã có MapImagesLoader component

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (editingTree) return; // Không cho phép click pop-up khi đang chỉnh sửa vị trí

      if (streetViewMode === 'selecting') {
        setStreetViewCoord({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        setStreetViewMode('inactive');
        return;
      }

      const map = mapRef.current?.getMap();
      if (!map) return;

      // Check clusters first
      const clusterFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (clusterFeatures.length > 0) {
        const feature = clusterFeatures[0];
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource("trees");
        if (source && "getClusterExpansionZoom" in source) {
          (source as unknown as { getClusterExpansionZoom: (id: number, cb: (err: unknown, zoom: number) => void) => void })
            .getClusterExpansionZoom(clusterId, (_err: unknown, zoom: number) => {
              map.easeTo({
                center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
                zoom,
              });
            });
        }
        return;
      }

      // Check tree points
      const treeFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });
      if (treeFeatures.length > 0) {
        const f = treeFeatures[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        setPopupInfo({
          type: "tree",
          lng: coords[0],
          lat: coords[1],
          properties: f.properties || {},
        });
        map.easeTo({ center: coords, duration: 800 });
        return;
      }

      // Check parks
      const parkFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["park-fill"],
      });
      if (parkFeatures.length > 0) {
        const f = parkFeatures[0];
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setPopupInfo({
          type: "park",
          lng: coords[0],
          lat: coords[1],
          properties: f.properties || {},
        });
        map.easeTo({ center: coords, duration: 800 });
        return;
      }

      // Check green areas
      const greenFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["green-fill"],
      });
      if (greenFeatures.length > 0) {
        const f = greenFeatures[0];
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setPopupInfo({
          type: "green",
          lng: coords[0],
          lat: coords[1],
          properties: f.properties || {},
        });
        map.easeTo({ center: coords, duration: 800 });
        return;
      }

      // Check phuongxa (click on fill or label)
      const phuongxaFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["phuongxa-fill", "phuongxa-label"],
      });
      if (phuongxaFeatures.length > 0) {
        // Ưu tiên lấy feature có chứa thông tin tên thực sự (thường là nhãn hoặc đa giác có thuá»™c tính)
        const f = phuongxaFeatures.find(feat => {
          const p = feat.properties || {};
          const n = p.name || p.Name || p.ten_phuong || "";
          return n && !n.includes("PA168");
        }) || phuongxaFeatures[0];
        
        // Sử dụng ID duy nhất đã được gán
        if (f.id !== undefined) {
          setSelectedPhuongId(Number(f.id));
        }

        setPopupInfo(null); // Äóng popup cũ (nếu có) khi chọn vùng ranh giá»›i
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        map.easeTo({ center: coords, duration: 800 });
        return;
      }

      setSelectedPhuongId(null);
      setPopupInfo(null);
    },
    []
  );

  // Change cursor on hover
  const onMouseEnter = useCallback(() => {
    if (streetViewMode === 'selecting') return;
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "pointer";
  }, [streetViewMode]);
  
  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = streetViewMode === 'selecting' ? "crosshair" : "";
  }, [streetViewMode]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const interactiveLayers = ["clusters", "unclustered-point", "park-fill", "green-fill", "phuongxa-fill", "phuongxa-label"];
    interactiveLayers.forEach((layer) => {
      map.on("mouseenter", layer, onMouseEnter);
      map.on("mouseleave", layer, onMouseLeave);
    });

    return () => {
      interactiveLayers.forEach((layer) => {
        map.off("mouseenter", layer, onMouseEnter);
        map.off("mouseleave", layer, onMouseLeave);
      });
    };
  }, [onMouseEnter, onMouseLeave]);

  const statusLabel = (s: string) => {
    switch (s) {
      case "khoe": return "🟢 Khỏe mạnh";
      case "sauBenh": return "🟡 Sâu bệnh";
      case "canDonHa": return "🔴 Cần đốn hạ";
      case "moi": return "🔵 Mới trồng";
      case "dangXuLy": return "🟣 Đang xử lý";
      default: return s;
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-3 border-[#2563eb] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#666] font-medium">Đang khởi tạo GIS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#f5f7fa]">
      <div className="relative w-full h-full">
        <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        cursor={streetViewMode === 'selecting' ? 'crosshair' : ''}
        mapStyle={GOOGLE_HYBRID_STYLE as any}
        onClick={handleMapClick}
        onMoveEnd={handleViewportChange}
        onZoomEnd={handleViewportChange}
        interactiveLayerIds={["clusters", "unclustered-point", "park-fill", "green-fill", "phuongxa-fill", "phuongxa-label"]}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {/* Tree points with clustering */}
        {layers.trees && (
          <Source
            id="trees"
            type="geojson"
            data={treeGeoJSON}
            cluster={true}
            clusterMaxZoom={16}
            clusterRadius={50}
          >
            <Layer {...treeClusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
            <Layer {...treeLabelLayer} />
          </Source>
        )}

        {/* Parks polygons */}
        {layers.parks && (
          <Source id="parks" type="geojson" data={parkGeoJSON}>
            <Layer {...parkFillLayer} />
            <Layer {...parkOutlineLayer} />
          </Source>
        )}

        {/* Green areas polygons */}
        {layers.greenAreas && (
          <Source id="green-areas" type="geojson" data={greenGeoJSON}>
            <Layer {...greenFillLayer} />
            <Layer {...greenOutlineLayer} />
          </Source>
        )}

        {/* Phường xã polygons */}
        {layers.phuongXa && phuongXaData && (
          <Source 
            id="phuongxa" 
            type="geojson" 
            data={phuongXaData}
          >
            <Layer {...phuongXaFillLayer} />
            <Layer 
              {...phuongXaHighlightLayer} 
              filter={["==", ["id"], selectedPhuongId || -1]} 
            />
            <Layer {...phuongXaOutlineLayer} />
            <Layer {...phuongXaLabelLayer} />
          </Source>
        )}

        {/* Project Boundary Overlay */}
        {projectBoundary && (
          <Source id="project-boundary" type="geojson" data={boundaryGeoJSON}>
            <Layer
              id="boundary-fill"
              type="fill"
              source="project-boundary"
              paint={{
                "fill-color": projectBoundary.color,
                "fill-opacity": 0.18,
              }}
            />
            <Layer
              id="boundary-outline"
              type="line"
              source="project-boundary"
              paint={{
                "line-color": projectBoundary.color,
                "line-width": 3,
                "line-dasharray": [4, 3],
              }}
            />
            <Layer
              id="boundary-outline-glow"
              type="line"
              source="project-boundary"
              paint={{
                "line-color": projectBoundary.color,
                "line-width": 8,
                "line-opacity": 0.25,
                "line-blur": 4,
              }}
            />
          </Source>
        )}

        {/* Affected Trees Highlight */}
        {affectedTreeIds.size > 0 && (
          <Source id="affected-trees" type="geojson" data={affectedTreesGeoJSON}>
            <Layer
              id="affected-trees-glow"
              type="circle"
              source="affected-trees"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 8, 14, 14, 18, 22],
                "circle-color": "#ef4444",
                "circle-opacity": 0.3,
                "circle-blur": 0.8,
              }}
            />
            <Layer
              id="affected-trees-ring"
              type="circle"
              source="affected-trees"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 14, 9, 18, 16],
                "circle-color": "transparent",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ef4444",
                "circle-opacity": 0.9,
              }}
            />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            onClose={() => {
              setPopupInfo(null);
              setSelectedPhuongId(null);
            }}
            closeButton={true}
            closeOnClick={false}
            maxWidth="420px"
            className="urban-popup"
          >
            <div className="p-1 min-w-[360px] bg-white text-slate-900">
              {popupInfo.type === "tree" && (() => {
                const p = popupInfo.properties;
                const tt = String(p.trangThai ?? "");
                const pl = String(p.phanLoai ?? "");

                // Màu sắc theo TÌNH TRẠNG cây
                const statusMap: Record<string, { color: string; text: string; icon: string }> = {
                  khoe: { color: "#22c55e", text: "Khỏe mạnh", icon: "🟢" },
                  sauBenh: { color: "#f59e0b", text: "Sâu bệnh", icon: "🟡" },
                  canDonHa: { color: "#ef4444", text: "Cần đốn hạ", icon: "🔴" },
                  moi: { color: "#3b82f6", text: "Mới trồng", icon: "🔵" },
                  dangXuLy: { color: "#a855f7", text: "Đang xử lý", icon: "🟣" },
                };
                const status = statusMap[tt] || statusMap.khoe;

                const plFullMap: Record<string, string> = { MT: "Mới trồng", L1: "Loại 1", L2: "Loại 2", L3: "Loại 3" };
                const plFull = plFullMap[pl] || "—";

                return (
                <div className="pt-1">
                  {/* === TRẠNG THÁI (Badge riêng biệt ở trên để tránh chồng lấn nút X) === */}
                  <div className="flex mb-2">
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: status.color }}>
                       <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                       {status.text}
                    </div>
                  </div>

                  {/* === TIÊU ĐỀ: Tên cây - Số hiệu - Phân loại === */}
                  <div className="mb-4 pr-8">
                    <h3 className="font-bold text-lg text-[#2563eb] tracking-tight leading-tight">
                      {String(p.loaiCay)} - {String(p.soCay)} - {plFull}
                    </h3>
                  </div>

                  {/* === PHẦN 3: Vị trí & Địa chỉ === */}
                  <div className="mb-4">
                    <div className="space-y-1.5 text-sm text-slate-700">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 text-lg w-5 text-center shrink-0">📍</span>
                        <div className="font-medium text-slate-900 leading-tight">
                          {(() => {
                            const diaChi = (p.diaChi && p.diaChi !== "null") ? `${p.diaChi}, ` : "";
                            const tenDuong = String(p.tenDuong);
                            const phuongRaw = String(p.phuong);
                            const wardInfo = wardMap[phuongRaw.toLowerCase()];
                            
                            const type = wardInfo ? wardInfo.type : "Phường (Xã)";
                            const district = wardInfo ? wardInfo.old_district : (() => {
                              const q = String(p.quan);
                              if (q.includes("Quận") || q.includes("Huyện")) return q;
                              return q.match(/^\d+$/) ? `Quận ${q}` : `Huyện ${q}`;
                            })();

                            return `${diaChi}${tenDuong}, ${type} ${phuongRaw} (${district} cũ)`;

                          })()}
                        </div>

                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sky-500 text-lg w-5 text-center">🏢</span>
                        <span className="font-medium">Khu vực: {String(p.kv)}</span>
                      </div>
                    </div>
                  </div>

                  {/* HÌNH ẢNH ĐẠI DIỆN - TO VÀ CĂN GIỮA */}
                  <div className="mb-5 flex justify-center">
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                      {p.avatar || p.hinhAnhDaiDien ? (
                        <img src={String(p.avatar || p.hinhAnhDaiDien)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-300">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="text-xs font-medium opacity-60">Chưa có ảnh đại diện</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* === PHẦN 6: Nút hành động (Bottom Bar) === */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onManageTree?.(String(p.id)); }}
                      className="flex items-center justify-start gap-3 p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 hover:bg-teal-100 transition-all group"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">Quản lý</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePatrol?.({
                          id: String(p.id),
                          name: String(p.loaiCay),
                          location: `${String(p.tenDuong)} · P.${String(p.phuong)} · Q.${String(p.quan)}`,
                          lat: popupInfo.lat,
                          lng: popupInfo.lng,
                        });
                        setPopupInfo(null);
                      }}
                      className="flex items-center justify-start gap-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition-all group"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">Tuần tra</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePatrol?.({
                          id: String(p.id),
                          name: String(p.loaiCay),
                          location: `${String(p.tenDuong)} · P.${String(p.phuong)} · Q.${String(p.quan)}`,
                          lat: popupInfo.lat,
                          lng: popupInfo.lng,
                        });
                        setPopupInfo(null);
                      }}
                      className="flex items-center justify-start gap-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 transition-all group"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">Sự cố</span>
                    </button>
                    <button
                      className="flex items-center justify-start gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 transition-all group"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">Đề xuất</span>
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        setStreetViewCoord({ lat: popupInfo.lat, lng: popupInfo.lng });
                      }}
                      className="flex items-center justify-start gap-3 p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100 transition-all group"
                      title="Xem ảnh đường phố 360 độ"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">Phố cảnh</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (p.id) {
                          setEditingTree({
                            id: String(p.id),
                            lat: popupInfo.lat,
                            lng: popupInfo.lng
                          });
                          setPopupInfo(null);
                        } else {
                          alert("Cây này chưa có ID hợp lệ để di chuyển.");
                        }
                      }}
                      className="flex items-center justify-start gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all group"
                      title="Kéo thả để cập nhật vị trí"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3 3M2 12h20M12 2v20"/></svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">Dời vị trí</span>
                    </button>
                  </div>
                </div>
                );
              })()}

              {popupInfo.type === "park" && (
                <div style={{ color: '#333' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">ðŸžï¸</span>
                    <div>
                      <h3 className="font-bold text-sm">
                        {String(popupInfo.properties.ten)}
                      </h3>
                      <p className="text-xs opacity-70">
                        Cấp {String(popupInfo.properties.capDo)} â€¢ {String(popupInfo.properties.phuong)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs mb-2">
                    Tá»•ng DT: <strong>{Number(popupInfo.properties.tongDienTich).toLocaleString()} m²</strong>
                  </p>
                  <p className="text-[11px] text-[#999] italic">Dữ liệu khối lượng duy tu sẽ được kết nối từ Supabase.</p>
                </div>
              )}

              {popupInfo.type === "green" && (
                <div style={{ color: '#333' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">ðŸŒ¿</span>
                    <div>
                      <h3 className="font-bold text-sm">
                        {String(popupInfo.properties.ten)}
                      </h3>
                      <p className="text-xs opacity-70">{String(popupInfo.properties.phuong)}</p>
                    </div>
                  </div>
                  <p className="text-xs">
                    Diện tích: <strong>{Number(popupInfo.properties.dienTich).toLocaleString()} m²</strong>
                  </p>
                </div>
              )}

            </div>
          </Popup>
        )}

        {/* Edit Marker */}
        {editingTree && (
          <Marker
            longitude={editingTree.lng}
            latitude={editingTree.lat}
            draggable
            onDragEnd={(e) => setEditingTree({ ...editingTree, lng: e.lngLat.lng, lat: e.lngLat.lat })}
            anchor="bottom"
          >
            <div className="text-4xl filter drop-shadow-xl cursor-grab active:cursor-grabbing animate-bounce">ðŸ“</div>
          </Marker>
        )}
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
              <div className="absolute w-5 h-5 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Nhóm công cụ Bản đồ (Định vị & Phố cảnh) - Tích hợp cùng cột với cụm Zoom */}
      <div className="absolute top-[105px] right-[10px] z-10 flex flex-col bg-white rounded-[4px] border border-slate-300/70 shadow-md overflow-hidden w-[29px]">
        {/* Nút định vị vị trí hiện tại */}
        <button
          onClick={handleGeolocate}
          disabled={isLocating}
          className="w-[29px] h-[29px] flex items-center justify-center bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-200/80 disabled:opacity-70 cursor-pointer"
          title="Định vị vị trí của tôi"
        >
          {isLocating ? (
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5">
              <circle cx="12" cy="12" r="7" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="3" fill="#2563eb" className="animate-pulse" />
            </svg>
          )}
        </button>

        {/* Nút bật/tắt Chế độ Street View */}
        <button
          onClick={() => setStreetViewMode(prev => prev === 'selecting' ? 'inactive' : 'selecting')}
          className={`w-[29px] h-[29px] flex items-center justify-center transition-colors cursor-pointer ${
            streetViewMode === 'selecting'
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600'
          }`}
          title="Xem ảnh đường phố 360 độ (Phố cảnh)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>

      {/* Edit Location Control Panel */}
      {editingTree && (
        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto card px-5 py-4 flex flex-col items-center gap-4 z-50 w-auto sm:w-[360px] border border-[#10b981] shadow-2xl shadow-emerald-500/20 fade-in bg-white">
          <div className="flex items-start gap-4 w-full">
            <div className="w-10 h-10 shrink-0 rounded-full bg-[#ecfdf5] flex items-center justify-center animate-pulse border border-[#34d399]">
              <i className="material-icons text-[#10b981]">place</i>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1e293b] m-0 leading-tight">Cập nhật tọa độ mới</h3>
              <p className="text-xs text-[#64748b] mt-1 leading-relaxed">Hãy di chuyển bản đồ và kéo thả ghim màu đỏ đến vị trí chính xác của cây.</p>
            </div>
          </div>
          <div className="flex w-full gap-3 mt-1">
            <button
              onClick={() => setEditingTree(null)}
              disabled={isSavingLocation}
              className="btn-secondary"
              style={{ flex: 1, padding: "8px 16px", justifyContent: "center" }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={async () => {
                setIsSavingLocation(true);
                try {
                  const { error } = await supabase
                    .from('trees')
                    .update({ lat: editingTree.lat, lng: editingTree.lng })
                    .eq('id', editingTree.id);
                    
                  if (error) throw error;
                  
                  alert("Đã lưu vị trí cây thành công!");
                  setEditingTree(null);
                } catch (err: any) {
                  console.error("Lỗi cập nhật vị trí:", err);
                  alert("Lỗi khi lưu vị trí: " + (err.message || "Không xác định"));
                } finally {
                  setIsSavingLocation(false);
                }
              }}
              disabled={isSavingLocation}
              className="btn-primary"
              style={{ flex: 1, padding: "8px 16px", justifyContent: "center", backgroundColor: "#10b981", borderColor: "#10b981" }}
            >
              <i className="material-icons" style={{ fontSize: 18 }}>{isSavingLocation ? "sync" : "save"}</i>
              {isSavingLocation ? "Đang lưu..." : "Lưu vị trí"}
            </button>
          </div>
        </div>
      )}

      {/* Nút Lớp dữ liệu kiểu Google */}
      <button
        onClick={() => setIsLayersOpen(prev => !prev)}
        className={`absolute top-4 left-4 sm:top-6 sm:left-6 z-10 w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer ${
          isLayersOpen
            ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
        }`}
        title="Lớp dữ liệu bản đồ"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>

      {/* Layer Control Panel */}
      {isLayersOpen && (
        <div
          id="layer-control"
          className="absolute top-16 left-4 right-4 sm:top-20 sm:left-6 sm:right-auto z-10 w-auto sm:w-[260px] card px-5 py-5 fade-in border border-slate-200 shadow-2xl bg-white"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 mt-1">
            <p className="text-[12px] font-bold text-blue-600 uppercase tracking-widest">
              Lớp dữ liệu
            </p>
            <button
              onClick={() => setIsLayersOpen(false)}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {[
              { key: "trees" as const, label: "Cây xanh", color: "#22c55e", count: activeTrees.length, subLayers: [
                { key: "statusHealthy" as const, label: "Khỏe mạnh", color: "#22c55e", count: statusCounts.khoe || 0 },
                { key: "statusSick" as const, label: "Sâu bệnh", color: "#f59e0b", count: statusCounts.sauBenh || 0 },
                { key: "statusFell" as const, label: "Cần đốn hạ", color: "#ef4444", count: statusCounts.canDonHa || 0 },
                { key: "statusNew" as const, label: "Mới trồng", color: "#3b82f6", count: statusCounts.moi || 0 },
                { key: "statusProcessing" as const, label: "Đang xử lý", color: "#a855f7", count: statusCounts.dangXuLy || 0 },
              ]},
              { key: "parks" as const, label: "Công viên", color: "#14b8a6", count: 0 },
              { key: "greenAreas" as const, label: "Mảng xanh", color: "#22c55e", count: 0 },
              { key: "phuongXa" as const, label: "Phường/Xã", color: "#eab308", count: 168 },
            ].map((item) => (
              <div key={item.key} className="space-y-2">
                <label className="flex items-center gap-5 cursor-pointer group py-3 hover:bg-white/5 rounded-xl px-3 -mx-3 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={layers[item.key]}
                    onChange={() => setLayers((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center border transition-all ${
                      layers[item.key]
                        ? "border-transparent shadow-md scale-110"
                        : "border-[#999] bg-[#f5f7fa] scale-100"
                    }`}
                    style={layers[item.key] ? { backgroundColor: item.color } : {}}
                  >
                    {layers[item.key] && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#333] transition-colors">
                    {item.label}
                  </span>
                  {"count" in item && (
                    <span className="text-xs font-semibold text-[#666] ml-auto tabular-nums bg-[#e0e0e0] px-2 py-0.5 rounded-full min-w-[32px] text-center">
                      {item.count}
                    </span>
                  )}
                </label>

                {/* Render sub-layers (status filters) if trees is active */}
                {item.key === "trees" && layers.trees && item.subLayers && (
                  <div className="ml-8 space-y-3 pt-1 border-l border-white/10 pl-4">
                    {item.subLayers.map((sub) => (
                      <label key={sub.key} className="flex items-center gap-4 cursor-pointer group py-1.5 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={layers[sub.key]}
                          onChange={() => setLayers((prev) => ({ ...prev, [sub.key]: !prev[sub.key] }))}
                          className="sr-only"
                        />
                        <div
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${
                            layers[sub.key]
                              ? "border-transparent shadow-sm"
                              : "border-[#999] bg-transparent"
                          }`}
                          style={layers[sub.key] ? { backgroundColor: sub.color } : {}}
                        >
                        </div>
                        <span className="text-xs font-medium text-[#666] transition-colors">
                          {sub.label}
                        </span>
                        {"count" in sub && (
                          <span className="text-[10px] font-medium text-[#999] ml-auto tabular-nums bg-[#e0e0e0] px-1.5 py-0.5 rounded-full min-w-[24px] text-center">
                            {sub.count}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spatial Analysis Panel */}
      <SpatialAnalysisPanel
        trees={activeTrees}
        onProjectBoundaryChange={setProjectBoundary}
        onAffectedTreeIds={setAffectedTreeIds}
        isOpen={isSpatialOpen}
        setIsOpen={setIsSpatialOpen}
      />
      
      {/* Street View Panel Overlay Toàn màn hình */}
      {streetViewCoord && (
        <div className="absolute inset-0 z-[100] fade-in bg-black">
          <StreetViewPanel 
            coord={streetViewCoord} 
            trees={activeTrees} 
            onClose={() => setStreetViewCoord(null)} 
          />
        </div>
      )}
      
      </div>
    </div>
  );
}

