/**
 * 黑龙江大桥监测系统 - Chart.js备用实现
 * 确保Chart对象始终可用，防止系统出错
 * 
 * 版本: 1.0
 */

(function() {
    console.log('加载Chart.js备用实现...');
    
    // 如果Chart已定义则不覆盖
    if (typeof window.Chart !== 'undefined') {
        console.log('Chart对象已存在，备用实现不启用');
        return;
    }
    
    console.warn('使用Chart备用实现');
    
    // 创建基本的Chart类
    window.Chart = function(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.type = config.type || 'line';
        this.data = config.data || { datasets: [] };
        this.options = config.options || {};
        
        console.log('创建图表:', this.type, '数据集数量:', this.data.datasets ? this.data.datasets.length : 0);
        
        // 在画布上显示基本信息
        this._renderFallbackUI();
    };
    
    // 添加原型方法
    Chart.prototype._renderFallbackUI = function() {
        try {
            if (!this.ctx || !this.ctx.getContext) return;
            
            const context = this.ctx.getContext('2d');
            if (!context) return;
            
            const width = this.ctx.width || 300;
            const height = this.ctx.height || 200;
            
            // 清空画布
            context.clearRect(0, 0, width, height);
            
            // 绘制边框
            context.strokeStyle = '#ccc';
            context.lineWidth = 1;
            context.strokeRect(1, 1, width - 2, height - 2);
            
            // 图表类型和数据集信息
            context.font = '14px Arial';
            context.fillStyle = '#333';
            context.textAlign = 'center';
            
            const datasetsCount = this.data.datasets ? this.data.datasets.length : 0;
            const dataPointsCount = datasetsCount > 0 && this.data.datasets[0].data ? this.data.datasets[0].data.length : 0;
            
            context.fillText(`${this.type}图表 (${datasetsCount}个数据集, 每集${dataPointsCount}个数据点)`, width / 2, height / 2 - 20);
            context.fillText('图表库加载异常，显示备用界面', width / 2, height / 2);
            context.fillText('数据分析正常进行中', width / 2, height / 2 + 20);
        } catch (e) {
            console.error('绘制备用UI失败:', e);
        }
    };
    
    // 基本方法实现
    Chart.prototype.update = function() { 
        console.log('图表更新');
        this._renderFallbackUI();
    };
    
    Chart.prototype.destroy = function() { 
        console.log('图表销毁');
        if (this.ctx && this.ctx.getContext) {
            const context = this.ctx.getContext('2d');
            if (context) {
                context.clearRect(0, 0, this.ctx.width || 300, this.ctx.height || 200);
            }
        }
    };
    
    Chart.prototype.resize = function() { 
        console.log('图表调整大小');
        this._renderFallbackUI();
    };
    
    // 静态方法和属性
    Chart.register = function() { 
        console.log('Chart.register 调用');
    };
    
    Chart.defaults = {
        font: { size: 12 },
        color: '#666',
        plugins: {},
        scales: {
            x: { type: 'category' },
            y: { type: 'linear' }
        },
        responsive: true,
        maintainAspectRatio: true
    };
    
    console.log('Chart.js备用实现加载完成');
})(); 