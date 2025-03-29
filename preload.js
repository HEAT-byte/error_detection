// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 登录和登出
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  
  // 传感器数据处理
  onSensorData: (callback) => {
    ipcRenderer.on('sensor-data', (event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('sensor-data');
    };
  },
  
  // WebSocket连接管理
  reconnectWebSocket: () => ipcRenderer.invoke('reconnect-ws'),
  onWebSocketConnectionFailed: (callback) => {
    ipcRenderer.on('ws-connection-failed', () => callback());
    return () => {
      ipcRenderer.removeAllListeners('ws-connection-failed');
    };
  },
  
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 应用版本信息
  getAppVersion: () => {
    try {
      return process.env.npm_package_version || '1.0.0';
    } catch (error) {
      console.error('获取应用版本失败:', error);
      return '1.0.0';
    }
  },
  
  // 日志记录
  log: (level, message) => {
    console[level](message);
    // 可以在这里添加将日志发送到主进程的逻辑
  }
});

// 添加错误处理
window.addEventListener('error', (event) => {
  console.error('渲染进程错误:', event.error);
  // 可以在这里添加将错误发送到主进程的逻辑
});

// 添加未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
  // 可以在这里添加将错误发送到主进程的逻辑
});

// 通知主进程预加载脚本已加载完成
try {
  ipcRenderer.send('preload-loaded');
} catch (error) {
  console.error('通知主进程预加载脚本已加载完成失败:', error);
} 