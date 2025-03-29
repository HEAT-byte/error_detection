const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');

// 保持对window对象的全局引用
let mainWindow;
// WebSocket连接
let ws;
// 重连计数器
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
// 缓存的传感器数据
let cachedSensorData = null;

// 应用配置
const appConfig = {
  // 窗口默认尺寸
  defaultWidth: 1280,
  defaultHeight: 800,
  // WebSocket服务器地址
  wsServerUrl: process.env.WS_SERVER_URL || 'ws://localhost:8080',
  // 日志路径
  logPath: path.join(app.getPath('userData'), 'logs'),
  // 是否启用硬件加速
  hardwareAcceleration: true
};

// 确保日志目录存在
try {
  if (!fs.existsSync(appConfig.logPath)) {
    fs.mkdirSync(appConfig.logPath, { recursive: true });
  }
} catch (err) {
  console.error('创建日志目录失败:', err);
}

// 日志函数
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console[level](logMessage);
  
  // 将日志写入文件
  try {
    const logFile = path.join(appConfig.logPath, `app-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (err) {
    console.error('写入日志文件失败:', err);
  }
}

// 创建浏览器窗口
function createWindow() {
  // 禁用硬件加速（如果需要）
  if (!appConfig.hardwareAcceleration) {
    app.disableHardwareAcceleration();
  }
  
  log('info', '创建主窗口...');
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: appConfig.defaultWidth,
    height: appConfig.defaultHeight,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 启用页面缓存
      enableBlinkFeatures: 'CSSOMSmoothScroll',
      // 禁用同源策略（仅在开发环境）
      webSecurity: process.env.NODE_ENV !== 'development'
    },
    // 窗口图标
    icon: path.join(__dirname, 'icon.png'),
    // 启用窗口背景透明度
    backgroundColor: '#ffffff',
    // 显示窗口前先隐藏，等待内容加载完成
    show: false
  });

  // 加载应用的index.html
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  
  // 内容加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    log('info', '窗口内容加载完成，显示窗口');
    mainWindow.show();
    
    // 如果有缓存的传感器数据，立即发送
    if (cachedSensorData) {
      mainWindow.webContents.send('sensor-data', cachedSensorData);
    }
  });

  // 打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
    log('info', '开发模式：已打开开发者工具');
  }

  // 当window被关闭时，触发下面的事件
  mainWindow.on('closed', function() {
    log('info', '主窗口已关闭');
    mainWindow = null;
  });
  
  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 在默认浏览器中打开外部链接
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  // 监听渲染进程崩溃事件
  mainWindow.webContents.on('crashed', () => {
    log('error', '渲染进程崩溃，尝试重启应用');
    dialog.showMessageBox({
      type: 'error',
      title: '应用崩溃',
      message: '应用发生崩溃，需要重新启动。',
      buttons: ['重新启动', '关闭']
    }).then(result => {
      if (result.response === 0) {
        app.relaunch();
        app.exit(0);
      } else {
        app.quit();
      }
    });
  });
  
  // 监听未处理的异常
  mainWindow.webContents.on('unresponsive', () => {
    log('error', '应用无响应，尝试恢复');
    dialog.showMessageBox({
      type: 'warning',
      title: '应用无响应',
      message: '应用暂时无响应，是否等待恢复？',
      buttons: ['等待恢复', '重新启动', '关闭']
    }).then(result => {
      if (result.response === 1) {
        app.relaunch();
        app.exit(0);
      } else if (result.response === 2) {
        app.quit();
      }
    });
  });
  
  // 监听渲染进程恢复响应
  mainWindow.webContents.on('responsive', () => {
    log('info', '应用已恢复响应');
  });
}

// 初始化WebSocket服务器连接
function initWebSocket() {
  const serverUrl = appConfig.wsServerUrl;
  log('info', `尝试连接到WebSocket服务器: ${serverUrl} (尝试 ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
  
  // 关闭现有连接
  if (ws) {
    try {
      ws.terminate();
    } catch (err) {
      log('error', `关闭现有WebSocket连接失败: ${err.message}`);
    }
  }
  
  // 创建新连接
  ws = new WebSocket(serverUrl);
  
  // 设置超时
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      log('error', 'WebSocket连接超时');
      ws.terminate();
      handleReconnect();
    }
  }, 10000); // 10秒超时
  
  ws.on('open', function open() {
    log('info', '已连接到WebSocket服务器');
    clearTimeout(connectionTimeout);
    reconnectAttempts = 0; // 重置重连计数
    
    // 发送初始化消息
    try {
      ws.send(JSON.stringify({
        type: 'init',
        clientInfo: {
          appVersion: app.getVersion(),
          platform: process.platform,
          arch: process.arch,
          osVersion: os.release(),
          hostname: os.hostname()
        }
      }));
    } catch (err) {
      log('error', `发送初始化消息失败: ${err.message}`);
    }
  });
  
  ws.on('message', function incoming(data) {
    // 将接收到的数据转发到渲染进程
    if (mainWindow && mainWindow.webContents) {
      try {
        const parsedData = JSON.parse(data);
        // 缓存最新的传感器数据
        cachedSensorData = parsedData;
        mainWindow.webContents.send('sensor-data', parsedData);
      } catch (e) {
        log('error', `解析WebSocket数据失败: ${e.message}`);
      }
    } else {
      // 如果窗口不存在，只缓存数据
      try {
        cachedSensorData = JSON.parse(data);
      } catch (e) {
        log('error', `缓存WebSocket数据失败: ${e.message}`);
      }
    }
  });
  
  ws.on('close', function close() {
    log('warn', '与WebSocket服务器断开连接');
    clearTimeout(connectionTimeout);
    handleReconnect();
  });
  
  ws.on('error', function error(err) {
    log('error', `WebSocket错误: ${err.message}`);
    clearTimeout(connectionTimeout);
    
    // 在开发环境中，如果无法连接到WebSocket服务器，使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      log('info', '开发模式：使用模拟数据');
      generateMockData();
    }
  });
}

// 处理WebSocket重连
function handleReconnect() {
  reconnectAttempts++;
  
  if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000); // 指数退避，最大30秒
    log('info', `将在 ${delay}ms 后尝试重新连接 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    setTimeout(initWebSocket, delay);
  } else {
    log('error', `达到最大重连次数 (${MAX_RECONNECT_ATTEMPTS})，停止重连`);
    
    // 通知渲染进程连接失败
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('ws-connection-failed');
    }
    
    // 在开发环境中使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      log('info', '开发模式：使用模拟数据');
      generateMockData();
    }
  }
}

// 生成模拟数据（开发环境使用）
function generateMockData() {
  if (!mainWindow || !mainWindow.webContents) return;
  
  // 创建模拟传感器数据
  const mockData = {
    timestamp: Date.now(),
    sensors: []
  };
  
  // 生成10个模拟传感器
  for (let i = 1; i <= 10; i++) {
    mockData.sensors.push({
      id: `sensor-${i}`,
      type: ['temperature', 'vibration', 'tilt'][i % 3],
      location: `桥梁${Math.floor(i / 3) + 1}-${['左侧', '中间', '右侧'][i % 3]}`,
      status: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'alert' : 'warning') : 'normal',
      data: {
        temperature: 20 + Math.random() * 10,
        vibration: Math.random() * 5,
        tilt: Math.random() * 2
      }
    });
  }
  
  // 缓存并发送模拟数据
  cachedSensorData = mockData;
  mainWindow.webContents.send('sensor-data', mockData);
  
  // 每5秒更新一次模拟数据
  setTimeout(generateMockData, 5000);
}

// 应用初始化
app.whenReady().then(() => {
  log('info', `应用启动 (版本: ${app.getVersion()}, 环境: ${process.env.NODE_ENV || 'production'})`);
  
  createWindow();
  
  // 仅在生产环境中初始化WebSocket连接
  if (process.env.NODE_ENV !== 'development') {
    initWebSocket();
  } else {
    log('info', '开发模式：WebSocket连接已禁用，使用模拟数据');
    generateMockData();
  }
  
  // 设置应用菜单
  setupAppMenu();
});

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    log('info', '所有窗口已关闭，应用退出');
    app.quit();
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    log('info', '激活应用，创建窗口');
    createWindow();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  log('info', '应用准备退出，执行清理操作');
  
  // 关闭WebSocket连接
  if (ws) {
    try {
      ws.close();
    } catch (err) {
      log('error', `关闭WebSocket连接失败: ${err.message}`);
    }
  }
});

// 处理来自渲染进程的IPC消息
ipcMain.handle('login', async (event, credentials) => {
  log('info', `收到登录请求: ${credentials.username}`);
  // 这里可以添加实际的登录验证逻辑
  // 模拟登录成功
  return { success: true, token: 'mock-auth-token' };
});

ipcMain.handle('logout', async (event) => {
  log('info', '收到登出请求');
  // 处理登出逻辑
  return { success: true };
});

// 处理渲染进程请求重新连接WebSocket
ipcMain.handle('reconnect-ws', async (event) => {
  log('info', '收到重新连接WebSocket请求');
  reconnectAttempts = 0; // 重置重连计数
  initWebSocket();
  return { success: true };
});

// 处理渲染进程请求系统信息
ipcMain.handle('get-system-info', async (event) => {
  log('info', '收到获取系统信息请求');
  return {
    platform: process.platform,
    arch: process.arch,
    osVersion: os.release(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus(),
    hostname: os.hostname(),
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron
  };
});

// 设置应用菜单
function setupAppMenu() {
  // 在这里可以设置自定义应用菜单
  // 为简化代码，此处省略
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  log('error', `未捕获的异常: ${error.message}`);
  log('error', error.stack);
  
  dialog.showMessageBox({
    type: 'error',
    title: '应用错误',
    message: '应用发生错误，需要重新启动。',
    detail: error.message,
    buttons: ['重新启动', '关闭']
  }).then(result => {
    if (result.response === 0) {
      app.relaunch();
      app.exit(1);
    } else {
      app.exit(1);
    }
  });
}); 