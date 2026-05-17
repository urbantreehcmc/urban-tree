export interface TreeRecord {
  id: string;
  ma: number;
  cty: string;
  xn: string;
  goi: number;
  kv: string;
  diaChi: string;
  phuong: string;
  quan: string;
  giamSat: string;
  tenDuong: string;
  le: string;
  loaiCay: string;
  soCay: string;
  namTrong: number | null;
  phanLoai: string;
  phanTan: boolean;
  bon: boolean;
  hvn: number;
  c13: number;
  ghiChu: string;
  lat: number | null;
  lng: number | null;
  trangThai: "khoe" | "sauBenh" | "canDonHa" | "moi" | "dangXuLy";
  image?: string;
}

export interface ParkRecord {
  id: string;
  ten: string;
  phuong: string;
  quan: number;
  capDo: number;
  dienTichDuyTu: number;
  dienTichKhongDuyTu: number;
  tongDienTich: number;
  coordinates: [number, number][];
}

export interface ParkAsset {
  id: string;
  parkId: string;
  hangMuc: string;
  dvt: string;
  khoiLuong: number;
  ghiChu: string;
  loai: "cayTrong" | "haTang" | "thietBi" | "dienTichKhac";
}

export interface GreenAreaRecord {
  id: string;
  ten: string;
  phuong: string;
  quan: number;
  dienTich: number;
  coordinates: [number, number][];
}

export interface TaskRecord {
  id: string;
  title: string;
  type: "routine" | "non-routine";
  assignee: string;
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  location: string;
  priority: "low" | "medium" | "high";
  description: string;
}

export interface IssueRecord {
  id: string;
  title: string;
  reporter: string;
  reportDate: string;
  status: "new" | "verified" | "resolved";
  location: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  role: "admin" | "investor" | "contractor" | "supervisor" | "worker";
  organization: string;
  area: string;
  status: "active" | "inactive";
  lastLogin: string;
  email: string;
}

export interface PatrolRecord {
  id: string;
  treeId: string;
  treeMa: string;
  species: string;
  date: string;
  status: string;
  inspector: string;
  notes: string;
}

export interface MaintenanceRecord {
  id: string;
  treeId: string;
  date: string;
  content: string;
  unit: string;
  images: string[];
  notes: string;
}

export interface ContractRecord {
  id: string;
  code: string;
  name: string;
  type: "maintenance" | "planting" | "infrastructure" | "other";
  value: number;
  startDate: string;
  endDate: string;
  contractorId: string;
  status: "active" | "completed" | "suspended" | "bidding";
  description: string;
}

export interface ContractorRecord {
  id: string;
  name: string;
  taxCode: string;
  address: string;
  representative: string;
  phone: string;
  email: string;
  specialization: string;
  rating: number;
}
