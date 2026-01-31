import React, { useState } from 'react';
import { Product } from '../types';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface ResultsTableProps {
  products: Product[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ products }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (products.length === 0) return null;

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-750">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                #
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Ảnh
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tên sản phẩm
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product, index) => (
              <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-20 w-20 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center relative group">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="h-full w-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Error';
                      }}
                    />
                    <a 
                       href={product.imageUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center"
                       title="Mở ảnh gốc"
                    >
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-3" title={product.name}>
                    {product.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {product.imageUrl}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCopyLink(product.imageUrl, product.id)}
                      className={`flex items-center justify-center px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                        copiedId === product.id
                          ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {copiedId === product.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1.5" />
                          Đã chép link
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1.5" />
                          Chép link ảnh
                        </>
                      )}
                    </button>
                    
                    <a 
                      href={product.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-1.5 rounded-md border border-transparent bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-medium transition-all"
                    >
                      Xem ảnh to <ExternalLink className="ml-1.5 h-3 w-3" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};