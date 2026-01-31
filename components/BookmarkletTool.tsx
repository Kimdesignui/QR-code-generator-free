import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MousePointer2, HelpCircle, ArrowUp, Monitor, PlayCircle, Globe, AlertTriangle, RefreshCw, Code, Maximize2, Minimize2 } from 'lucide-react';

export const BookmarkletTool: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [testUrl, setTestUrl] = useState(''); // User typed URL
  const [activeUrl, setActiveUrl] = useState(''); // URL actually loaded in iframe
  const [iframeMode, setIframeMode] = useState<'mock' | 'live'>('mock');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Mock HTML mimicking a complex e-commerce structure
  const mockHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; background: #f8fafc; padding: 20px; display: flex; justify-content: center; }
        .product-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; width: 300px; padding: 16px; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .img-container { position: relative; width: 100%; height: 300px; margin-bottom: 12px; overflow: hidden; border-radius: 4px; }
        .real-img { width: 100%; height: 100%; object-fit: cover; }
        /* Complex Overlay mimicking Shopee/Lazada protection */
        .overlay-layer { position: absolute; inset: 0; background: rgba(0,0,0,0.02); z-index: 10; cursor: pointer; }
        .badge { position: absolute; top: 0; right: 0; background: #ef4444; color: white; padding: 2px 8px; font-size: 10px; z-index: 20; }
        .price { color: #ef4444; font-size: 18px; font-weight: bold; margin: 8px 0; }
        .title { font-size: 14px; line-height: 1.4; color: #334155; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .note { font-size: 11px; color: #94a3b8; margin-top: 20px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="product-card">
        <div class="img-container">
           <!-- The image is buried under an overlay div -->
           <img class="real-img" src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" alt="Book Cover" />
           <div class="overlay-layer" title="Lớp phủ chống copy (Overlay)"></div>
           <div class="badge">Yêu thích</div>
        </div>
        <div class="title">Sách - Nghệ Thuật Tinh Tế Của Việc Đếch Quan Tâm (Tái Bản Mới Nhất)</div>
        <div class="price">89.000 ₫</div>
        <div class="note">
          💡 Thử thách: Click chuột phải vào ảnh.<br/>
          (Tool phải xuyên qua lớp overlay trong suốt để lấy ảnh bên dưới)
        </div>
      </div>
    </body>
    </html>
  `;

  // Đây là mã nguồn Javascript thô (Single Source of Truth)
  // Được viết để chạy trên mọi môi trường (Web thực tế & Test Zone)
  // LƯU Ý: Dùng comment /* */ thay vì // để tránh lỗi khi regex replace newline
  const rawJsCode = `
    (function(){
      try {
        var d = document;
        var b = d.body;
        var elId = 'magic-picker-root-v4';
        
        /* 1. Kiểm tra & Xóa bản cũ nếu có để reset */
        var existing = d.getElementById(elId);
        if(existing) {
          existing.remove();
          /* Với chế độ test iframe, ta muốn nó luôn bật chứ ko toggle tắt */
          /* Tuy nhiên khi chạy eval trực tiếp, ta sẽ remove thủ công trước khi chạy script này để đảm bảo nó luôn hiện */
          if (window.location.protocol === 'about:') return; 
          return;
        }

        /* 2. Style */
        var css = 'position:fixed; bottom:20px; right:20px; width:280px; padding:12px; ' + 
                  'background:#0f172a; color:white; z-index:2147483647 !important; ' +
                  'border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.8); ' +
                  'border:2px solid #3b82f6; font-family:sans-serif; font-size:13px; line-height:1.4; ' +
                  'opacity:0; transform:translateY(20px); transition:all 0.3s ease; text-align:left;';

        /* 3. Panel */
        var o = d.createElement('div');
        o.id = elId;
        o.style.cssText = css;
        
        var list = [];
        var cur = {img: '', name: ''};

        /* Helper: Toast */
        function toast(msg, color) {
          var t = d.createElement('div');
          t.innerText = msg;
          t.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); ' +
                            'background:'+(color||'rgba(0,0,0,0.9)')+'; color:white; padding:10px 20px; ' +
                            'border-radius:50px; font-size:16px; font-weight:bold; z-index:2147483647; ' +
                            'box-shadow:0 10px 20px rgba(0,0,0,0.5); pointer-events:none; transition:opacity 0.5s;';
          b.appendChild(t);
          setTimeout(function(){ t.style.opacity = '0'; setTimeout(function(){ if(t.parentNode) t.remove(); }, 500); }, 1000);
        }
        
        /* Render */
        function render() {
          var imgStatus = cur.img ? '✅ Đã lấy Ảnh' : '👉 B1: Chuột phải Ảnh';
          var nameStatus = cur.name ? '✅ Đã lấy Tên' : '👉 B2: Bôi đen Tên';
          var count = list.length;
          var btnTxt = count > 0 ? 'COPY (' + count + ')' : 'CHƯA CÓ';
          var btnBg = count > 0 ? '#3b82f6' : '#334155';
          
          o.innerHTML = 
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #334155;padding-bottom:5px">' +
              '<b style="color:#60a5fa">🔮 Magic Picker</b>' +
              '<button id="mp-x" style="background:none;border:none;color:#94a3b8;cursor:pointer;">&times;</button>' +
            '</div>' +
            '<div style="margin-bottom:8px;color:#cbd5e1">' +
               '<div style="color:'+(cur.img?'#4ade80':'#cbd5e1')+'">'+imgStatus+'</div>' +
               '<div style="color:'+(cur.name?'#4ade80':'#cbd5e1')+'">'+nameStatus+'</div>' +
            '</div>' +
            '<div style="display:flex;gap:5px">' +
               '<button id="mp-r" style="flex:1;padding:6px;background:#475569;border:none;border-radius:4px;color:white;cursor:pointer">RESET</button>' +
               '<button id="mp-c" style="flex:2;padding:6px;background:'+btnBg+';border:none;border-radius:4px;color:white;font-weight:bold;cursor:pointer">'+btnTxt+'</button>' +
            '</div>';
          
          d.getElementById('mp-x').onclick = close;
          d.getElementById('mp-c').onclick = copy;
          d.getElementById('mp-r').onclick = function(){ cur={img:'',name:''}; toast('Reset','#64748b'); render(); };
        }

        /* Logic Save */
        function checkFull() {
          if(cur.img && cur.name) {
             list.push({imageUrl: cur.img, name: cur.name});
             toast('🎉 ĐÃ LƯU!', '#22c55e');
             cur = {img:'', name:''};
             o.style.borderColor = '#22c55e';
             setTimeout(function(){ o.style.borderColor = '#3b82f6'; }, 300);
          }
          render();
        }

        /* Logic: Find Img (Deep Search) */
        function findImg(el) {
          if(!el) return null;
          if(el.tagName === 'IMG') return el.src || el.dataset.src;
          var childImg = el.querySelector('img');
          if(childImg) return childImg.src || childImg.dataset.src;
          var style = window.getComputedStyle(el);
          var bg = style.backgroundImage;
          if(bg && bg !== 'none' && bg.startsWith('url')) {
             return bg.slice(5, -2).replace(/['"]/g, '');
          }
          return null;
        }

        /* Event: Right Click */
        function onRightClick(e) {
          if(o.contains(e.target)) return;
          var t = e.target;
          var src = findImg(t);
          if(!src) {
             var p = t.parentElement;
             for(var i=0; i<5 && p; i++) {
                src = findImg(p);
                if(src) break;
                p = p.parentElement;
             }
          }
          if(src) {
            e.preventDefault(); e.stopPropagation();
            cur.img = src;
            toast('📸 ĐÃ LẤY ẢNH', '#3b82f6');
            try { 
                var targetEl = p || t;
                targetEl.style.outline = '4px solid #eab308';
                setTimeout(function(){ targetEl.style.outline = 'none'; }, 500);
            } catch(ex){}
            checkFull();
          }
        }

        /* Event: MouseUp */
        function onMouseUp(e) {
          if(o.contains(e.target)) return;
          setTimeout(function(){
              var txt = window.getSelection().toString().trim();
              if(txt && txt.length > 2) {
                  cur.name = txt;
                  toast('📝 ĐÃ LẤY TÊN', '#eab308');
                  checkFull();
              }
          }, 100);
        }

        /* Copy */
        function copy() {
          if(list.length === 0) { toast('⚠️ Trống!', '#ef4444'); return; }
          var json = JSON.stringify(list);

          /* 1. Check current window */
          if(window.magicPickerAutoPaste) {
             window.magicPickerAutoPaste(json);
             toast('⚡ ĐÃ DÁN!', '#8b5cf6');
             close();
             return;
          }
          /* 2. Check parent window (if in Iframe) */
          if(window.parent && window.parent.magicPickerAutoPaste) {
             window.parent.magicPickerAutoPaste(json);
             /* Create toast in parent if possible, otherwise alert */
             try {
                /* Try to create toast in this frame */
                toast('⚡ ĐÃ GỬI VỀ APP!', '#8b5cf6');
             } catch(e) {}
             close();
             return;
          }

          /* 3. Fallback */
          navigator.clipboard.writeText(json).then(function(){
             alert('✅ ĐÃ COPY ' + list.length + ' MÓN!\\n\\nQuay lại app và dán.');
             close();
          });
        }

        function close() {
          d.removeEventListener('contextmenu', onRightClick, true);
          d.removeEventListener('mouseup', onMouseUp, true);
          o.style.opacity = '0';
          setTimeout(function(){ o.remove(); }, 300);
        }

        d.addEventListener('contextmenu', onRightClick, true);
        d.addEventListener('mouseup', onMouseUp, true);
        b.appendChild(o);
        requestAnimationFrame(function(){ o.style.opacity = '1'; o.style.transform = 'translateY(0)'; });
        render();
        toast('🚀 MAGIC PICKER ON', '#3b82f6');
      } catch (e) {
        alert("Lỗi: " + e.message);
      }
    })();
  `;

  // Helper to clean code (Minify simplistic) for bookmarklet URL
  // We use /* */ comments in raw code now, so it is safer to strip them.
  const cleanCode = useMemo(() => {
    let c = rawJsCode.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    // c.replace(/\/\/.*/g, '') removed because we stopped using line comments
    c = c.replace(/\n/g, ' '); // Remove newlines
    c = c.replace(/\s+/g, ' ').trim(); // Compact spaces
    return c;
  }, [rawJsCode]);

  const bookmarkletHref = useMemo(() => {
    return `javascript:${encodeURIComponent(cleanCode)}`;
  }, [cleanCode]);

  // Handle Injecting Code into Iframe
  const handleTestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Nếu đang ở chế độ Live (URL ngoài), không thể inject được do bảo mật
    if (iframeMode === 'live') {
      alert("⚠️ CẢNH BÁO BẢO MẬT TRÌNH DUYỆT\n\nBạn đang ở chế độ 'Website Thực tế'. Trình duyệt sẽ CHẶN việc chạy tool lên website của người khác (Shopee/Google...).\n\nVui lòng bấm 'Quay về Giả lập' để test tool.");
      return;
    }

    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow;

    if (!win) return;

    try {
      // 1. Force Reset: Nếu tool đã có, ta xóa nó đi để code khởi tạo lại từ đầu.
      // Điều này quan trọng vì logic trong script là "toggle" (nếu có rồi thì xóa).
      // Nhưng nút Kích hoạt này mang ý nghĩa "Bật lên".
      const doc = win.document;
      const existing = doc.getElementById('magic-picker-root-v4');
      if (existing) {
        existing.remove();
      }

      // 2. Chạy trực tiếp code gốc (rawJsCode) qua eval
      // Dùng rawJsCode để đảm bảo không bị lỗi cú pháp do regex minification
      // @ts-ignore
      win.eval(rawJsCode);

    } catch (err: any) {
       console.error(err);
       alert("Lỗi khởi chạy tool: " + err.message);
    }
  };

  const loadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if(testUrl) {
        setIframeMode('live');
        setActiveUrl(testUrl);
    }
  };

  const switchToMock = () => {
      setIframeMode('mock');
      setTestUrl('');
      setActiveUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl border border-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg hidden sm:block">
            <MousePointer2 className="h-8 w-8 text-blue-400" />
          </div>
          <div className="flex-1">
             <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <span className="sm:hidden"><MousePointer2 className="h-6 w-6 text-blue-400" /></span>
                        Công cụ "Magic Picker" (Bản V4 - Deep Search)
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">
                        Tự động bắt ảnh sau lớp Overlay. Hỗ trợ tự động gửi dữ liệu về App.
                    </p>
                </div>
                <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-slate-600"
                >
                    <HelpCircle className="h-3 w-3" />
                    {showGuide ? 'Ẩn HD' : 'Hiện HD'}
                </button>
            </div>

            {showGuide && (
                <div className="mb-6 bg-slate-950/80 rounded-xl border border-slate-700 p-4 text-sm animate-in fade-in slide-in-from-top-2">
                    <p className="mb-2"><span className="text-yellow-400 font-bold">Bước 1:</span> Kéo nút xanh dưới đây lên thanh Bookmarks.</p>
                    <p className="mb-2"><span className="text-yellow-400 font-bold">Bước 2:</span> Mở tab Shopee/Tiki/Lazada.</p>
                    <p><span className="text-yellow-400 font-bold">Bước 3:</span> Bấm nút trên thanh Bookmarks để dùng.</p>
                </div>
            )}
            
            <a 
              href={bookmarkletHref}
              className="w-full sm:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg hover:shadow-blue-500/25 transition-all cursor-move active:cursor-grabbing flex items-center justify-center gap-2 group ring-4 ring-blue-500/20 mb-4"
              title="Kéo tôi lên thanh Bookmarks!"
              onClick={(e) => e.preventDefault()}
            >
              <span className="text-xl group-hover:scale-105 transition-transform">🔮 Magic Picker V4</span>
            </a>
          </div>
        </div>
      </div>

      {/* Browser Simulator / Test Zone */}
      <div className={`border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col shadow-inner transition-all duration-300 ${
        isFullScreen 
        ? "fixed inset-0 z-50 h-screen rounded-none w-screen" 
        : "h-[600px] rounded-xl"
      }`}>
        {/* Browser Toolbar */}
        <div className="bg-gray-200 dark:bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-300 dark:border-gray-700">
           <div className="flex gap-1.5 ml-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
           </div>
           
           <form onSubmit={loadUrl} className="flex-1 flex gap-2">
               <div className="flex-1 relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       {iframeMode === 'mock' ? <Code className="h-4 w-4 text-blue-500" /> : <Globe className="h-4 w-4 text-gray-500" />}
                   </div>
                   <input 
                      type="text" 
                      className="w-full pl-9 pr-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
                      placeholder="Nhập URL website để test (Lưu ý: Shopee/Tiki chặn Iframe)..."
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                   />
               </div>
               <button type="submit" className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                  Đi tới
               </button>
           </form>

           <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

           {iframeMode === 'live' && (
              <button onClick={switchToMock} className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-md font-medium hover:bg-indigo-200 transition-colors whitespace-nowrap">
                  Quay về Giả lập
              </button>
           )}

           <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}
           >
              {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
           </button>

           <button
              onClick={handleTestClick}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all flex items-center gap-2 animate-pulse whitespace-nowrap"
           >
              <PlayCircle className="h-4 w-4" />
              KÍCH HOẠT TOOL
           </button>
        </div>

        {/* Browser Viewport */}
        <div className="flex-1 relative bg-white dark:bg-white w-full h-full">
            {iframeMode === 'mock' ? (
                <iframe 
                    ref={iframeRef}
                    srcDoc={mockHtml}
                    title="Mock Environment"
                    className="w-full h-full border-none"
                />
            ) : (
                <div className="w-full h-full relative">
                    <iframe 
                        ref={iframeRef}
                        src={activeUrl}
                        title="Live Environment"
                        className="w-full h-full border-none"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    />
                    {/* Security Warning Overlay for Live Mode */}
                    <div className="absolute top-0 left-0 right-0 bg-orange-100 text-orange-800 px-4 py-2 text-xs flex items-center justify-center gap-2 border-b border-orange-200 opacity-90 hover:opacity-100 transition-opacity">
                        <AlertTriangle className="h-4 w-4" />
                        Lưu ý: Nếu trang web trắng trơn hoặc báo lỗi "Refused to connect", nghĩa là trang đó chặn nhúng Iframe. Hãy dùng chế độ "Giả lập" để test tool.
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
