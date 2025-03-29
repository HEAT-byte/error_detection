/**
 * 黑龙江大桥监测系统 - 紧急修复脚本
 * 解决云服务器环境中的关键错误
 * 
 * 版本: 1.1
 */

(function() {
    console.log('应用紧急修复...');
    
    // 1. 处理Chart未定义问题
    if (typeof Chart === 'undefined') {
        console.warn('Chart对象未定义，创建兼容对象');
        
        // 创建模拟Chart对象
        window.Chart = function(ctx, config) {
            console.log('使用Chart模拟对象');
            this.ctx = ctx;
            this.config = config;
            
            // 在画布上显示错误消息
            if (ctx && ctx.getContext) {
                const context = ctx.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, ctx.width, ctx.height);
                    context.font = '14px Arial';
                    context.fillStyle = '#e53e3e';
                    context.textAlign = 'center';
                    context.fillText('图表库加载失败', ctx.width / 2, ctx.height / 2 - 15);
                    context.fillText('请确认js/chart.min.js文件存在', ctx.width / 2, ctx.height / 2 + 15);
                }
            }
        };
        
        // 添加必要的方法，防止错误
        window.Chart.prototype.update = function() {};
        window.Chart.prototype.destroy = function() {};
        window.Chart.prototype.resize = function() {};
        window.Chart.register = function() {};
        window.Chart.defaults = {
            font: { size: 12 },
            color: '#666',
            plugins: {}
        };
        
        // 尝试加载本地Chart.js
        const script = document.createElement('script');
        script.src = 'js/chart.min.js';
        script.onload = function() {
            console.log('成功加载本地Chart.js');
        };
        script.onerror = function() {
            console.error('无法加载本地Chart.js');
        };
        document.head.appendChild(script);
    }
    
    // 2. 处理noMonitorMessage未定义问题
    if (typeof window.noMonitorMessage === 'undefined') {
        console.warn('noMonitorMessage未定义，创建空对象');
        window.noMonitorMessage = { 
            style: { display: 'none' }
        };
    }
    
    // 3. 处理handleFileUpload未定义问题
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
    
    // 4. 修复createAnomalyChart函数
    const originalCreateAnomalyChart = window.createAnomalyChart;
    if (typeof originalCreateAnomalyChart === 'function') {
        window.createAnomalyChart = function(sensorGroups) {
            try {
                if (typeof Chart === 'undefined') {
                    console.error('Chart未定义，无法创建图表');
                    
                    // 获取图表容器并显示错误消息
                    const chartContainer = document.getElementById('anomaly-chart-container');
                    if (chartContainer) {
                        chartContainer.innerHTML = `
                            <div style="padding: 20px; text-align: center; color: #e53e3e;">
                                <div style="font-size: 18px; margin-bottom: 10px;">图表创建失败</div>
                                <div>请确认js/chart.min.js文件存在</div>
                                <div style="margin-top: 15px;">
                                    <button onclick="location.reload()" style="padding: 5px 15px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        刷新页面
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    return;
                }
                
                // 调用原始函数
                originalCreateAnomalyChart(sensorGroups);
            } catch (error) {
                console.error('创建异常图表时出错:', error);
                
                // 获取图表容器并显示错误消息
                const chartContainer = document.getElementById('anomaly-chart-container');
                if (chartContainer) {
                    chartContainer.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #e53e3e;">
                            <div style="font-size: 18px; margin-bottom: 10px;">图表创建失败</div>
                            <div>${error.message || '未知错误'}</div>
                            <div style="margin-top: 15px;">
                                <button onclick="location.reload()" style="padding: 5px 15px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    刷新页面
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        };
    }
    
    // 5. 拦截错误，避免页面崩溃
    window.addEventListener('error', function(event) {
        console.error('捕获到错误:', event.message);
        
        // 防止noMonitorMessage相关错误导致页面崩溃
        if (event.message.includes('noMonitorMessage') && window.noMonitorMessage) {
            event.preventDefault();
            return false;
        }
        
        // 防止Chart相关错误导致页面崩溃
        if (event.message.includes('Chart') && typeof Chart !== 'undefined') {
            event.preventDefault();
            return false;
        }
    }, true);
    
    console.log('紧急修复已应用');
})(); 