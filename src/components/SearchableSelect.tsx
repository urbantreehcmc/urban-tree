"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Đồng bộ searchTerm với value khi không focus
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  return (
    <div style={{ position: "relative", width: "100%" }} ref={containerRef}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="form-input"
          style={{ 
            paddingRight: "30px", 
            background: disabled ? "#f5f5f5" : "#fff",
            cursor: disabled ? "not-allowed" : "text"
          }}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            // Nếu xóa hết thì trigger onChange rỗng
            if (e.target.value === "") onChange("");
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />
        <i 
          className="material-icons" 
          style={{ 
            position: "absolute", 
            right: "8px", 
            top: "50%", 
            transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : ''}`, 
            fontSize: "18px", 
            color: "#999",
            pointerEvents: "none",
            transition: "transform 0.2s"
          }}
        >
          expand_more
        </i>
      </div>

      {isOpen && !disabled && (
        <div style={{ 
          position: "absolute", 
          top: "100%", 
          left: 0, 
          right: 0, 
          marginTop: "4px", 
          background: "#fff", 
          border: "1px solid #ddd", 
          borderRadius: "4px", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", 
          zIndex: 1000,
          maxHeight: "240px",
          overflowY: "auto"
        }}>
          {filteredOptions.length > 0 ? (
            <>
              {searchTerm && (
                <div 
                  onClick={() => {
                    onChange("");
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                  style={{ padding: "8px 12px", fontSize: "12px", color: "#2563eb", borderBottom: "1px solid #eee", cursor: "pointer", fontWeight: 500 }}
                >
                  Xóa lựa chọn
                </div>
              )}
              {filteredOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onChange(opt);
                    setSearchTerm(opt);
                    setIsOpen(false);
                  }}
                  style={{ 
                    padding: "8px 12px", 
                    fontSize: "13px", 
                    cursor: "pointer",
                    background: value === opt ? "#f0f4ff" : "transparent",
                    color: value === opt ? "#2563eb" : "#333",
                    fontWeight: value === opt ? 600 : 400
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = value === opt ? "#f0f4ff" : "transparent")}
                >
                  {opt}
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: "12px", textAlign: "center", color: "#999", fontSize: "12px" }}>
              Không tìm thấy kết quả
            </div>
          )}
        </div>
      )}
    </div>
  );
}


