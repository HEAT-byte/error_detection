/**
 * 黑龙江大桥监测系统 - 本地资源修复脚本
 * 移除所有网络资源引用，确保系统只使用本地资源
 * 
 * 版本: 1.0
 */

(function() {
    console.log('开始应用本地资源修复...');
    
    // 在DOM加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLocalResources);
    } else {
        initLocalResources();
    }
    
    function initLocalResources() {
        console.log('DOM已加载，开始应用本地资源修复...');
        
        // 1. 移除网络资源引用
        removeNetworkResources();
        
        // 2. 处理Chart未定义问题
        ensureChartDefined();
        
        // 3. 处理noMonitorMessage未定义问题
        ensureNoMonitorMessageDefined();
        
        // 4. 处理handleFileUpload未定义问题
        ensureHandleFileUploadDefined();
        
        // 5. 重新绑定事件处理器
        rebindEventHandlers();
        
        console.log('本地资源修复应用完成');
    }
    
    // 移除所有网络资源引用
    function removeNetworkResources() {
        const networkPatterns = [
            'cdn.jsdelivr.net',
            'fonts.googleapis.com',
            'cdnjs.cloudflare.com',
            'unpkg.com'
        ];
        
        // 移除脚本标签
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(function(script) {
            const src = script.getAttribute('src');
            if (src && networkPatterns.some(pattern => src.includes(pattern))) {
                console.warn('移除网络脚本:', src);
                script.parentNode.removeChild(script);
            }
        });
        
        // 移除样式表
        const links = document.querySelectorAll('link[href]');
        links.forEach(function(link) {
            const href = link.getAttribute('href');
            if (href && networkPatterns.some(pattern => href.includes(pattern))) {
                console.warn('移除网络样式:', href);
                link.parentNode.removeChild(link);
            }
        });
    }
    
    // 确保Chart对象被定义
    function ensureChartDefined() {
        if (typeof window.Chart === 'undefined') {
            console.warn('Chart对象未定义，创建备用对象');
            
            // 尝试加载本地Chart.js
            const script = document.createElement('script');
            script.src = 'js/chart.min.js';
            document.head.appendChild(script);
            
            // 创建临时Chart对象防止错误
            window.Chart = function(ctx, config) {
                console.log('使用临时Chart对象');
                this.ctx = ctx;
                this.config = config;
            };
            
            // 添加必要的方法
            window.Chart.prototype.update = function() {};
            window.Chart.prototype.destroy = function() {};
            window.Chart.register = function() {};
            window.Chart.defaults = {
                font: { size: 12 },
                color: '#666',
                plugins: {}
            };
        }
    }
    
    // 确保noMonitorMessage被定义
    function ensureNoMonitorMessageDefined() {
        if (typeof window.noMonitorMessage === 'undefined') {
            console.warn('noMonitorMessage未定义，创建空对象');
            window.noMonitorMessage = { 
                style: { display: 'none' }
            };
        }
    }
    
    // 确保handleFileUpload被定义
    function ensureHandleFileUploadDefined() {
        if (typeof window.handleFileUpload !== 'function') {
            console.warn('handleFileUpload函数未定义，创建兼容函数');
            window.handleFileUpload = function(event) {
                try {
                    const fileInput = event.target;
                    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                        console.warn('未选择文件');
                        return;
                    }
                    
                    const file = fileInput.files[0];
                    console.log(`已选择文件: ${file.name} (${formatFileSize(file.size)})`);
                    
                    // 显示文件信息
                    const fileInfo = document.getElementById('fileInfo');
                    if (fileInfo) {
                        fileInfo.textContent = `已选择文件: ${file.name} (${formatFileSize(file.size)})`;
                    }
                    
                    // 启用上传按钮
                    const uploadButton = document.getElementById('uploadButton');
                    if (uploadButton) {
                        uploadButton.disabled = false;
                    }
                } catch (error) {
                    console.error('处理文件上传时出错:', error);
                }
            };
            
            // 如果formatFileSize未定义，也添加该函数
            if (typeof window.formatFileSize !== 'function') {
                window.formatFileSize = function(bytes) {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
            }
        }
    }
    
    // 重新绑定事件处理器
    function rebindEventHandlers() {
        setTimeout(function() {
            try {
                console.log('重新绑定文件处理事件...');
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach(function(input) {
                    input.addEventListener('change', window.handleFileUpload);
                });
                
                console.log('已重新绑定', fileInputs.length, '个文件输入事件');
            } catch (error) {
                console.error('重新绑定事件失败:', error);
            }
        }, 1000);
    }
})(); 