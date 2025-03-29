/**
 * 黑龙江大桥监测系统 - Chart.js修复脚本
 * 解决在服务器环境中Chart.js加载失败问题
 * 
 * 版本: 1.1
 */

(function() {
    console.log('正在应用Chart.js修复脚本...');
    
    // 检查Chart.js是否已加载
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js未加载，应用临时修复...');
        
        // 只使用本地版本的Chart.js
        const chartSource = 'js/chart.min.js';
        
        function loadLocalChartJs() {
            console.log('尝试加载本地Chart.js...');
            
            const script = document.createElement('script');
            script.src = chartSource;
            script.onload = function() {
                console.log('成功从本地加载Chart.js');
                
                // 加载成功后重新触发图表创建
                setTimeout(function() {
                    if (typeof window.createAnomalyChart === 'function' && typeof window.sensorGroups !== 'undefined') {
                        console.log('重新尝试创建异常图表...');
                        window.createAnomalyChart(window.sensorGroups);
                    }
                }, 500);
            };
            
            script.onerror = function() {
                console.error('无法加载本地Chart.js，创建模拟对象');
                createMockChart();
            };
            
            document.head.appendChild(script);
        }
        
        // 创建Chart模拟对象，以防本地加载失败
        function createMockChart() {
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
            
            console.log('已创建Chart模拟对象，系统可以继续运行，但图表将不可见');
            
            // 尝试重新触发图表创建
            setTimeout(function() {
                if (typeof window.createAnomalyChart === 'function' && typeof window.sensorGroups !== 'undefined') {
                    console.log('使用模拟Chart对象尝试创建异常图表...');
                    window.createAnomalyChart(window.sensorGroups);
                }
            }, 1000);
        }
        
        // 开始加载本地Chart.js
        loadLocalChartJs();
    } else {
        console.log('Chart.js已成功加载，无需修复');
    }
    
    // 修补createAnomalyChart函数，增加错误处理
    if (typeof window.createAnomalyChart === 'function') {
        const originalCreateAnomalyChart = window.createAnomalyChart;
        
        window.createAnomalyChart = function(sensorGroups) {
            try {
                console.log('使用增强的createAnomalyChart函数...');
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
                
                // 如果Chart未定义，立即尝试加载
                if (typeof Chart === 'undefined') {
                    loadLocalChartJs();
                }
            }
        };
        
        console.log('已增强createAnomalyChart函数以添加错误处理');
    }
    
    console.log('Chart.js修复脚本应用完成');
})(); 