/**
 * 黑龙江大桥监测系统 - 服务器兼容性脚本
 * 用于在Linux云服务器环境中运行系统
 * 
 * 版本: 1.0
 */

(function() {
    console.log('黑龙江大桥监测系统 - 服务器兼容性脚本加载中...');
    
    // 运行环境检测
    const ENV = {
        isServer: typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        isHttps: typeof window !== 'undefined' && window.location.protocol === 'https:',
        isLinux: typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Linux') !== -1,
        isMobile: typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        supportsES6: typeof Symbol !== 'undefined',
        timestamp: new Date().toISOString()
    };
    
    // 存储原始的fetch和XMLHttpRequest，用于后续可能的修改
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;
    
    // 基础路径处理，用于Linux环境中的路径转换
    function normalizePath(path) {
        if (!path) return path;
        
        // 如果是绝对URL，则不修改
        if (/^(https?:)?\/\//.test(path)) {
            return path;
        }
        
        // 替换Windows风格的路径分隔符
        path = path.replace(/\\/g, '/');
        
        // 处理可能的磁盘符引用
        path = path.replace(/^[A-Za-z]:\//, '/');
        
        // 确保本地路径以/开头
        if (!path.startsWith('/') && !path.startsWith('./') && !path.startsWith('../')) {
            path = '/' + path;
        }
        
        return path;
    }
    
    // 修补XHR以支持Linux路径
    function patchXHR() {
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            
            xhr.open = function(method, url, async, user, password) {
                const normalizedUrl = normalizePath(url);
                return originalOpen.call(this, method, normalizedUrl, async !== false, user, password);
            };
            
            return xhr;
        };
        
        // 复制原始XHR的属性
        for (const prop in originalXHR) {
            if (originalXHR.hasOwnProperty(prop)) {
                window.XMLHttpRequest[prop] = originalXHR[prop];
            }
        }
        
        console.log('已修补XMLHttpRequest以支持Linux路径');
    }
    
    // 修补fetch以支持Linux路径
    function patchFetch() {
        window.fetch = function(resource, init) {
            if (typeof resource === 'string') {
                resource = normalizePath(resource);
            } else if (resource instanceof Request) {
                resource = new Request(
                    normalizePath(resource.url), 
                    resource
                );
            }
            
            return originalFetch.call(this, resource, init);
        };
        
        console.log('已修补fetch API以支持Linux路径');
    }
    
    // 修补文件系统API
    function patchFileSystem() {
        // 文件读取器增强，处理编码问题
        const originalFileReader = window.FileReader;
        
        if (originalFileReader) {
            window.FileReader = function() {
                const reader = new originalFileReader();
                const originalReadAsText = reader.readAsText;
                
                // 增强readAsText方法，自动检测编码
                reader.readAsText = function(blob, encoding) {
                    // 如果未指定编码，尝试使用UTF-8
                    return originalReadAsText.call(this, blob, encoding || 'UTF-8');
                };
                
                return reader;
            };
            
            // 复制原型和静态属性
            window.FileReader.prototype = originalFileReader.prototype;
            for (const prop in originalFileReader) {
                if (originalFileReader.hasOwnProperty(prop)) {
                    window.FileReader[prop] = originalFileReader[prop];
                }
            }
            
            console.log('已增强FileReader以改善编码处理');
        }
    }
    
    // 修补计时器，防止云服务器上的性能问题
    function patchTimers() {
        // 存储原始计时器函数
        const originalSetTimeout = window.setTimeout;
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        
        // 重写setTimeout，添加错误处理
        window.setTimeout = function(callback, delay, ...args) {
            if (typeof callback !== 'function') {
                return originalSetTimeout(callback, delay, ...args);
            }
            
            return originalSetTimeout(function() {
                try {
                    callback.apply(this, args);
                } catch (e) {
                    console.error('定时器回调执行出错:', e);
                }
            }, delay);
        };
        
        // 针对Linux服务器优化requestAnimationFrame
        if (ENV.isServer && originalRequestAnimationFrame) {
            window.requestAnimationFrame = function(callback) {
                return originalSetTimeout(function() {
                    try {
                        callback(performance.now());
                    } catch (e) {
                        console.error('动画帧回调执行出错:', e);
                    }
                }, 1000 / 60); // 约60fps
            };
            
            console.log('已针对服务器环境优化动画函数');
        }
    }
    
    // 添加全局错误处理
    function addErrorHandling() {
        window.addEventListener('error', function(event) {
            console.error('全局错误:', {
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });
            
            // 在Linux服务器环境中记录错误
            if (ENV.isServer) {
                try {
                    // 存储到localStorage，方便后续查看
                    const errors = JSON.parse(localStorage.getItem('system_errors') || '[]');
                    errors.push({
                        timestamp: new Date().toISOString(),
                        message: event.message,
                        source: event.filename,
                        line: event.lineno,
                        environment: 'Linux服务器'
                    });
                    
                    // 限制记录数量
                    if (errors.length > 50) errors.splice(0, errors.length - 50);
                    
                    localStorage.setItem('system_errors', JSON.stringify(errors));
                } catch (e) {
                    console.error('保存错误记录失败:', e);
                }
            }
            
            return false; // 允许默认的错误处理程序继续执行
        }, true);
        
        console.log('已添加全局错误处理');
    }
    
    // 服务器文件路径适配
    function patchServerFilePaths() {
        // 针对可能的图片和资源文件路径问题
        document.querySelectorAll('img[src], link[href], script[src]').forEach(element => {
            if (element.tagName === 'IMG' && element.src) {
                try {
                    const normalizedSrc = normalizePath(element.getAttribute('src'));
                    element.src = normalizedSrc;
                } catch (e) {}
            }
            else if (element.tagName === 'LINK' && element.href) {
                try {
                    const normalizedHref = normalizePath(element.getAttribute('href'));
                    element.href = normalizedHref;
                } catch (e) {}
            }
            else if (element.tagName === 'SCRIPT' && element.src) {
                try {
                    const normalizedSrc = normalizePath(element.getAttribute('src'));
                    element.src = normalizedSrc;
                } catch (e) {}
            }
        });
        
        console.log('已修补资源文件路径');
    }
    
    // 添加服务器环境信息到页面
    function addServerInfo() {
        if (ENV.isServer) {
            const infoElement = document.createElement('div');
            infoElement.className = 'server-info';
            infoElement.style.cssText = 'position:fixed; bottom:5px; right:5px; font-size:11px; color:#999; ' +
                                         'background:rgba(0,0,0,0.05); padding:2px 5px; border-radius:3px; z-index:9999;';
            infoElement.textContent = '云服务器环境 | ' + new Date().toLocaleDateString('zh-CN');
            
            // 添加到body
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(infoElement);
                console.log('已添加服务器环境信息');
            });
        }
    }
    
    // 执行所有兼容性修补
    function applyCompatibilityFixes() {
        try {
            // 修补XHR和fetch API
            patchXHR();
            patchFetch();
            
            // 修补文件系统API
            patchFileSystem();
            
            // 修补计时器
            patchTimers();
            
            // 添加错误处理
            addErrorHandling();
            
            // DOM加载完成后执行的修补
            document.addEventListener('DOMContentLoaded', function() {
                // 修补服务器文件路径
                patchServerFilePaths();
                
                // 添加服务器环境信息
                addServerInfo();
                
                console.log('DOM加载完成后的兼容性修补已应用');
            });
            
            console.log('服务器兼容性脚本加载完成，已应用所有修补');
        } catch (error) {
            console.error('应用服务器兼容性修补时出错:', error);
        }
    }
    
    // 立即应用兼容性修补
    applyCompatibilityFixes();
})(); 