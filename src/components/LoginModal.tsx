"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Dành cho đăng ký
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: "450px", overflow: "hidden" }}>
        
        {/* HEADER */}
        <div className="modal-header" style={{ display: "flex", flexDirection: "column", padding: "20px", borderBottom: "1px solid #eee", background: "#f9fafb", position: "relative" }}>
          <button 
            onClick={onClose} 
            style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", color: "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            &times;
          </button>
          
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px", marginTop: "10px" }}>
            <div style={{ width: "80px", height: "80px", background: "linear-gradient(to right, #2563eb, #7e3af2)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(37,99,235,0.3)" }}>
               <i className="material-icons" style={{ fontSize: "40px", color: "white" }}>nature_people</i>
            </div>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#333", textAlign: "center", margin: "0 0 5px 0" }}>
            {mode === "login" ? "HỆ THỐNG QUẢN LÝ CÂY XANH" : "ĐĂNG KÝ TÀI KHOẢN"}
          </h2>
          <p style={{ color: "#666", fontSize: "14px", textAlign: "center", margin: 0 }}>
            {mode === "login" ? "Vui lòng đăng nhập để tiếp tục" : "Tạo tài khoản để gửi yêu cầu phê duyệt"}
          </p>
        </div>

        {/* BODY */}
        <div className="modal-body" style={{ padding: "30px 25px" }}>
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ padding: "10px 15px", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: "4px", fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="material-icons" style={{ fontSize: "18px" }}>error_outline</i>
                {errorMsg}
              </div>
            )}

            {mode === "register" && (
              <div className="form-group">
                <label>Họ và tên: <span style={{ color: "#ef4444" }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                />
              </div>
            )}

            <div className="form-group">
              <label>Email đăng nhập: <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="email" 
                className="form-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ví dụ: admin@urbantree.vn"
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu: <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="password" 
                className="form-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ fontFamily: "monospace", letterSpacing: "2px" }}
              />
            </div>

            <div style={{ marginTop: "30px", marginBottom: "15px" }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ width: "100%", padding: "12px", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {loading ? (
                  <><i className="material-icons" style={{ animation: "spin 1s linear infinite" }}>autorenew</i> Đang xử lý...</>
                ) : (
                  <>{mode === "login" ? "Đăng nhập" : "Đăng ký"}</>
                )}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #eee" }}>
              <span style={{ color: "#666", fontSize: "14px" }}>
                {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"} 
              </span>
              <button 
                type="button" 
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "500", fontSize: "14px", cursor: "pointer", marginLeft: "5px" }}
              >
                {mode === "login" ? "Đăng ký ngay" : "Đăng nhập ngay"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
