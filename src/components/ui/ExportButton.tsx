import React from "react";
import { FaFileExcel } from "react-icons/fa";

interface ExportButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, children = "Export to Excel", className = "" }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-green-500 hover:from-green-500 hover:to-yellow-400 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-150 text-base focus:outline-none focus:ring-2 focus:ring-yellow-300 active:scale-95 ${className}`}
    style={{ minWidth: 160 }}
  >
    <FaFileExcel className="text-xl" />
    {children}
  </button>
);

export default ExportButton;
