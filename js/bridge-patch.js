/**
 * 黑龙江大桥监测系统补丁脚本
 * 修复常见错误和兼容问题，适配Linux云服务器环境
 * 应在页面加载后运行
 * 
 * 版本: 2.0 - Linux云服务器兼容版
 */

// 在页面加载后运行补丁
document.addEventListener('DOMContentLoaded', function() {
    console.log('正在应用补丁脚本（云服务器兼容版）...');
    detectEnvironment();
    applyPatches();
});

// 环境检测
function detectEnvironment() {
    // 检测运行环境
    const isWindowsEnv = navigator.userAgent.indexOf('Windows') !== -1;
    const isLinuxEnv = navigator.userAgent.indexOf('Linux') !== -1;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 设置全局环境变量
    window.BRIDGE_ENV = {
        isWindowsEnv: isWindowsEnv,
        isLinuxEnv: isLinuxEnv,
        isMobileDevice: isMobileDevice,
        isCloudEnv: !isWindowsEnv,  // 非Windows环境视为云环境
        supportTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        supportsES6: typeof Symbol !== 'undefined',
        timestamp: new Date().toISOString()
    };
    
    console.log('环境检测完成:', window.BRIDGE_ENV);
}

// 应用所有补丁
function applyPatches() {
    try {
        // 修复路径兼容性问题
        patchPathHandling();
        
        // 修复历史记录相关函数
        patchHistoryFunctions();
        
        // 修复登录检查函数
        patchLoginFunctions();
        
        // 修复其他未定义的函数
        patchMissingFunctions();
        
        // 修复文件处理相关函数
        patchFileHandling();
        
        console.log('补丁脚本已成功应用');
    } catch (error) {
        console.error('应用补丁时出错:', error);
    }
}

// 修复路径处理相关问题
function patchPathHandling() {
    // 标准化文件路径 - 将Windows路径转换为Linux路径
    window.normalizeFilePath = function(path) {
        if (!path) return path;
        
        // 替换Windows路径分隔符为Linux路径分隔符
        path = path.replace(/\\/g, '/');
        
        // 处理可能的磁盘符 (C:/ 等)
        path = path.replace(/^[A-Za-z]:\//, '/');
        
        return path;
    };
    
    // 覆盖可能使用的文件URL生成函数
    if (typeof window.getFileUrl === 'function') {
        const originalGetFileUrl = window.getFileUrl;
        window.getFileUrl = function(path) {
            return originalGetFileUrl(window.normalizeFilePath(path));
        };
    }
    
    console.log('路径处理兼容性补丁已应用');
}

// 修复历史记录相关函数
function patchHistoryFunctions() {
    if (typeof window.addToHistory !== 'function') {
        console.log('修复未定义的addToHistory函数...');
        window.addToHistory = function(sensorGroups, totalAnomalies, sensorAnomalyCount) {
            console.log(`已添加到历史记录：${totalAnomalies}个异常，${sensorAnomalyCount}个传感器`);
            
            try {
                // 使用localStorage存储简化版历史记录
                const historyItem = {
                    timestamp: new Date().toISOString(),
                    anomalyCount: totalAnomalies,
                    sensorCount: sensorAnomalyCount,
                    environment: window.BRIDGE_ENV ? window.BRIDGE_ENV.isCloudEnv ? '云服务器' : '本地环境' : '未知'
                };
                
                // 获取现有历史记录
                let history = [];
                try {
                    const storedHistory = localStorage.getItem('detection_history');
                    if (storedHistory) {
                        history = JSON.parse(storedHistory);
                    }
                } catch (e) {
                    console.error('解析历史记录出错:', e);
                    history = [];
                }
                
                // 添加新记录并限制最多保存10条
                history.unshift(historyItem);
                if (history.length > 10) {
                    history = history.slice(0, 10);
                }
                
                // 保存回localStorage
                localStorage.setItem('detection_history', JSON.stringify(history));
            } catch (error) {
                console.error('保存历史记录时出错:', error);
            }
        };
    }
}

// 修复登录检查函数
function patchLoginFunctions() {
    // 确保登录检查函数统一
    if (typeof window.checkLoginStatus === 'function' && typeof window.checkLogin === 'function') {
        console.log('修复登录函数冲突...');
        
        // 保存原始checkLoginStatus函数
        const originalCheckLoginStatus = window.checkLoginStatus;
        
        // 重写checkLoginStatus函数，使其调用checkLogin
        window.checkLoginStatus = function() {
            console.log('统一的登录检查...');
            if (typeof window.checkLogin === 'function') {
                return window.checkLogin();
            } else {
                return originalCheckLoginStatus();
            }
        };
    }
}

// 修复文件处理相关函数
function patchFileHandling() {
    // 添加或修改文件上传处理函数
    if (typeof window.handleFileUpload !== 'function') {
        console.log('添加文件上传处理函数...');
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
                const uploadButton = document.getElementById('uploadButton') || document.getElementById('uploadBtn');
                if (uploadButton) {
                    uploadButton.disabled = false;
                }
                
                // 确保在云环境中检测文件编码 - 支持中文
                const isTextFile = /\.(txt|csv|json|log)$/i.test(file.name);
                if (isTextFile && window.BRIDGE_ENV && window.BRIDGE_ENV.isCloudEnv) {
                    console.log('云环境中处理文本文件，检测编码...');
                }
            } catch (error) {
                console.error('处理文件上传时出错:', error);
            }
        };
    }
    
    // 添加格式化文件大小的辅助函数
    if (typeof window.formatFileSize !== 'function') {
        window.formatFileSize = function(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
    }
    
    console.log('文件处理兼容性补丁已应用');
}

// 修复其他未定义的函数
function patchMissingFunctions() {
    // 修复bindEvents函数
    if (typeof window.bindEvents !== 'function') {
        console.log('修复未定义的bindEvents函数...');
        window.bindEvents = function() {
            console.log('绑定事件处理函数(云服务器兼容版)...');
            
            try {
                // 绑定上传按钮事件
                const uploadBtn = document.getElementById('uploadBtn');
                if (uploadBtn) {
                    uploadBtn.addEventListener('click', function() {
                        document.getElementById('fileInput').click();
                    });
                }
                
                // 绑定文件输入事件
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.addEventListener('change', function(e) {
                        if (typeof window.handleFileUpload === 'function') {
                            window.handleFileUpload(e);
                        } else {
                            console.error('未找到handleFileUpload函数');
                        }
                    });
                }
                
                // 绑定检测按钮事件
                const detectBtn = document.getElementById('detectBtn');
                if (detectBtn) {
                    detectBtn.addEventListener('click', function() {
                        if (typeof window.startDetection === 'function') {
                            window.startDetection();
                        } else if (typeof window.startAnomalyDetection === 'function') {
                            window.startAnomalyDetection();
                        } else {
                            console.error('未找到异常检测启动函数');
                        }
                    });
                }
                
                console.log('事件绑定完成(云服务器兼容版)');
            } catch (error) {
                console.error('绑定事件处理函数时出错:', error);
            }
        };
    }
    
    // 确保updateRepairControls函数存在
    if (typeof window.updateRepairControls !== 'function') {
        console.log('修复未定义的updateRepairControls函数...');
        window.updateRepairControls = function(sensorGroups) {
            console.log('更新修复控制(云服务器兼容版)...');
            
            try {
                // 获取修复控制区域
                const repairControls = document.getElementById('repair-controls');
                if (!repairControls) {
                    console.error('未找到修复控制区域');
                    return;
                }
                
                // 确保在Linux环境下正确显示异常传感器列表
                const sensorSelector = document.getElementById('sensor-selector');
                if (sensorSelector && sensorGroups) {
                    // 清空现有选项
                    sensorSelector.innerHTML = '';
                    
                    // 添加默认选项
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '请选择异常传感器';
                    sensorSelector.appendChild(defaultOption);
                    
                    // 统计有异常的传感器
                    let hasAnomalies = false;
                    
                    // 添加传感器选项
                    for (const sensorId in sensorGroups) {
                        if (sensorGroups[sensorId].anomalies && sensorGroups[sensorId].anomalies.length > 0) {
                            hasAnomalies = true;
                            const option = document.createElement('option');
                            option.value = sensorId;
                            option.textContent = `${sensorId} (${sensorGroups[sensorId].anomalies.length}个异常)`;
                            sensorSelector.appendChild(option);
                        }
                    }
                    
                    // 显示提示信息
                    const repairMessage = document.getElementById('repair-message');
                    if (repairMessage) {
                        repairMessage.textContent = hasAnomalies 
                            ? '请选择需要修复的传感器和修复模型' 
                            : '没有检测到异常传感器数据';
                    }
                }
            } catch (error) {
                console.error('更新修复控制时出错:', error);
            }
        };
    }
} 