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
  const [remember, setRemember] = useState(false);
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative bg-[#e9ecf1] w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#666] hover:bg-black/10 transition-colors z-10"
        >
          <i className="material-icons text-sm">close</i>
        </button>

        <div className="px-8 pt-10 pb-8 flex flex-col items-center">
          {/* Header Texts */}
          <h2 className="text-[18px] font-bold text-[#1a1a1a] uppercase text-center mb-6 leading-tight">
            {mode === "login" ? (
              <>HỆ THỐNG QUẢN LÝ DỮ LIỆU<br />CÂY XANH ĐÔ THỊ</>
            ) : (
              <>ĐĂNG KÝ TÀI KHOẢN TRUY CẬP<br />HỆ THỐNG CÂY XANH</>
            )}
          </h2>

          {/* Logo Area */}
          <div className="w-24 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
            <div className="flex flex-col items-center justify-center text-[#2563eb]">
              <i className="material-icons text-3xl mb-0.5">park</i>
              <span className="text-[10px] font-bold tracking-wider">URBANTREE</span>
            </div>
          </div>

          <h3 className="text-[13px] font-bold text-[#333] mb-2 uppercase">GIS-SXD</h3>
          
          <div className="bg-[#e0e7ff] text-[#3730a3] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide mb-8">
            Trung Tâm Quản Lý Hạ Tầng
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                <i className="material-icons text-base mt-0.5">error_outline</i>
                <p>{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <i className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]">person</i>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-[#d1d5db] rounded-lg !py-2.5 !pl-10 !pr-4 text-[14px] text-[#333] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">Email</label>
                <div className="relative">
                  <i className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]">email</i>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg !py-2.5 !pl-10 !pr-4 text-[14px] text-[#333] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                    placeholder="Tài khoản email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <i className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]">lock</i>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg !py-2.5 !pl-10 !pr-4 text-[14px] text-[#333] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all tracking-widest font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between !mt-4 !mb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${remember ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-white border-[#d1d5db] group-hover:border-[#3b82f6]'}`}>
                    {remember && <i className="material-icons text-white text-[12px]">check</i>}
                  </div>
                  <input type="checkbox" className="hidden" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="text-[13px] text-[#6b7280]">Nhớ mật khẩu</span>
                </label>
                <a href="#" className="text-[13px] text-[#3b82f6] hover:underline font-medium">
                  Quên mật khẩu?
                </a>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full !mt-5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium !py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-[14px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="material-icons animate-spin text-[16px]">autorenew</i>
                  Đang xử lý...
                </span>
              ) : mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-[#d1d5db]"></div>
              <span className="px-3 text-[11px] text-[#6b7280] font-medium uppercase tracking-wide">Hoặc sử dụng</span>
              <div className="flex-1 h-px bg-[#d1d5db]"></div>
            </div>

            {/* Google Login Button */}
            <button 
              type="button"
              className="w-full bg-white hover:bg-gray-50 border border-[#d1d5db] text-[#374151] font-medium py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-[14px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Tài khoản Google
            </button>

            {/* Footer toggle mode */}
            <div className="mt-8 text-center text-[13px] text-[#6b7280]">
              {mode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button 
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-[#3b82f6] font-medium hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button 
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-[#3b82f6] font-medium hover:underline"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
