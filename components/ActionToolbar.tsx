import React, { useState } from 'react';
import { Copy, FileSpreadsheet, Check, ChevronDown } from 'lucide-react';
import { Product, CopyMode } from '../types';
import * as XLSX from 'xlsx';

interface ActionToolbarProps {
  products: Product[];
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ products }) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (products.length === 0) return null;

  const handleCopy = (mode: CopyMode) => {
    let textToCopy = '';
    
    switch (mode) {
      case CopyMode.NAME_ONLY:
        textToCopy = products.map(p => p.name).join('\n');
        break;
      case CopyMode.IMAGE_ONLY:
        textToCopy = products.map(p => p.imageUrl).join('\n');
        break;
      case CopyMode.ALL:
      default:
        // Tab separated for Google Sheets
        textToCopy = products.map(p => `${p.name}\t${p.imageUrl}`).join('\n');
        break;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(mode);
      setIsDropdownOpen(false);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map(p => ({
        "Tên Sản Phẩm": p.name,
        "Link Ảnh": p.imageUrl
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "danh_sach_san_pham.xlsx");
  };

  const getCopyLabel = (mode: CopyMode) => {
    switch (mode) {
      case CopyMode.NAME_ONLY: return "Copy cột Tên";
      case CopyMode.IMAGE_ONLY: return "Copy cột Ảnh";
      default: return "Copy tất cả (cho GSheet)";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 transition-colors duration-200">
      <div>
        <h3 className="text-blue-900 dark:text-blue-200 font-semibold">Kết quả: {products.length} sản phẩm</h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm">Dữ liệu đã sẵn sàng để xuất hoặc sao chép.</p>
      </div>

      <div className="flex gap-2">
        {/* Dropdown for Copy */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
          >
            {copySuccess ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />}
            {copySuccess ? 'Đã Copy!' : 'Copy dữ liệu'}
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10 border border-gray-100 dark:border-gray-600">
              <div className="py-1" role="menu">
                {[CopyMode.ALL, CopyMode.NAME_ONLY, CopyMode.IMAGE_ONLY].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleCopy(mode)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    role="menuitem"
                  >
                    {getCopyLabel(mode)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Excel Button */}
        <button
          onClick={handleExportExcel}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm font-medium"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Xuất Excel
        </button>
      </div>
    </div>
  );
};