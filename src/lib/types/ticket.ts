// =====================================================
// Types: Hệ thống Quản lý Sự cố Cây xanh (5 Bước)
// =====================================================

/** Mức độ khẩn cấp */
export type UrgencyLevel = "khan_cap" | "thuong";

/** Trạng thái vòng đời của Ticket */
export type TicketStatus = "moi" | "cho_duyet" | "da_duyet" | "dang_thi_cong" | "hoan_thanh" | "tu_choi";

/** Loại xử lý (theo flowchart) */
export type ProcessType =
  | "giai_toa_cay_nga"
  | "giai_toa_canh_gay"
  | "don_ha_trong_lai"
  | "don_ha_thanh_ly"
  | "ha_thap_chieu_cao"
  | "cat_thap"
  | "cat_me"
  | "trong_lai"
  | "thanh_ly"
  | "khac";

/** Tình trạng hiện trường (checkbox multi-select) */
export type FieldCondition =
  | "bong_goc"
  | "chet_kho"
  | "re_noi"
  | "sam_muc"
  | "nga_do"
  | "canh_gay"
  | "don_trai_phep"
  | "bi_mat"
  | "ha_thap"
  | "treo_quang_cao"
  | "sau_benh"
  | "cay_nghieng"
  | "nhom_goc";

/** Nhật ký tuần tra - Bước 1 */
export interface PatrolLog {
  id: string;
  tree_id: string;
  lat: number | null;
  lng: number | null;
  muc_do_khan_cap: UrgencyLevel;
  tinh_trang: FieldCondition[];
  mo_ta: string | null;
  hinh_anh: string[];
  nguoi_tuan_tra: string | null;
  ticket_id: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields (from tree_assets, tree_locations)
  loai_cay?: string;
  ten_duong?: string;
  phuong?: string;
  quan?: string | number;
  hieu_so_cay?: string;
}

/** Ticket - Hồ sơ xử lý sự cố (vòng đời) */
export interface Ticket {
  id: string;
  tree_id: string;
  patrol_log_id: string | null;
  trang_thai: TicketStatus;
  loai_xu_ly: ProcessType | null;
  nguoi_phu_trach: string | null;
  nguoi_duyet: string | null;
  ly_do_tu_choi: string | null;
  ngay_duyet: string | null;
  ngay_bat_dau_thi_cong: string | null;
  ngay_hoan_thanh: string | null;
  created_at: string;
  updated_at: string;

  // Joined/nested data
  patrol_log?: PatrolLog;
  proposal?: Proposal;
  as_built?: AsBuiltLog;
  loai_cay?: string;
  ten_duong?: string;
  phuong?: string;
  quan?: string | number;
  hieu_so_cay?: string;
}

/** Đề xuất xử lý - Bước 2 */
export interface Proposal {
  id: string;
  ticket_id: string;
  phuong_an_xu_ly: string | null;
  the_tich_go_m3: number;
  cui_nhanh_ster: number;
  phuong_an_an_toan: string | null;
  trong_lai: boolean;
  loai_cay_trong_lai: string | null;
  quy_cach_trong_lai: string | null;
  ly_do_khong_trong: string | null;
  tai_lap: string | null;
  file_dinh_kem: string[];
  created_at: string;
}

/** Hoàn công - Bước 4 */
export interface AsBuiltLog {
  id: string;
  ticket_id: string;
  the_tich_go_thuc_te: number;
  cui_nhanh_thuc_te: number;
  dien_tich_via_he: number;
  giai_trinh_chenh_lech: string | null;
  anh_hoan_cong: string[];
  phieu_can_xe: string[];
  xac_nhan_nha_thau: boolean;
  ten_nguoi_ky_nha_thau: string | null;
  xac_nhan_giam_sat: boolean;
  ten_nguoi_ky_giam_sat: string | null;
  ngay_ky: string | null;
  created_at: string;
}

// =====================================================
// Labels & Display Helpers
// =====================================================

export const TICKET_STATUS_MAP: Record<TicketStatus, { label: string; color: string; bg: string; icon: string }> = {
  moi:            { label: "Mới ghi nhận",  color: "#2563eb", bg: "#dbeafe", icon: "fiber_new" },
  cho_duyet:      { label: "Chờ duyệt",    color: "#d97706", bg: "#fef3c7", icon: "hourglass_top" },
  da_duyet:       { label: "Đã duyệt",     color: "#059669", bg: "#d1fae5", icon: "check_circle" },
  dang_thi_cong:  { label: "Đang thi công", color: "#7c3aed", bg: "#f3e8ff", icon: "engineering" },
  hoan_thanh:     { label: "Hoàn thành",    color: "#16a34a", bg: "#dcfce7", icon: "task_alt" },
  tu_choi:        { label: "Từ chối",       color: "#dc2626", bg: "#fee2e2", icon: "cancel" },
};

export const PROCESS_TYPE_MAP: Record<ProcessType, string> = {
  giai_toa_cay_nga: "Giải tỏa cây ngã",
  giai_toa_canh_gay: "Giải tỏa cành gãy",
  don_ha_trong_lai: "Đốn hạ, trồng lại",
  don_ha_thanh_ly: "Đốn hạ, thanh lý",
  ha_thap_chieu_cao: "Hạ thấp chiều cao",
  cat_thap: "Cắt thấp",
  cat_me: "Cắt mé",
  trong_lai: "Trồng lại",
  thanh_ly: "Thanh lý",
  khac: "Khác",
};

export const URGENCY_MAP: Record<UrgencyLevel, { label: string; color: string; bg: string }> = {
  khan_cap: { label: "Khẩn cấp", color: "#dc2626", bg: "#fee2e2" },
  thuong:   { label: "Thông thường", color: "#059669", bg: "#d1fae5" },
};

export const FIELD_CONDITION_MAP: Record<FieldCondition, string> = {
  bong_goc: "Bọng gốc",
  chet_kho: "Chết khô",
  re_noi: "Rễ nổi",
  sam_muc: "Sam mục thân",
  nga_do: "Ngã đổ",
  canh_gay: "Cành gãy",
  don_trai_phep: "Bị đốn trái phép",
  bi_mat: "Bị mất",
  ha_thap: "Cần hạ thấp",
  treo_quang_cao: "Treo quảng cáo/đèn",
  sau_benh: "Sâu bệnh",
  cay_nghieng: "Cây nghiêng",
  nhom_goc: "Nhổm gốc",
};
