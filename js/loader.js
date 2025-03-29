/**
 * 黑龙江大桥监测系统兼容性脚本加载器
 * 负责加载所有修复和兼容性脚本
 * 
 * 版本: 1.0
 */

(function() {
    console.log('黑龙江大桥监测系统 - 脚本加载器启动');
    
    // 定义需要加载的脚本列表
    const scripts = [
        'js/canvas-polyfill.js',      // Canvas元素兼容性修复
        'js/chart-loader.js',         // Chart.js增强加载器
        'js/bridge-patch.js',         // 桥梁监测系统修复脚本
        'js/anomaly-detection.js',    // 异常检测增强脚本  
        'js/font-icons.js'            // 字体图标兼容性脚本
    ];
    
    // 加载器配置
    const config = {
        async: true,        // 异步加载脚本
        ordered: true,      // 按顺序加载（等前一个完成后再加载下一个）
        loadTimeout: 10000  // 脚本加载超时时间（毫秒）
    };
    
    // 加载脚本
    loadScripts(scripts, 0);
    
    // 按顺序加载脚本的函数
    function loadScripts(scriptList, index) {
        if (index >= scriptList.length) {
            console.log('所有脚本加载完成');
            runSystemInitialization();
            return;
        }
        
        const scriptPath = scriptList[index];
        
        // 检查脚本是否已经加载
        if (isScriptLoaded(scriptPath)) {
            console.log(`脚本 ${scriptPath} 已加载，跳过`);
            loadScripts(scriptList, index + 1);
            return;
        }
        
        console.log(`加载脚本 (${index + 1}/${scriptList.length}): ${scriptPath}`);
        
        // 创建script元素
        const script = document.createElement('script');
        script.src = scriptPath;
        script.async = config.async;
        
        // 设置超时
        let timeoutId = null;
        if (config.loadTimeout > 0) {
            timeoutId = setTimeout(function() {
                console.warn(`脚本 ${scriptPath} 加载超时`);
                
                // 继续加载下一个脚本
                if (config.ordered) {
                    loadScripts(scriptList, index + 1);
                }
            }, config.loadTimeout);
        }
        
        // 加载成功
        script.onload = function() {
            console.log(`脚本 ${scriptPath} 加载成功`);
            
            // 清除超时计时器
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            // 继续加载下一个脚本
            if (config.ordered) {
                loadScripts(scriptList, index + 1);
            }
        };
        
        // 加载失败
        script.onerror = function() {
            console.error(`脚本 ${scriptPath} 加载失败`);
            
            // 清除超时计时器
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            // 继续加载下一个脚本
            if (config.ordered) {
                loadScripts(scriptList, index + 1);
            }
        };
        
        // 如果不按顺序加载，直接加载下一个
        if (!config.ordered) {
            loadScripts(scriptList, index + 1);
        }
        
        // 将脚本添加到文档
        document.head.appendChild(script);
    }
    
    // 检查脚本是否已经加载
    function isScriptLoaded(src) {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.indexOf(src) !== -1) {
                return true;
            }
        }
        return false;
    }
    
    // 系统初始化函数
    function runSystemInitialization() {
        console.log('所有兼容性脚本加载完成，初始化系统');
        
        // 设置一个标志，表示系统已经通过兼容性加载器加载
        window._systemLoaded = true;
        
        // 如果需要，在这里执行其他初始化操作
        
        // 触发自定义事件，通知系统已准备就绪
        if (typeof document.createEvent === 'function') {
            try {
                const event = document.createEvent('Event');
                event.initEvent('systemReady', true, true);
                document.dispatchEvent(event);
                console.log('触发systemReady事件');
            } catch (e) {
                console.error('无法触发systemReady事件:', e);
            }
        }
    }
})(); 