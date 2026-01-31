import React, { useState, useEffect } from 'react';
import { Loader2, ClipboardPaste, FileText, MousePointer2 } from 'lucide-react';
import { BookmarkletTool } from './BookmarkletTool';

// Extend Window interface to include our custom auto-paste function
declare global {
  interface Window {
    magicPickerAutoPaste: (data: string) => void;
  }
}

interface InputSectionProps {
  onAnalyze: (content: string) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  // Magic/Paste Mode State
  const [rawContent, setRawContent] = useState('');

  // Effect to register the global auto-paste function for the bookmarklet
  useEffect(() => {
    window.magicPickerAutoPaste = (data: string) => {
      // 1. Set content
      setRawContent(data);
      // 2. Trigger analysis immediately
      onAnalyze(data);
    };

    // Cleanup
    return () => {
      // @ts-ignore
      delete window.magicPickerAutoPaste;
    };
  }, [onAnalyze]);

  const handleSubmitContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawContent.trim()) {
      onAnalyze(rawContent);
    }
  };

  return (
    <div className="space-y-6">
      {/* Magic Picker Tool - Always visible now */}
      <BookmarkletTool />

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200 overflow-hidden">
        <div className="p-6">
            <div className="mb-4 flex items-center gap-2 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Vùng dán dữ liệu</h3>
            </div>

            <form onSubmit={handleSubmitContent} className="space-y-4">
              <div>
                <label htmlFor="raw-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dữ liệu JSON từ Magic Picker hoặc Text copy
                </label>
                <div className="relative">
                  <textarea
                    id="raw-content"
                    required
                    rows={6}
                    placeholder={`Cách dùng:
1. Kéo nút "Magic Picker" ở trên lên thanh Bookmarks.
2. Vào Shopee/Lazada, bấm bookmarklet để chọn sản phẩm.
3. Bấm "COPY" trên tool, dữ liệu sẽ tự động điền vào đây.
4. Hoặc bạn có thể dán thủ công danh sách link ảnh vào đây.`}
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm font-mono text-xs"
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                 <button
                  type="submit"
                  disabled={isLoading || !rawContent}
                  className={`flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                    (isLoading || !rawContent) ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="-ml-1 mr-2 h-5 w-5" />
                      Trích xuất dữ liệu
                    </>
                  )}
                </button>
                
                {/* Manual paste helper button */}
                <button
                   type="button"
                   onClick={async () => {
                     try {
                       const text = await navigator.clipboard.readText();
                       setRawContent(text);
                     } catch (err) {
                       alert("Không thể truy cập Clipboard. Vui lòng dán thủ công (Ctrl+V).");
                     }
                   }}
                   className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
                   title="Dán từ bộ nhớ tạm"
                >
                  📋 Dán nhanh
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};