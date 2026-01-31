
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  QrCode, 
  Download, 
  Sparkles, 
  Settings, 
  Copy, 
  CheckCircle2, 
  Maximize2,
  Image as ImageIcon,
  Layers,
  Upload,
  Move,
  Layout,
  History,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Save,
  ArrowRight,
  ChevronRight,
  Info,
  Link as LinkIcon,
  Contact2,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Globe,
  Building,
  Fingerprint,
  X
} from 'lucide-react';
import { QRCodeConfig, GeneratedQR, ContactInfo } from './types';

const DEFAULT_CONTACT: ContactInfo = {
  fullName: '',
  phone: '',
  email: '',
  website: '',
  organization: '',
  jobTitle: '',
  address: ''
};

const DEFAULT_CONFIG: QRCodeConfig = {
  mode: 'url',
  value: '',
  contactInfo: DEFAULT_CONTACT,
  size: 1280,
  qrScale: 0.25,
  fgColor: '#000000',
  bgColor: '#ffffff',
  level: 'H',
  title: '',
  description: '',
  bgImage: undefined,
  bgImageOpacity: 1.0,
  bgImageFit: 'cover',
  bgImageScale: 1.0,
  logo: undefined,
  logoScale: 0.2,
};

type ViewMode = 'create' | 'history' | 'guide';

export default function App() {
  // Navigation State
  const [view, setView] = useState<ViewMode>('create');
  
  // App State
  const [config, setConfig] = useState<QRCodeConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<GeneratedQR[]>([]);
  
  // Create View State
  const [useBgImage, setUseBgImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [bgSourceType, setBgSourceType] = useState<'upload' | 'url'>('upload');
  const [bgUrlInput, setBgUrlInput] = useState('');
  
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const INTERNAL_MARGIN_RATIO = 0.05; 
  const FONT_SIZE_RATIO = 0.08;

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem('smart-qr-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // --- vCard Generator Logic ---
  useEffect(() => {
    if (config.mode === 'contact' && config.contactInfo) {
      const info = config.contactInfo;
      // Tạo chuỗi vCard 3.0 chuẩn
      // Note: Sử dụng UTF-8 charset
      const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${info.fullName};;;;
FN:${info.fullName}
ORG:${info.organization}
TITLE:${info.jobTitle}
TEL;TYPE=WORK,VOICE:${info.phone}
TEL;TYPE=CELL:${info.phone}
EMAIL:${info.email}
URL:${info.website}
ADR;TYPE=WORK:;;${info.address};;;;
END:VCARD`;
      
      setConfig(prev => ({ ...prev, value: vCardData }));
    }
  }, [config.contactInfo, config.mode]);


  // Save History Helper
  const saveToHistoryStorage = (newHistory: GeneratedQR[]) => {
    setHistory(newHistory);
    localStorage.setItem('smart-qr-history', JSON.stringify(newHistory));
  };

  const handleSaveToHistory = () => {
    if (!config.value) return;
    const newEntry: GeneratedQR = {
      ...config,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    const newHistory = [newEntry, ...history];
    saveToHistoryStorage(newHistory);
    alert("✅ Đã lưu mẫu vào Thư viện!");
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn xóa mẫu này?")) {
      const newHistory = history.filter(h => h.id !== id);
      saveToHistoryStorage(newHistory);
    }
  };

  const handleRestore = (item: GeneratedQR) => {
    setConfig(item);
    setUseBgImage(!!item.bgImage);
    setView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Logic Editor ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['size', 'bgImageOpacity', 'bgImageScale', 'qrScale', 'logoScale'].includes(name);
    const val = isNumeric ? parseFloat(value) : value;
    setConfig(prev => ({ ...prev, [name]: val }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      contactInfo: {
        ...(prev.contactInfo || DEFAULT_CONTACT),
        [name]: value
      }
    }));
  };

  const handleQRScalePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    if (!isNaN(percentage)) {
      const scale = Math.min(Math.max(percentage / 100, 0.05), 1.0);
      setConfig(prev => ({ ...prev, qrScale: scale }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, bgImage: reader.result as string }));
        setUseBgImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlImageSubmit = () => {
    if (bgUrlInput.trim()) {
      setConfig(prev => ({ ...prev, bgImage: bgUrlInput.trim() }));
      setUseBgImage(true);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleDownload = async () => {
    if (!config.value) return;

    const canvasSize = config.size;
    const qrGroupWidth = canvasSize * config.qrScale; 
    const internalMargin = qrGroupWidth * INTERNAL_MARGIN_RATIO;
    const actualQRSize = qrGroupWidth - (internalMargin * 2);
    const fontSize = canvasSize * FONT_SIZE_RATIO * 0.5; // Điều chỉnh font size theo size ảnh
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (useBgImage && config.bgImage) {
      try {
        const bgImg = await loadImage(config.bgImage);
        const ratioCanvas = canvas.width / canvas.height;
        const ratioImg = bgImg.width / bgImg.height;
        let drawScale = 1;

        if (config.bgImageFit === 'cover') {
          drawScale = ratioCanvas > ratioImg ? canvas.width / bgImg.width : canvas.height / bgImg.height;
        } else {
          drawScale = ratioCanvas > ratioImg ? canvas.height / bgImg.height : canvas.width / bgImg.width;
        }

        const finalScale = drawScale * config.bgImageScale;
        const dw = bgImg.width * finalScale;
        const dh = bgImg.height * finalScale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;

        ctx.save();
        ctx.globalAlpha = config.bgImageOpacity;
        ctx.drawImage(bgImg, dx, dy, dw, dh);
        ctx.restore();
      } catch (e) {
        console.error("BG Image Load Error", e);
      }
    }

    const patchX = (canvas.width - qrGroupWidth) / 2;
    const patchY = (canvas.height - qrGroupWidth) / 2;
    const radius = qrGroupWidth * 0.1;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = config.bgColor;
    ctx.beginPath();
    ctx.roundRect(patchX, patchY, qrGroupWidth, qrGroupWidth, radius);
    ctx.fill();
    ctx.restore();

    const tempCanvas = exportCanvasRef.current?.querySelector('canvas');
    if (tempCanvas) {
      ctx.drawImage(
        tempCanvas, 
        patchX + internalMargin, 
        patchY + internalMargin, 
        actualQRSize, 
        actualQRSize
      );
    }

    if (config.title) {
        ctx.fillStyle = config.fgColor;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Vẽ title ở dưới QR một chút
        ctx.fillText(config.title.substring(0,30), canvas.width / 2, patchY + qrGroupWidth + (fontSize * 1.2));
    }

    const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
    const link = document.createElement('a');
    link.download = `smart-qr-${Date.now()}.${exportFormat}`;
    link.href = canvas.toDataURL(mimeType, 0.95);
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(config.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview Calculations
  const previewSize = 320; 
  const previewQRWidth = previewSize * config.qrScale;
  const previewInternalMargin = previewQRWidth * INTERNAL_MARGIN_RATIO;
  const previewActualQRSize = previewQRWidth - (previewInternalMargin * 2);

  // Constants for Logo
  const HIDDEN_CANVAS_SIZE = 1024;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      {/* Hidden Render for Canvas Export */}
      <div className="hidden">
        {config.value && (
          <div ref={exportCanvasRef}>
            <QRCodeCanvas
              value={config.value}
              size={HIDDEN_CANVAS_SIZE} 
              fgColor={config.fgColor}
              bgColor="transparent"
              level={config.level}
              includeMargin={false}
              imageSettings={config.logo ? {
                src: config.logo,
                height: HIDDEN_CANVAS_SIZE * config.logoScale,
                width: HIDDEN_CANVAS_SIZE * config.logoScale,
                excavate: true,
              } : undefined}
            />
          </div>
        )}
      </div>

      {/* HEADER & NAV */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('create')}>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200 transition-transform hover:scale-105">
              <QrCode className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700 hidden sm:block">
              Smart QR Studio
            </h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
             <button 
               onClick={() => setView('create')} 
               className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'create' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
             >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Tạo mới</span>
             </button>
             <button 
               onClick={() => setView('history')} 
               className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'history' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
             >
                <History className="w-4 h-4" /> <span className="hidden sm:inline">Thư viện</span>
             </button>
             <button 
               onClick={() => setView('guide')} 
               className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'guide' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
             >
                <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Hướng dẫn</span>
             </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT SWITCHER */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* VIEW: CREATE (STUDIO) */}
        {view === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            {/* Left Column: Controls */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Loại QR & Nhập liệu */}
              <div className="bg-white p-1 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                 {/* Tab Switcher */}
                 <div className="flex p-1 bg-slate-100/50 rounded-2xl mb-1">
                    <button 
                      onClick={() => setConfig(prev => ({...prev, mode: 'url', value: prev.contactInfo ? '' : prev.value}))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${config.mode === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                       <LinkIcon className="w-4 h-4" /> Đường dẫn (Link)
                    </button>
                    <button 
                      onClick={() => setConfig(prev => ({...prev, mode: 'contact', title: prev.contactInfo?.fullName || prev.title}))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${config.mode === 'contact' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                       <Contact2 className="w-4 h-4" /> Danh thiếp (vCard)
                    </button>
                 </div>

                 {/* Input Content Area */}
                 <div className="p-5">
                    {config.mode === 'url' ? (
                        <div>
                           <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-indigo-500" /> Dán nội dung cần tạo link QR code
                           </label>
                           <input
                             type="text"
                             name="value"
                             value={config.value}
                             onChange={handleInputChange}
                             placeholder="https://example.com hoặc văn bản bất kỳ..."
                             className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 transition-all font-medium"
                           />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold border-b border-indigo-100 pb-2 mb-2">
                               <Contact2 className="w-5 h-5 text-indigo-500"/> Thông tin Danh thiếp
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Họ và Tên</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <input
                                          type="text"
                                          name="fullName"
                                          value={config.contactInfo?.fullName}
                                          onChange={handleContactChange}
                                          placeholder="Nguyễn Văn A"
                                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Số điện thoại</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <input
                                          type="text"
                                          name="phone"
                                          value={config.contactInfo?.phone}
                                          onChange={handleContactChange}
                                          placeholder="0912..."
                                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <input
                                          type="email"
                                          name="email"
                                          value={config.contactInfo?.email}
                                          onChange={handleContactChange}
                                          placeholder="email@example.com"
                                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Website</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <input
                                          type="text"
                                          name="website"
                                          value={config.contactInfo?.website}
                                          onChange={handleContactChange}
                                          placeholder="mysite.com"
                                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Chức vụ</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <input
                                          type="text"
                                          name="jobTitle"
                                          value={config.contactInfo?.jobTitle}
                                          onChange={handleContactChange}
                                          placeholder="Giám đốc, Sale..."
                                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Công ty</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <input
                                          type="text"
                                          name="organization"
                                          value={config.contactInfo?.organization}
                                          onChange={handleContactChange}
                                          placeholder="Tên công ty"
                                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">Địa chỉ</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                    <input
                                      type="text"
                                      name="address"
                                      value={config.contactInfo?.address}
                                      onChange={handleContactChange}
                                      placeholder="Số nhà, đường, quận, thành phố..."
                                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
              </div>

              {/* 2. Cấu hình Kích thước & Logo */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  Kích thước & Logo
                </h2>
                
                <div className="space-y-8">
                  {/* Canvas Size */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Maximize2 className="w-4 h-4 text-slate-400" /> Độ phân giải ảnh
                      </label>
                      <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{config.size} px</span>
                    </div>
                    <input
                      type="range"
                      name="size"
                      min="512"
                      max="4096"
                      step="128"
                      value={config.size}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  
                  {/* QR Scale */}
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-indigo-600" /> Tỉ lệ mã QR so với ảnh
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="5"
                            max="100"
                            value={Math.round(config.qrScale * 100)}
                            onChange={handleQRScalePercentageChange}
                            className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 text-center shadow-sm"
                          />
                          <span className="absolute -right-4 top-1 text-xs font-bold text-indigo-400">%</span>
                        </div>
                      </div>
                    </div>

                    <input
                      type="range"
                      name="qrScale"
                      min="0.05"
                      max="1.0"
                      step="0.01"
                      value={config.qrScale}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 relative z-10"
                    />
                  </div>

                  {/* LOGO SECTION */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           <Fingerprint className="w-4 h-4 text-indigo-500" /> Logo trung tâm
                        </label>
                        {config.logo && (
                           <button 
                             onClick={() => setConfig(prev => ({...prev, logo: undefined}))}
                             className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200 transition-colors flex items-center gap-1"
                           >
                             <Trash2 className="w-3 h-3" /> Xóa Logo
                           </button>
                        )}
                    </div>

                    <div className="flex gap-4 items-start">
                        {/* Upload Button */}
                        <div className="flex-1">
                             <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                             <button
                               onClick={() => logoInputRef.current?.click()}
                               className="w-full py-3 bg-white border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                             >
                               <Upload className="w-3 h-3" /> 
                               {config.logo ? 'Đổi Logo khác' : 'Tải Logo lên'}
                             </button>
                        </div>
                        
                        {/* Logo Preview */}
                        {config.logo && (
                             <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                <img src={config.logo} alt="Logo" className="w-full h-full object-contain" />
                             </div>
                        )}
                    </div>

                    {config.logo && (
                       <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-1">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                             <span>Kích thước Logo</span>
                             <span>{Math.round(config.logoScale * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            name="logoScale"
                            min="0.1"
                            max="0.3"
                            step="0.01"
                            value={config.logoScale}
                            onChange={handleInputChange}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-indigo-600"
                          />
                          <p className="text-[10px] text-slate-400 italic">Logo quá lớn có thể khiến mã QR khó quét.</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Background Image */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-500" /> Ảnh nền
                      </label>
                      <button 
                        onClick={() => setUseBgImage(!useBgImage)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useBgImage ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useBgImage ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    
                    {useBgImage && (
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['upload', 'url'].map((type) => (
                          <button 
                            key={type}
                            onClick={() => setBgSourceType(type as any)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${bgSourceType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {type === 'upload' ? 'Upload' : 'Link'}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                {useBgImage && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {bgSourceType === 'upload' ? (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
                        >
                          <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                          {config.bgImage ? 'Đổi ảnh khác' : 'Tải ảnh lên (Click để chọn)'}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={bgUrlInput}
                            onChange={(e) => setBgUrlInput(e.target.value)}
                            placeholder="Dán link ảnh (https://...)"
                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                          />
                          <button onClick={handleUrlImageSubmit} className="bg-indigo-600 text-white px-5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">OK</button>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                      {config.bgImage && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Move className="w-3 h-3"/> Kiểu hiển thị</label>
                              <div className="flex bg-white border border-slate-200 p-1 rounded-lg">
                                <button onClick={() => setConfig(prev => ({...prev, bgImageFit: 'cover'}))} className={`flex-1 py-1 text-[9px] font-black rounded ${config.bgImageFit === 'cover' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>COVER</button>
                                <button onClick={() => setConfig(prev => ({...prev, bgImageFit: 'contain'}))} className={`flex-1 py-1 text-[9px] font-black rounded ${config.bgImageFit === 'contain' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>CONTAIN</button>
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Layers className="w-3 h-3"/> Độ mờ ({Math.round(config.bgImageOpacity * 100)}%)</label>
                              <input type="range" name="bgImageOpacity" min="0" max="1" step="0.01" value={config.bgImageOpacity} onChange={handleInputChange} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-indigo-600" />
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* 4. Formatting */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Màu chủ đạo</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <input type="color" name="fgColor" value={config.fgColor} onChange={handleInputChange} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                      <span className="text-xs font-mono font-bold text-slate-600 uppercase">{config.fgColor}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Định dạng xuất</label>
                    <div className="relative">
                      <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                        <option value="png">PNG (Chất lượng cao)</option>
                        <option value="jpeg">JPEG (Nhẹ hơn)</option>
                      </select>
                    </div>
                </div>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 sticky top-24">
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">Live Preview</span>
                  <h3 className="text-lg font-bold text-slate-900 truncate px-4">
                      {config.mode === 'contact' 
                          ? (config.contactInfo?.fullName || "Danh thiếp mới")
                          : (config.title || "Tác phẩm của bạn")}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Sẽ xuất tại: {config.size} x {config.size} px</p>
                </div>

                {/* PREVIEW CONTAINER */}
                <div className="relative w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                  <div className="absolute inset-0 z-0 flex items-center justify-center bg-white">
                    {(useBgImage && config.bgImage) ? (
                      <img 
                        src={config.bgImage} 
                        className="w-full h-full transition-transform duration-500" 
                        style={{ 
                          opacity: config.bgImageOpacity,
                          objectFit: config.bgImageFit,
                          transform: `scale(${config.bgImageScale})`
                        }}
                        alt="Background" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                        <ImageIcon className="w-12 h-12" />
                        <span className="text-xs font-bold uppercase tracking-widest">Chưa có ảnh nền</span>
                      </div>
                    )}
                  </div>

                  <div 
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center shadow-2xl transition-all duration-300"
                      style={{ 
                        backgroundColor: config.bgColor,
                        width: `${previewSize * config.qrScale}px`, 
                        padding: `${previewSize * config.qrScale * INTERNAL_MARGIN_RATIO}px`,
                        borderRadius: `${previewSize * config.qrScale * 0.1}px`
                      }}
                  >
                    {config.value ? (
                      <QRCodeCanvas
                          value={config.value}
                          size={previewActualQRSize}
                          fgColor={config.fgColor}
                          bgColor="transparent"
                          level={config.level}
                          includeMargin={false}
                          imageSettings={config.logo ? {
                            src: config.logo,
                            height: previewActualQRSize * config.logoScale,
                            width: previewActualQRSize * config.logoScale,
                            excavate: true,
                          } : undefined}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-slate-100 rounded flex items-center justify-center">
                        <QrCode className="w-1/2 h-1/2 text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSaveToHistory}
                      disabled={!config.value}
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-white border border-indigo-200 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-50 disabled:opacity-50 transition-all active:scale-95 text-sm"
                    >
                      <Save className="w-5 h-5" /> Lưu mẫu
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!config.value}
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-indigo-200 active:scale-95 text-sm"
                    >
                      <Download className="w-5 h-5" /> Tải xuống
                    </button>
                  </div>
                  
                  {config.value && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 truncate text-xs text-slate-500 font-medium px-2">
                        {config.mode === 'contact' ? `vCard: ${config.contactInfo?.fullName}` : config.value}
                      </div>
                      <button onClick={handleCopy} className="p-2 hover:bg-white rounded-lg text-indigo-500 transition-colors">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {view === 'history' && (
          <div className="animate-in fade-in duration-300">
             <div className="mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Thư viện đã lưu</h2>
                  <p className="text-slate-500">Quản lý và sử dụng lại các mẫu thiết kế của bạn.</p>
               </div>
               <div className="text-right">
                  <span className="text-4xl font-black text-indigo-600">{history.length}</span>
                  <p className="text-xs font-bold text-slate-400 uppercase">Mẫu thiết kế</p>
               </div>
             </div>

             {history.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <History className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Chưa có mẫu nào</h3>
                  <p className="text-slate-400 font-medium mb-6">Hãy tạo mẫu QR đầu tiên của bạn ngay bây giờ!</p>
                  <button 
                    onClick={() => setView('create')} 
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    Tạo mẫu mới
                  </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {history.map((item) => (
                   <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                      <div className="aspect-square bg-slate-100 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-slate-100">
                         {item.bgImage && (
                            <img src={item.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-80 blur-[2px] scale-110" />
                         )}
                         <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
                         <div className="relative z-10 bg-white p-3 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform">
                            <QRCodeCanvas 
                                value={item.value} 
                                size={120} 
                                fgColor={item.fgColor} 
                                level={item.level} 
                                imageSettings={item.logo ? {
                                    src: item.logo,
                                    height: 120 * (item.logoScale || 0.2),
                                    width: 120 * (item.logoScale || 0.2),
                                    excavate: true
                                } : undefined}
                            />
                         </div>
                      </div>
                      
                      <div className="flex items-start justify-between mb-2">
                         <div>
                            <h3 className="font-bold text-slate-800 truncate max-w-[180px]" title={item.mode === 'contact' ? item.contactInfo?.fullName : item.title}>
                                {item.mode === 'contact' ? (item.contactInfo?.fullName || "Danh thiếp") : (item.title || "Không tiêu đề")}
                            </h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                {item.mode === 'contact' ? <Contact2 className="w-3 h-3"/> : <LinkIcon className="w-3 h-3"/>}
                                {new Date(item.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                         <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-100">
                            {item.size}px
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                         <button 
                            onClick={() => handleRestore(item)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md"
                         >
                            <Edit className="w-3 h-3" /> Mở lại
                         </button>
                         <button 
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                         >
                            <Trash2 className="w-3 h-3" /> Xóa
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* VIEW: GUIDE */}
        {view === 'guide' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-300 space-y-12 pb-20">
             
             {/* Hero Section */}
             <div className="relative bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 text-white overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-lg">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-400/30 mb-4">
                     <Sparkles className="w-3 h-3" /> Hướng dẫn sử dụng
                  </div>
                  <h2 className="text-4xl font-black mb-6 leading-tight">Biến liên kết thành <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">nghệ thuật</span></h2>
                  <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                     Smart QR Studio không chỉ tạo mã QR. Chúng tôi giúp bạn tạo ra những tác phẩm truyền thông thương hiệu mạnh mẽ.
                  </p>
                  <button onClick={() => setView('create')} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                     Bắt đầu ngay <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path fill="#6366F1" d="M42.7,-62.9C50.9,-52.8,50.1,-34.4,51.7,-19.2C53.4,-4,57.4,8,54,18.7C50.6,29.4,39.8,38.8,29,46.6C18.2,54.4,7.4,60.6,-2.2,63.6C-11.8,66.6,-20.2,66.4,-30.5,60.5C-40.8,54.6,-53,43,-60.5,29.7C-68,16.4,-70.8,1.4,-66.4,-11.2C-62,-23.8,-50.4,-34,-38.7,-43.1C-27,-52.2,-15.2,-60.2,0.9,-61.5C17,-62.7,34.5,-63,42.7,-62.9Z" transform="translate(100 100)" />
                    </svg>
                </div>
             </div>

             {/* Step 1 */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black text-xl shadow-sm border border-indigo-200">1</div>
                   <h3 className="text-2xl font-bold text-slate-900">Nhập nội dung</h3>
                   <p className="text-slate-600 leading-relaxed">
                      Dán đường dẫn sản phẩm, website hoặc bất kỳ văn bản nào bạn muốn tạo mã QR.
                   </p>
                   <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><CheckCircle2 className="w-4 h-4 text-green-500"/> Hỗ trợ mọi loại liên kết</li>
                      <li className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><CheckCircle2 className="w-4 h-4 text-green-500"/> Tạo mã nhanh chóng</li>
                   </ul>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                   <img 
                      src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800" 
                      alt="AI Analysis" 
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700"
                   />
                   <div className="bg-white p-3 text-xs text-center text-slate-500 font-medium border-t border-slate-100">
                      Nhập liệu đơn giản và trực quan
                   </div>
                </div>
             </div>

             {/* Step 2 (Visual Concept) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
                <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-center">
                   {/* CSS-based Diagram for Scale */}
                   <div className="relative w-48 h-48 bg-white border-2 border-slate-300 rounded-lg shadow-sm flex items-center justify-center">
                      <span className="absolute -top-6 left-0 text-xs font-bold text-slate-400">Canvas (1280px)</span>
                      <div className="w-24 h-24 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs relative animate-pulse">
                         QR
                         <div className="absolute -right-12 top-1/2 w-10 h-[1px] bg-indigo-300"></div>
                         <span className="absolute -right-24 top-1/2 -translate-y-1/2 text-[10px] text-indigo-500 font-bold">Scale</span>
                      </div>
                   </div>
                </div>
                <div className="order-1 md:order-2 space-y-4">
                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black text-xl shadow-sm border border-indigo-200">2</div>
                   <h3 className="text-2xl font-bold text-slate-900">Hiểu về "Tỉ lệ" (Scale)</h3>
                   <p className="text-slate-600 leading-relaxed">
                      Đây là chìa khóa để có ảnh đẹp.
                   </p>
                   <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800">
                      <p className="font-bold mb-1">💡 Công thức chuẩn:</p>
                      <p>Giữ <b>Độ phân giải cao</b> (1280px trở lên) để ảnh nét, nhưng giảm <b>Tỉ lệ QR</b> (xuống 20-30%) để mã QR nhỏ gọn, tinh tế trên nền ảnh lớn.</p>
                   </div>
                </div>
             </div>

             {/* Step 3 */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black text-xl shadow-sm border border-indigo-200">3</div>
                   <h3 className="text-2xl font-bold text-slate-900">Phối ảnh & Xuất bản</h3>
                   <p className="text-slate-600 leading-relaxed">
                      Upload ảnh sản phẩm hoặc poster quảng cáo làm nền. Điều chỉnh độ mờ (Opacity) để mã QR nổi bật nhưng không che mất chi tiết quan trọng.
                   </p>
                   <button onClick={() => setView('create')} className="text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                      Thử ngay <ArrowRight className="w-4 h-4"/>
                   </button>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                   <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" 
                      alt="Artistic Background" 
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700"
                   />
                   <div className="bg-white p-3 text-xs text-center text-slate-500 font-medium border-t border-slate-100">
                      Tạo ra những thiết kế không giới hạn
                   </div>
                </div>
             </div>

          </div>
        )}
        
      </main>
    </div>
  );
}
