"use client";

export default function Footer() {
  return (
    <footer style={{
      height: 36,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderTop: "1px solid #eee",
      background: "white",
      color: "#999",
      fontSize: 12,
    }}>
      <p>© 2026 <strong style={{ color: "#333" }}>UrbanTree GIS</strong> · Phát triển bởi <span style={{ color: "#2563eb" }}>UrbanTree Team</span></p>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>v2.1.0</p>
    </footer>
  );
}
