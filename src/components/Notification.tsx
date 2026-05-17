"use client";

import React from "react";

export type NotificationType = "success" | "error" | "warning" | "info" | "question";

interface NotificationProps {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Notification({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}: NotificationProps) {
  if (!isOpen) return null;

  const config = {
    success: { icon: "check_circle", color: "#22c55e", bg: "#f0fdf4" },
    error: { icon: "error", color: "#ef4444", bg: "#fef2f2" },
    warning: { icon: "warning", color: "#f59e0b", bg: "#fffbeb" },
    info: { icon: "info", color: "#3b82f6", bg: "#eff6ff" },
    question: { icon: "help", color: "#7c3aed", bg: "#f5f3ff" },
  };

  const style = config[type];

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="card" style={{ 
        width: "100%", 
        maxWidth: 400, 
        padding: 32, 
        textAlign: "center", 
        borderRadius: 24, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        animation: "slideUp 0.3s ease-out"
      }}>
        {/* Icon */}
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: "50%", 
          background: style.bg, 
          color: style.color, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 24px" 
        }}>
          <i className="material-icons" style={{ fontSize: 48 }}>{style.icon}</i>
        </div>

        {/* Content */}
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>{title}</h3>
        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, marginBottom: 32 }}>{message}</p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {onCancel && (
            <button 
              onClick={onCancel}
              style={{ 
                padding: "12px 24px", 
                borderRadius: 12, 
                border: "1px solid #e2e8f0", 
                background: "white", 
                color: "#64748b", 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            style={{ 
              padding: "12px 32px", 
              borderRadius: 12, 
              border: "none", 
              background: style.color, 
              color: "white", 
              fontSize: 14, 
              fontWeight: 600, 
              cursor: "pointer",
              boxShadow: `0 4px 14px 0 ${style.color}66`,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
