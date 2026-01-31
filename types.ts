
export interface ContactInfo {
  fullName: string;
  phone: string;
  email: string;
  website: string;
  organization: string;
  jobTitle: string;
  address: string;
}

export interface QRCodeConfig {
  mode: 'url' | 'contact'; // Chế độ hiện tại
  value: string; // Giá trị cuối cùng để tạo QR (URL hoặc chuỗi vCard)
  contactInfo?: ContactInfo; // Lưu trữ thông tin form liên hệ để edit lại
  
  size: number; // Độ phân giải ảnh xuất (px)
  qrScale: number; // Tỉ lệ QR so với ảnh (0.05 - 1.0)
  
  fgColor: string;
  bgColor: string;
  textColor?: string; // Màu chữ tiêu đề và mô tả
  level: 'L' | 'M' | 'Q' | 'H';
  
  title?: string;
  description?: string;
  
  bgImage?: string;
  bgImageOpacity: number;
  bgImageFit: 'cover' | 'contain';
  bgImageScale: number;

  // Logo Configuration
  logo?: string;
  logoScale: number; // Tỉ lệ logo so với QR (0.1 - 0.3)
}

export interface GeneratedQR extends QRCodeConfig {
  id: string;
  createdAt: number;
  thumbnail?: string; 
}

export interface AISuggestion {
  title: string;
  description: string;
  suggestedColor: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
}

export enum CopyMode {
  ALL = 'ALL',
  NAME_ONLY = 'NAME_ONLY',
  IMAGE_ONLY = 'IMAGE_ONLY'
}
