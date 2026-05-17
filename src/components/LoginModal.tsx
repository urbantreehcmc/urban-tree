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
        // Đăng ký xong, tuỳ thuộc cài đặt Supabase có bắt verify email không.
        // Tạm thời báo thành công và có thể vào trạng thái pending.
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/50 animate-fade-in-up">
        {/* Header */}
        <div className="pt-8 pb-6 px-8 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#666] hover:bg-black/10 transition-colors"
          >
            <i className="material-icons text-sm">close</i>
          </button>
          
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#2563eb] to-[#7e3af2] rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <i className="material-icons text-white text-3xl">nature_people</i>
          </div>
          <h2 className="text-2xl font-bold text-[#333]">
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <p className="text-sm text-[#666] mt-2">
            {mode === "login" 
              ? "Truy cập hệ thống quản lý UrbanTree GIS" 
              : "Đăng ký để chờ Admin phê duyệt truy cập"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <i className="material-icons text-base mt-0.5">error_outline</i>
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1.5">Họ và tên</label>
                <div className="relative">
                  <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xl">person</i>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                    placeholder="Nhập họ và tên..."
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">Email</label>
              <div className="relative">
                <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xl">email</i>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                  placeholder="admin@urbantree.vn"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">Mật khẩu</label>
              <div className="relative">
                <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xl">lock</i>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-[#2563eb] text-white font-semibold py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="material-icons animate-spin text-sm">autorenew</i>
                Đang xử lý...
              </span>
            ) : mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
          </button>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-sm text-[#2563eb] font-medium hover:underline"
            >
              {mode === "login" 
                ? "Chưa có tài khoản? Đăng ký ngay" 
                : "Đã có tài khoản? Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
