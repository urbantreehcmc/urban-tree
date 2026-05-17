"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ onClose, onSuccess }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể cập nhật mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/50 animate-fade-in-up">
        <div className="pt-8 pb-6 px-8 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#666] hover:bg-black/10 transition-colors"
          >
            <i className="material-icons text-sm">close</i>
          </button>
          
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center shadow-lg mb-4 text-amber-600">
            <i className="material-icons text-3xl">vpn_key</i>
          </div>
          <h2 className="text-2xl font-bold text-[#333]">Đổi Mật Khẩu</h2>
          <p className="text-sm text-[#666] mt-2">
            Vui lòng thay đổi mật khẩu mặc định để bảo vệ tài khoản
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <i className="material-icons text-base mt-0.5">error_outline</i>
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">Mật khẩu mới</label>
              <div className="relative">
                <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xl">lock</i>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xl">lock_outline</i>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2563eb] focus:bg-white transition-colors"
                  placeholder="Nhập lại mật khẩu..."
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-amber-500 text-white font-semibold py-3 rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
