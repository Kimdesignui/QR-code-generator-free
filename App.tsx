
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Download, 
  Sparkles, 
  Settings, 
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
  ClipboardCopy,
  FileCode,
  ChevronDown,
  Palette,
  Pipette,
  Type,
  MoveVertical,
  Minus,
  Plus as PlusIcon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Scaling
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
  urlValue: '',
  contactInfo: DEFAULT_CONTACT,
  size: 1280,
  qrScale: 0.75,
  fgColor: '#000000',
  bgColor: '#ffffff',
  textColor: '#000000',
  level: 'H',
  title: '',
  titleFontSize: 80, // Default pixel size relative to 1280px canvas
  description: '',
  descFontSize: 60,
  textYOffset: 0,
  bgImage: undefined,
  bgImageOpacity: 1.0,
  bgImageFit: 'cover',
  bgImageScale: 1.0,
  logo: undefined,
  logoScale: 0.2,
};

type ViewMode = 'create' | 'history' | 'guide';
type HistoryViewMode = 'grid' | 'list';

export default function App() {
  // Navigation State
  const [view, setView] = useState<ViewMode>('create');
  const [historyViewMode, setHistoryViewMode] = useState<HistoryViewMode>('grid');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  
  // App State
  const [config, setConfig] = useState<QRCodeConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<GeneratedQR[]>([]);
  
  // Create View State
  const [useBgImage, setUseBgImage] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'svg' | ''>(''); 
  const [bgSourceType, setBgSourceType] = useState<'upload' | 'url'>('upload');
  const [bgUrlInput, setBgUrlInput] = useState('');
  
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const exportSvgRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const INTERNAL_MARGIN_RATIO = 0.05; 
  const HIDDEN_CANVAS_SIZE = 1024;

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
    // When restoring, we ensure urlValue is set if it's a URL mode
    const restoredConfig = {
        ...item,
        urlValue: item.mode === 'url' ? item.value : item.urlValue
    };
    setConfig(restoredConfig);
    setUseBgImage(!!item.bgImage);
    setView('create');
    if (window.innerWidth < 1024) {
       setIsMobileMenuOpen(false);
    }
  };

  const handleCreateNew = () => {
    setConfig(DEFAULT_CONFIG);
    setUseBgImage(false);
    setExportFormat('');
    setBgUrlInput('');
    setView('create');
    setIsMobileMenuOpen(false);
  };

  // --- Logic Editor ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['size', 'bgImageOpacity', 'bgImageScale', 'qrScale', 'logoScale', 'titleFontSize', 'descFontSize', 'textYOffset'].includes(name);
    const val = isNumeric ? parseFloat(value) : value;

    setConfig(prev => {
        const updates: any = { [name]: val };
        // If editing the main 'value' input in URL mode, also update 'urlValue' to persist it
        if (name === 'value' && prev.mode === 'url') {
            updates.urlValue = val;
        }
        return { ...prev, ...updates };
    });
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

  const handleEyedropper = async (targetField: 'fgColor' | 'textColor') => {
    if (!('EyeDropper' in window)) {
      alert("Trình duyệt của bạn không hỗ trợ công cụ chấm màu (Eyedropper). Vui lòng dùng Chrome/Edge trên máy tính.");
      return;
    }
    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      // @ts-ignore
      const result = await eyeDropper.open();
      setConfig(prev => ({ ...prev, [targetField]: result.sRGBHex }));
    } catch (e) {
      console.log("Eyedropper cancelled");
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

  // --- CORE GENERATION LOGIC ---
  const generateFinalCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvasSize = config.size;
    const qrGroupWidth = canvasSize * config.qrScale; 
    const internalMargin = qrGroupWidth * INTERNAL_MARGIN_RATIO;
    const actualQRSize = qrGroupWidth - (internalMargin * 2);

    // Font Config (Scaled based on canvas size vs reference 1280px)
    const scaleFactor = canvasSize / 1280;
    const titleFontSize = (config.titleFontSize || 80) * scaleFactor;
    const descFontSize = (config.descFontSize || 45) * scaleFactor;
    const textGap = 25 * scaleFactor;
    const qrGap = 64 * scaleFactor;
    
    // Offset
    const offsetY = (config.textYOffset || 0) * scaleFactor;

    // Calculate Text Height
    let textHeight = 0;
    if (config.title) textHeight += titleFontSize * 1.3;
    if (config.description) textHeight += descFontSize * 1.3;
    if (config.title && config.description) textHeight += textGap;

    // Total Content Height (Text + Gap + QR)
    const hasText = !!(config.title || config.description);
    const totalContentHeight = qrGroupWidth + (hasText ? (textHeight + qrGap) : 0);

    // Starting Y to center everything vertically + Manual Offset
    let currentY = ((canvasSize - totalContentHeight) / 2) + offsetY;

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    // 1. Fill Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Background Image
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

    // 3. Draw Text (Title & Description)
    ctx.fillStyle = config.textColor || config.fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (config.title) {
        ctx.font = `bold ${titleFontSize}px Inter, sans-serif`;
        ctx.save();
        ctx.shadowColor = "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(config.title.substring(0, 40), canvas.width / 2, currentY);
        ctx.restore();
        currentY += titleFontSize * 1.3;
    }

    if (config.description) {
        if (config.title) currentY += textGap;
        ctx.font = `normal ${descFontSize}px Inter, sans-serif`;
        ctx.save();
        ctx.shadowColor = "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(config.description.substring(0, 60), canvas.width / 2, currentY);
        ctx.restore();
        currentY += descFontSize * 1.3;
    }

    if (hasText) currentY += qrGap;

    // 4. Draw QR Container Box
    const patchX = (canvas.width - qrGroupWidth) / 2;
    const patchY = currentY; 
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

    // 5. Draw QR Code
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

    return canvas;
  };

  // --- ACTIONS ---

  const handleDownload = async () => {
    if (!config.value) return;
    // Default to PNG if not set
    const format = exportFormat || 'png';

    if (format === 'svg') {
       if (!exportSvgRef.current) return;
       const svgElement = exportSvgRef.current.querySelector('svg');
       if (!svgElement) return;

       const serializer = new XMLSerializer();
       const source = serializer.serializeToString(svgElement);
       const svgBlob = new Blob([`<?xml version="1.0" standalone="no"?>\r\n${source}`], {type: "image/svg+xml;charset=utf-8"});
       const url = URL.createObjectURL(svgBlob);
       const link = document.createElement('a');
       link.download = `smart-qr-${Date.now()}.svg`;
       link.href = url;
       link.click();
       URL.revokeObjectURL(url);
    } else {
       const canvas = await generateFinalCanvas();
       if (!canvas) return;
       const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
       const link = document.createElement('a');
       link.download = `smart-qr-${Date.now()}.${format}`;
       link.href = canvas.toDataURL(mimeType, 0.95);
       link.click();
    }
  };

  const handleCopyImage = async () => {
    if (!config.value) return;
    const canvas = await generateFinalCanvas();
    if (!canvas) return;

    try {
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 2000);
        }, 'image/png');
    } catch (err) {
        alert("Lỗi copy ảnh. Vui lòng thử lại trên Chrome/Edge.");
    }
  };

  // Helper for History Copy
  const handleHistoryCopy = async (item: GeneratedQR, e: React.MouseEvent) => {
    e.stopPropagation();
    const originalConfig = config;
    const originalUseBg = useBgImage;
    
    setConfig(item);
    setUseBgImage(!!item.bgImage);
    
    setTimeout(async () => {
      const canvas = await generateFinalCanvas();
      setConfig(originalConfig);
      setUseBgImage(originalUseBg);

      if (canvas) {
         try {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                alert("✅ Đã sao chép ảnh vào bộ nhớ tạm!");
            }, 'image/png');
         } catch (err) {
            alert("Lỗi sao chép.");
         }
      }
    }, 100);
  };

  // Quick download from History card
  const quickDownload = async (item: GeneratedQR, e: React.MouseEvent) => {
      e.stopPropagation();
      // Temporarily use the config from the item to generate canvas
      const originalConfig = config;
      const originalUseBg = useBgImage;
      
      setConfig(item);
      setUseBgImage(!!item.bgImage);
      
      // Wait for state to settle (React batching)
      setTimeout(async () => {
        const canvas = await generateFinalCanvas();
        // Restore
        setConfig(originalConfig);
        setUseBgImage(originalUseBg);

        if (canvas) {
           const link = document.createElement('a');
           link.download = `smart-qr-${item.id}.png`;
           link.href = canvas.toDataURL('image/png', 0.9);
           link.click();
        }
      }, 100);
  };

  // Guide Steps Data
  const GUIDE_STEPS = [
    {
        title: "Nhập nội dung",
        desc: "Chọn loại mã bạn cần: Đường dẫn (URL) cho web/sản phẩm hoặc Danh thiếp (vCard) cho thông tin cá nhân. Hệ thống sẽ tự động tạo mã QR.",
        icon: <LinkIcon className="w-10 h-10 text-indigo-500" />,
        demo: (
            <div className="relative w-full max-w-xs h-32 rounded-xl overflow-hidden shadow border border-slate-200 bg-white">
                <img src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-90" alt="Input Demo" />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white/95 px-4 py-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-700">https://my-shop.com...</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Tỉ lệ (Scale)",
        desc: "Đây là bí quyết để có ảnh đẹp. Hãy giữ độ phân giải ảnh cao (1280px) nhưng giảm Tỉ lệ QR xuống khoảng 20-30% để mã nhỏ gọn và tinh tế hơn.",
        icon: <Maximize2 className="w-10 h-10 text-orange-500" />,
        demo: (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex items-center justify-center w-full max-w-xs aspect-video">
                <div className="w-16 h-16 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold shadow-lg">QR 25%</div>
            </div>
        )
    },
    {
        title: "Phối ảnh nền",
        desc: "Tải lên ảnh sản phẩm hoặc poster của bạn. Điều chỉnh độ mờ (Opacity) và kiểu hiển thị (Cover/Contain) để làm nổi bật mã QR mà không che mất chi tiết ảnh.",
        icon: <ImageIcon className="w-10 h-10 text-green-500" />,
        demo: (
            <div className="relative w-full max-w-xs h-32 rounded-xl overflow-hidden shadow border border-slate-200">
                <img src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-black/80" />
                </div>
            </div>
        )
    },
    {
        title: "Văn bản & Màu sắc",
        desc: "Thêm lời kêu gọi hành động (Call to Action). Bạn có thể chỉnh cỡ chữ, màu sắc và vị trí dọc (Y-Offset) để văn bản nằm đúng chỗ bạn muốn.",
        icon: <Type className="w-10 h-10 text-pink-500" />,
        demo: (
            <div className="bg-white p-4 rounded-xl shadow border border-slate-100 w-full max-w-xs text-center space-y-2">
                <div className="text-sm font-bold text-pink-600">Quét Ngay!</div>
                <div className="h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">QR Area</div>
                <div className="flex justify-center"><MoveVertical className="w-4 h-4 text-slate-400" /></div>
            </div>
        )
    }
  ];

  // Component for beautiful action buttons
  const ActionButtons = () => (
    <div className="mt-8 w-full max-w-[320px] space-y-3">
        {/* Row 1: Save & Copy */}
        <div className="flex gap-3">
            <button 
                onClick={handleSaveToHistory} 
                disabled={!config.value} 
                className="flex-1 py-2 bg-white border border-indigo-100 rounded-2xl text-indigo-600 font-bold shadow-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group" 
                title="Lưu mẫu"
            >
                <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-white transition-colors">
                    <Save className="w-4 h-4"/>
                </div>
                Lưu mẫu
            </button>
            
            <button 
                onClick={handleCopyImage} 
                disabled={!config.value} 
                className="flex-1 py-2 bg-white border border-indigo-100 rounded-2xl text-indigo-600 font-bold shadow-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
            >
                <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-white transition-colors">
                    {copiedImage ? <CheckCircle2 className="w-4 h-4"/> : <ClipboardCopy className="w-4 h-4"/>} 
                </div>
                Copy Ảnh
            </button>
        </div>

        {/* Row 2: Download */}
        <div className="flex bg-white border border-indigo-600 rounded-2xl overflow-hidden h-11 shadow-md shadow-indigo-100">
            <div className="flex-1 flex items-center px-2 border-r border-indigo-100 relative">
                <select 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value as any)} 
                    className="w-full pl-3 pr-8 py-2 text-sm font-bold text-indigo-900 bg-transparent outline-none cursor-pointer appearance-none z-10"
                >
                    <option value="">-Chọn định dạng-</option>
                    <option value="png">PNG (Ảnh trong suốt)</option>
                    <option value="jpeg">JPG (Ảnh nén)</option>
                    <option value="svg">SVG (Vector)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 pointer-events-none"/>
            </div>
            <button 
                onClick={handleDownload} 
                disabled={!config.value} 
                className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
            >
                <Download className="w-4 h-4" /> Tải về
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. HIDDEN RENDERERS */}
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
        {config.value && (
          <div ref={exportSvgRef}>
             <QRCodeSVG
                value={config.value}
                size={config.size}
                fgColor={config.fgColor}
                bgColor={config.bgColor}
                level={config.level}
                includeMargin={true}
                imageSettings={config.logo ? {
                    src: config.logo,
                    height: config.size * config.logoScale,
                    width: config.size * config.logoScale,
                    excavate: true,
                } : undefined}
             />
          </div>
        )}
      </div>

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
             <QrCode className="text-indigo-500 w-6 h-6 mr-3" />
             <h1 className="text-lg font-black tracking-tight">Smart QR</h1>
             <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto lg:hidden text-slate-400">
               <X className="w-5 h-5" />
             </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
             <button 
                onClick={handleCreateNew}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'create' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
                <Plus className="w-5 h-5" /> Tạo QR Mới
             </button>
             <button 
                onClick={() => { setView('history'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
                <History className="w-5 h-5" /> Thư viện ({history.length})
             </button>
             <button 
                onClick={() => { setView('guide'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'guide' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
                <BookOpen className="w-5 h-5" /> Hướng dẫn
             </button>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
             <div className="text-xs text-slate-500 font-medium text-center">
                v2.1.0 • Smart Studio AI
             </div>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         
         {/* Mobile Header */}
         <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
             <div className="flex items-center gap-2">
               <QrCode className="text-indigo-600 w-6 h-6" />
               <span className="font-bold text-slate-900">Smart QR Studio</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-600">
               <Menu className="w-6 h-6" />
             </button>
         </header>

         {/* Scrollable Content */}
         <main className="flex-1 overflow-y-auto">
            {view === 'create' && (
               <div className="flex flex-col lg:flex-row min-h-full">
                  
                  {/* LEFT: EDITOR (Scrollable) */}
                  <div className="flex-1 p-6 lg:p-10 space-y-8 pb-32 lg:pb-10">
                     
                     <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-slate-800">Thiết kế QR</h2>
                        <p className="text-slate-500 text-sm">Tạo mã QR ấn tượng chỉ trong vài bước.</p>
                     </div>

                     {/* VERTICAL STEPPER CONTAINER */}
                     <div className="relative border-l-2 border-slate-200 ml-4 space-y-12 pl-8">
                        
                        {/* STEP 1: CONTENT */}
                        <div className="relative">
                            <span className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200 ring-4 ring-slate-50">1</span>
                            
                            <h3 className="text-base font-bold text-slate-800 mb-4">Nội dung QR</h3>
                            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                              <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                                  <button 
                                    onClick={() => setConfig(prev => ({...prev, mode: 'url', value: prev.urlValue || ''}))} 
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${config.mode === 'url' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                  >
                                    Đường dẫn (URL)
                                  </button>
                                  <button 
                                    onClick={() => setConfig(prev => ({...prev, mode: 'contact'}))} 
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${config.mode === 'contact' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                  >
                                    Danh thiếp (vCard)
                                  </button>
                              </div>
                              
                              <div className="px-4 pb-4">
                                  {config.mode === 'url' ? (
                                    <input
                                        type="text"
                                        name="value"
                                        value={config.value}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                    />
                                  ) : (
                                    <div className="space-y-3">
                                        <input type="text" name="fullName" value={config.contactInfo?.fullName} onChange={handleContactChange} placeholder="Họ tên" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
                                        <input type="text" name="phone" value={config.contactInfo?.phone} onChange={handleContactChange} placeholder="Số điện thoại" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
                                        <input type="text" name="email" value={config.contactInfo?.email} onChange={handleContactChange} placeholder="Email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
                                        <input type="text" name="website" value={config.contactInfo?.website} onChange={handleContactChange} placeholder="Website" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
                                    </div>
                                  )}
                              </div>
                            </div>
                        </div>

                        {/* STEP 2: TEXT */}
                        <div className="relative">
                           <span className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200 ring-4 ring-slate-50">2</span>
                           
                           <h3 className="text-base font-bold text-slate-800 mb-4">Văn bản & Trình bày</h3>
                           <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                              {/* Inputs */}
                              <div className="grid gap-4">
                                  <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700">Tiêu đề lớn</label>
                                        <span className="text-[10px] text-slate-400 italic">Bỏ trống nếu không cần hiển thị</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="title"
                                        value={config.title}
                                        onChange={handleInputChange}
                                        placeholder="VD: Quét ngay"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none"
                                    />
                                    {config.title && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Type className="w-3 h-3 text-slate-400"/>
                                            <input 
                                              type="range" name="titleFontSize" min="40" max="150" value={config.titleFontSize} 
                                              onChange={handleInputChange} className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none accent-indigo-600" 
                                            />
                                            <span className="text-[10px] w-8 text-right font-mono text-slate-500">{config.titleFontSize}</span>
                                        </div>
                                    )}
                                  </div>

                                  <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700">Mô tả nhỏ</label>
                                        <span className="text-[10px] text-slate-400 italic">Bỏ trống nếu không cần hiển thị</span>
                                    </div>
                                    <textarea
                                        name="description"
                                        value={config.description}
                                        onChange={handleInputChange}
                                        rows={2}
                                        placeholder="VD: Giảm giá 20%..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-indigo-500 outline-none resize-none"
                                    />
                                    {config.description && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Type className="w-3 h-3 text-slate-400"/>
                                            <input 
                                              type="range" name="descFontSize" min="20" max="80" value={config.descFontSize} 
                                              onChange={handleInputChange} className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none accent-indigo-600" 
                                            />
                                            <span className="text-[10px] w-8 text-right font-mono text-slate-500">{config.descFontSize}</span>
                                        </div>
                                    )}
                                  </div>
                              </div>

                              {(config.title || config.description) && (
                                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                    {/* Color Picker */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Màu chữ</label>
                                        <div className="flex gap-2">
                                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                                              <input type="color" name="textColor" value={config.textColor || config.fgColor} onChange={handleInputChange} className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0" />
                                          </div>
                                          <button onClick={() => handleEyedropper('textColor')} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Chấm màu từ ảnh">
                                              <Pipette className="w-4 h-4" />
                                          </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                          <MoveVertical className="w-3 h-3"/> Vị trí dọc
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <Minus className="w-3 h-3 text-slate-400"/>
                                          <input 
                                              type="range" name="textYOffset" min="-300" max="300" step="10" 
                                              value={config.textYOffset} onChange={handleInputChange} 
                                              className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none accent-indigo-600" 
                                          />
                                          <PlusIcon className="w-3 h-3 text-slate-400"/>
                                        </div>
                                    </div>
                                  </div>
                              )}
                           </div>
                        </div>

                        {/* STEP 3: INTERFACE */}
                        <div className="relative pb-4">
                           <span className="absolute -left-[43px] top-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200 ring-4 ring-slate-50">3</span>
                           
                           <h3 className="text-base font-bold text-slate-800 mb-4">Giao diện</h3>
                           <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                              
                              {/* Row 1: BG Toggle + Compact QR Color */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                  {/* Background Toggle */}
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${useBgImage ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                         <ImageIcon className="w-5 h-5"/>
                                      </div>
                                      <div className="flex flex-col">
                                         <span className="text-sm font-bold text-slate-700">Ảnh nền</span>
                                      </div>
                                      <button onClick={() => setUseBgImage(!useBgImage)} className={`ml-2 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useBgImage ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useBgImage ? 'translate-x-5' : 'translate-x-1'}`} />
                                      </button>
                                  </div>

                                  {/* Compact QR Color Picker */}
                                  <div className="flex items-center gap-3 sm:justify-end">
                                      <span className="text-xs font-bold text-slate-500 uppercase">Màu mã QR</span>
                                      <div className="flex gap-2">
                                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                                              <input type="color" name="fgColor" value={config.fgColor} onChange={handleInputChange} className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0" />
                                          </div>
                                          <button onClick={() => handleEyedropper('fgColor')} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Chấm màu">
                                              <Pipette className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              {/* Row 1.5: QR Scale */}
                              <div className="border-b border-slate-100 pb-4">
                                 <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Scaling className="w-3 h-3"/> Tỉ lệ QR</label>
                                    <span className="text-[10px] text-slate-400">{Math.round(config.qrScale * 100)}%</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Minus className="w-3 h-3 text-slate-400"/>
                                    <input 
                                       type="range" name="qrScale" min="5" max="100" step="5" 
                                       value={config.qrScale * 100} 
                                       onChange={handleQRScalePercentageChange} 
                                       className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none accent-indigo-600" 
                                    />
                                    <PlusIcon className="w-3 h-3 text-slate-400"/>
                                 </div>
                              </div>
                              
                              {/* Row 2: BG File Input (Conditional) */}
                              {useBgImage && (
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2">
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center gap-2">
                                          <Upload className="w-3 h-3"/> {config.bgImage ? 'Đổi ảnh' : 'Tải ảnh lên'}
                                        </button>
                                    </div>
                                    {config.bgImage && (
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>Độ mờ</span><span>{Math.round(config.bgImageOpacity*100)}%</span></div>
                                          <input type="range" name="bgImageOpacity" min="0" max="1" step="0.01" value={config.bgImageOpacity} onChange={handleInputChange} className="w-full h-1 bg-slate-200 rounded appearance-none accent-indigo-600"/>
                                        </div>
                                    )}
                                  </div>
                              )}

                              {/* Row 3: Logo */}
                              <div className="pt-2">
                                  <div className="flex justify-between items-center mb-2">
                                      <label className="text-sm font-bold text-slate-700">Logo giữa</label>
                                      {config.logo && <button onClick={() => setConfig(prev=>({...prev, logo: undefined}))} className="text-[10px] text-red-500 hover:underline">Xóa</button>}
                                  </div>
                                  <div className="flex gap-2">
                                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                      <button onClick={() => logoInputRef.current?.click()} className="flex-1 py-2 bg-white border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-400">
                                        {config.logo ? 'Đổi Logo' : 'Tải Logo lên'}
                                      </button>
                                      {config.logo && <div className="w-9 h-9 border border-slate-200 rounded bg-white p-0.5"><img src={config.logo} className="w-full h-full object-contain"/></div>}
                                  </div>
                              </div>
                           </div>
                        </div>

                     </div>

                     {/* MOBILE PREVIEW SECTION (< lg) - MOVED HERE */}
                     <div className="lg:hidden mt-12 mb-8">
                       <h3 className="text-xl font-bold text-slate-800 mb-6 text-center border-t border-slate-200 pt-8">Kết quả của bạn</h3>
                       <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-200 mx-auto max-w-sm flex flex-col items-center">
                           <h3 className="text-center font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Kết quả thực tế</h3>
                           <div className="relative aspect-square w-full bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center">
                              {useBgImage && config.bgImage && (
                                  <img 
                                    src={config.bgImage} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                                    style={{ opacity: config.bgImageOpacity, objectFit: config.bgImageFit, transform: `scale(${config.bgImageScale})` }}
                                  />
                               )}
                               
                               <div className="relative z-10 flex flex-col items-center transition-all duration-300" style={{ transform: `translateY(${config.textYOffset * 0.25}px)` }}>
                                  {(config.title || config.description) && (
                                     <div className="text-center mb-4" style={{ color: config.textColor || config.fgColor }}>
                                         {config.title && <div style={{ fontSize: `${config.titleFontSize * 0.25}px`, fontWeight: 'bold', lineHeight: 1.2, textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>{config.title}</div>}
                                         {config.description && <div style={{ fontSize: `${config.descFontSize * 0.25}px`, marginTop: '4px', opacity: 0.9, textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>{config.description}</div>}
                                     </div>
                                  )}
                                  
                                  <div style={{ 
                                      padding: `${320 * config.qrScale * 0.05}px`, 
                                      backgroundColor: config.bgColor, 
                                      borderRadius: `${320 * config.qrScale * 0.1}px`, 
                                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                      width: config.value ? 'auto' : `${320 * config.qrScale}px`,
                                      height: config.value ? 'auto' : `${320 * config.qrScale}px`,
                                      display: config.value ? 'block' : 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                  }}>
                                      {config.value ? (
                                        <QRCodeCanvas 
                                            value={config.value} 
                                            size={320 * config.qrScale * 0.9} 
                                            fgColor={config.fgColor} 
                                            level={config.level}
                                            imageSettings={config.logo ? { src: config.logo, height: 320*config.qrScale*0.9*config.logoScale, width: 320*config.qrScale*0.9*config.logoScale, excavate: true } : undefined}
                                        />
                                      ) : (
                                        <div className="text-center text-slate-400 text-sm font-medium px-2">
                                            Nhập nội dung<br/>để tạo mã
                                        </div>
                                      )}
                                  </div>
                               </div>
                           </div>
                           
                           <ActionButtons />
                       </div>
                     </div>
                  </div>

                  {/* RIGHT: STICKY PREVIEW (Desktop) */}
                  <div className="hidden lg:flex w-[400px] xl:w-[480px] bg-slate-50 border-l border-slate-200 flex-col sticky top-0 h-full">
                      <div className="p-8 flex-1 flex flex-col items-center justify-center overflow-hidden">
                         <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-200 max-w-full">
                            <h3 className="text-center font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Kết quả thực tế</h3>
                            <div className="relative aspect-square w-[320px] bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center">
                               {useBgImage && config.bgImage && (
                                  <img 
                                    src={config.bgImage} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                                    style={{ opacity: config.bgImageOpacity, objectFit: config.bgImageFit, transform: `scale(${config.bgImageScale})` }}
                                  />
                               )}
                               
                               <div className="relative z-10 flex flex-col items-center transition-all duration-300" style={{ transform: `translateY(${config.textYOffset * 0.25}px)` }}>
                                  {/* Text Preview (Approx) */}
                                  {(config.title || config.description) && (
                                     <div className="text-center mb-4" style={{ color: config.textColor || config.fgColor }}>
                                         {config.title && <div style={{ fontSize: `${config.titleFontSize * 0.25}px`, fontWeight: 'bold', lineHeight: 1.2, textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>{config.title}</div>}
                                         {config.description && <div style={{ fontSize: `${config.descFontSize * 0.25}px`, marginTop: '4px', opacity: 0.9, textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>{config.description}</div>}
                                     </div>
                                  )}
                                  
                                  {/* QR Box */}
                                  <div style={{ 
                                      padding: `${320 * config.qrScale * 0.05}px`, 
                                      backgroundColor: config.bgColor, 
                                      borderRadius: `${320 * config.qrScale * 0.1}px`, 
                                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                      width: config.value ? 'auto' : `${320 * config.qrScale}px`,
                                      height: config.value ? 'auto' : `${320 * config.qrScale}px`,
                                      display: config.value ? 'block' : 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                  }}>
                                      {config.value ? (
                                        <QRCodeCanvas 
                                            value={config.value} 
                                            size={320 * config.qrScale * 0.9} 
                                            fgColor={config.fgColor} 
                                            level={config.level}
                                            imageSettings={config.logo ? { src: config.logo, height: 320*config.qrScale*0.9*config.logoScale, width: 320*config.qrScale*0.9*config.logoScale, excavate: true } : undefined}
                                        />
                                      ) : (
                                        <div className="text-center text-slate-400 text-sm font-medium px-2">
                                            Nhập nội dung<br/>để tạo mã
                                        </div>
                                      )}
                                  </div>
                               </div>
                            </div>
                         </div>
                         
                         <ActionButtons />
                      </div>
                  </div>
               </div>
            )}

            {view === 'history' && (
               <div className="p-6 lg:p-10 max-w-6xl mx-auto">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <h2 className="text-3xl font-bold text-slate-800">Thư viện của bạn</h2>
                      
                      {/* View Toggle */}
                      {history.length > 0 && (
                          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                              <button 
                                onClick={() => setHistoryViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${historyViewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                  <LayoutGrid className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => setHistoryViewMode('list')}
                                className={`p-2 rounded-md transition-all ${historyViewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                  <ListIcon className="w-5 h-5" />
                              </button>
                          </div>
                      )}
                   </div>

                   {history.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><History className="w-10 h-10 text-slate-300" /></div>
                         <h3 className="text-lg font-bold text-slate-700">Chưa có mẫu nào</h3>
                         <button onClick={handleCreateNew} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Tạo ngay</button>
                      </div>
                   ) : (
                      <>
                        {historyViewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {history.map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                                        <div className="aspect-square bg-slate-100 relative flex items-center justify-center p-4">
                                            {item.bgImage && <img src={item.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" />}
                                            <div className="relative z-10 bg-white p-2 rounded-lg shadow-md">
                                                <QRCodeCanvas value={item.value} size={100} fgColor={item.fgColor} level="L" />
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 bg-white border-t border-slate-100">
                                            <h4 className="font-bold text-slate-800 text-sm truncate pr-6 mb-1">{item.title || (item.mode === 'contact' ? item.contactInfo?.fullName : 'Không tiêu đề')}</h4>
                                            <p className="text-[10px] text-slate-400 mb-4">{new Date(item.createdAt).toLocaleDateString()}</p>
                                            
                                            <div className="grid grid-cols-3 gap-2">
                                                <button 
                                                    onClick={(e) => quickDownload(item, e)}
                                                    className="flex items-center justify-center py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                    title="Tải xuống"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleHistoryCopy(item, e)}
                                                    className="flex items-center justify-center py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                                    title="Sao chép ảnh"
                                                >
                                                    <ClipboardCopy className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteHistory(e, item.id)}
                                                    className="flex items-center justify-center py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleRestore(item)}
                                                className="w-full mt-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-indigo-100"
                                            >
                                                <Edit className="w-3 h-3" /> Chỉnh sửa lại
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-4">Ảnh xem trước</th>
                                                <th className="p-4">Tiêu đề / Nội dung</th>
                                                <th className="p-4">Ngày tạo</th>
                                                <th className="p-4 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {history.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="w-16 h-16 rounded-lg bg-slate-100 relative flex items-center justify-center overflow-hidden border border-slate-200">
                                                            {item.bgImage && <img src={item.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" />}
                                                            <div className="relative z-10 bg-white p-1 rounded shadow-sm">
                                                                <QRCodeCanvas value={item.value} size={40} fgColor={item.fgColor} level="L" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-900">{item.title || (item.mode === 'contact' ? item.contactInfo?.fullName : 'Không tiêu đề')}</div>
                                                        <div className="text-xs text-slate-400 truncate max-w-[200px]">{item.value}</div>
                                                    </td>
                                                    <td className="p-4 text-xs text-slate-500">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                        <br/>
                                                        {new Date(item.createdAt).toLocaleTimeString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={(e) => quickDownload(item, e)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Tải xuống">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={(e) => handleHistoryCopy(item, e)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Sao chép ảnh">
                                                                <ClipboardCopy className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={(e) => handleRestore(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={(e) => handleDeleteHistory(e, item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Xóa">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                      </>
                   )}
               </div>
            )}

            {view === 'guide' && (
              <div className="p-6 lg:p-10 max-w-5xl mx-auto pb-20">
                {/* Hero Section */}
                <div className="relative bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 text-white overflow-hidden shadow-2xl mb-12">
                    <div className="relative z-10 max-w-lg">
                      <div className="inline-flex items-center gap-2 bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-400/30 mb-4">
                        <Sparkles className="w-3 h-3" /> Hướng dẫn sử dụng
                      </div>
                      <h2 className="text-3xl font-semibold mb-6 leading-tight">Biến liên kết thành <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">tác phẩm nghệ thuật</span></h2>
                      <button onClick={handleCreateNew} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg">
                        Bắt đầu ngay <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                </div>

                {/* Guide Carousel */}
                <div className="relative">
                    <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                             {/* Content Side */}
                             <div className="p-8 md:p-12 flex flex-col justify-center bg-white order-2 md:order-1">
                                 <div className="flex items-center gap-3 mb-6">
                                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                         {GUIDE_STEPS[currentGuideStep].icon}
                                     </div>
                                     <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Bước {currentGuideStep + 1}/{GUIDE_STEPS.length}</div>
                                 </div>
                                 
                                 <h3 className="text-3xl font-bold text-slate-800 mb-4 transition-all duration-300">
                                     {GUIDE_STEPS[currentGuideStep].title}
                                 </h3>
                                 <p className="text-slate-600 text-lg leading-relaxed mb-8 min-h-[100px]">
                                     {GUIDE_STEPS[currentGuideStep].desc}
                                 </p>

                                 {/* Controls */}
                                 <div className="flex items-center gap-4">
                                     <button 
                                        disabled={currentGuideStep === 0}
                                        onClick={() => setCurrentGuideStep(prev => prev - 1)}
                                        className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                     >
                                         <ChevronLeft className="w-6 h-6" />
                                     </button>
                                     <div className="flex gap-2">
                                         {GUIDE_STEPS.map((_, idx) => (
                                             <div 
                                                key={idx} 
                                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentGuideStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}
                                             />
                                         ))}
                                     </div>
                                     <button 
                                        disabled={currentGuideStep === GUIDE_STEPS.length - 1}
                                        onClick={() => setCurrentGuideStep(prev => prev + 1)}
                                        className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                                     >
                                         <ChevronRight className="w-6 h-6" />
                                     </button>
                                 </div>
                             </div>

                             {/* Visual Side */}
                             <div className="bg-slate-50 p-8 md:p-12 flex items-center justify-center border-b md:border-b-0 md:border-l border-slate-100 order-1 md:order-2">
                                 <div className="transform scale-110 transition-all duration-500 ease-in-out">
                                    {GUIDE_STEPS[currentGuideStep].demo}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
              </div>
            )}
         </main>
      </div>
    </div>
  );
}
