// 工具函数库
// 提供各种辅助工具方法

// 格式化日期时间
function formatDateTime(date) {
    if (!date) return '';
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 格式化日期
function formatDate(date) {
    if (!date) return '';
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 生成随机ID
function generateId(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9);
}

// 防抖函数
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 节流函数
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 随机数生成
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
    const val = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
}

// 生成随机时间序列数据
function generateTimeSeriesData(points, baseValue, variance, startDate = new Date()) {
    const data = [];
    const msPerPoint = 3600000; // 1小时
    
    for (let i = 0; i < points; i++) {
        const timestamp = new Date(startDate.getTime() - (points - i - 1) * msPerPoint);
        const value = baseValue + (Math.random() - 0.5) * variance;
        data.push({
            timestamp,
            value: parseFloat(value.toFixed(2))
        });
    }
    
    return data;
}

// 颜色工具
const colorUtils = {
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    getStatusColor(status) {
        const colors = {
            'normal': '#4caf50',   // 绿色
            'warning': '#ff9800',  // 橙色
            'alert': '#f44336',    // 红色
            'maintenance': '#2196f3', // 蓝色
            'offline': '#9e9e9e'   // 灰色
        };
        
        return colors[status] || colors.normal;
    }
};

// 通知系统
const notifications = {
    container: null,
    
    init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        // 添加关闭按钮事件
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.container.removeChild(notification);
        });
        
        // 添加到容器
        this.container.appendChild(notification);
        
        // 自动关闭
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, duration);
        
        return notification;
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    },
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
};

// 模态框系统
const modal = {
    container: null,
    modalElement: null,
    titleElement: null,
    contentElement: null,
    closeButton: null,
    cancelButton: null,
    confirmButton: null,
    callbacks: {},
    
    init() {
        this.container = document.getElementById('modal-container');
        if (!this.container) {
            console.error('模态框容器不存在');
            return;
        }
        
        this.modalElement = this.container.querySelector('.modal');
        this.titleElement = document.getElementById('modal-title');
        this.contentElement = document.getElementById('modal-content');
        this.closeButton = document.getElementById('modal-close');
        this.cancelButton = document.getElementById('modal-cancel');
        this.confirmButton = document.getElementById('modal-confirm');
        
        // 设置关闭事件
        this.closeButton.addEventListener('click', () => this.close());
        this.cancelButton.addEventListener('click', () => this.close(false));
        this.confirmButton.addEventListener('click', () => this.close(true));
        
        // 点击背景关闭
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close(false);
            }
        });
    },
    
    show(options = {}) {
        if (!this.container) this.init();
        
        // 设置标题
        this.titleElement.textContent = options.title || '提示';
        
        // 设置内容
        if (options.content) {
            if (typeof options.content === 'string') {
                this.contentElement.innerHTML = options.content;
            } else {
                this.contentElement.innerHTML = '';
                this.contentElement.appendChild(options.content);
            }
        }
        
        // 设置按钮文本
        this.cancelButton.textContent = options.cancelText || '取消';
        this.confirmButton.textContent = options.confirmText || '确认';
        
        // 保存回调
        this.callbacks.onConfirm = options.onConfirm;
        this.callbacks.onCancel = options.onCancel;
        this.callbacks.onClose = options.onClose;
        
        // 显示模态框
        this.container.style.display = 'flex';
        setTimeout(() => {
            this.modalElement.style.transform = 'translateY(0)';
            this.modalElement.style.opacity = '1';
        }, 10);
        
        return this;
    },
    
    close(confirmed = false) {
        this.modalElement.style.transform = 'translateY(-20px)';
        this.modalElement.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
            
            // 执行回调
            if (confirmed && typeof this.callbacks.onConfirm === 'function') {
                this.callbacks.onConfirm();
            } else if (!confirmed && typeof this.callbacks.onCancel === 'function') {
                this.callbacks.onCancel();
            }
            
            if (typeof this.callbacks.onClose === 'function') {
                this.callbacks.onClose(confirmed);
            }
        }, 300);
    },
    
    alert(message, title = '警告') {
        return this.show({
            title: title,
            content: message,
            cancelText: '关闭',
            confirmText: '确定'
        });
    },
    
    confirm(message, onConfirm, onCancel, title = '确认') {
        return this.show({
            title: title,
            content: message,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }
};

// 导出工具对象
window.utils = {
    formatDateTime,
    formatDate,
    generateId,
    debounce,
    throttle,
    randomInt,
    randomFloat,
    generateTimeSeriesData,
    colorUtils,
    notifications,
    modal
}; 