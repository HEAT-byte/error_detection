const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');

// 保持对window对象的全局引用
let mainWindow;

// 添加日志记录
function log(level, message) {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] [${level}] ${message}`);
}

function createWindow() {
  // 创建浏览器窗口
  log('info', '创建主窗口...');
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 注册自定义协议处理器，用于处理本地资源
  protocol.handle('app', (request) => {
    let filePath = request.url.replace('app://', '');
    filePath = path.join(__dirname, filePath);
    
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        let mimeType = 'text/plain';
        
        // 根据文件扩展名设置正确的MIME类型
        if (filePath.endsWith('.js')) {
          mimeType = 'application/javascript';
        } else if (filePath.endsWith('.html')) {
          mimeType = 'text/html';
        } else if (filePath.endsWith('.css')) {
          mimeType = 'text/css';
        } else if (filePath.endsWith('.json')) {
          mimeType = 'application/json';
        } else if (filePath.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        }
        
        return new Response(data, {
          headers: {
            'Content-Type': mimeType
          }
        });
      }
    } catch (error) {
      log('error', `加载资源失败: ${filePath}, 错误: ${error.message}`);
    }
    
    return new Response('', {
      status: 404
    });
  });

  // 加载应用的index.html
  const indexPath = path.join(__dirname, 'index.html');
  mainWindow.loadURL(`file://${indexPath}`);

  // 打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    log('info', '开发模式：已打开开发者工具');
    mainWindow.webContents.openDevTools();
  }

  // 当window被关闭时，触发下面的事件
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  
  // 窗口内容加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    log('info', '窗口内容加载完成，显示窗口');
    mainWindow.show();
  });
}

// 模拟传感器数据
function generateSensorData() {
  return {
    timestamp: new Date().toISOString(),
    sensors: [
      {
        id: 'S-001',
        location: '桥梁北侧入口',
        status: 'normal',
        data: {
          temperature: 23.5 + (Math.random() * 0.5 - 0.25),
          vibration: 1.2 + (Math.random() * 0.2 - 0.1),
          tilt: 0.3 + (Math.random() * 0.1 - 0.05)
        }
      },
      {
        id: 'S-002',
        location: '桥梁中部西侧',
        status: 'normal',
        data: {
          temperature: 24.1 + (Math.random() * 0.5 - 0.25),
          vibration: 0.8 + (Math.random() * 0.2 - 0.1),
          tilt: 0.2 + (Math.random() * 0.1 - 0.05)
        }
      },
      {
        id: 'S-103',
        location: '主桥中部支架',
        status: 'alert',
        data: {
          temperature: 25.3 + (Math.random() * 0.5 - 0.25),
          vibration: 8.7 + (Math.random() * 1.0 - 0.5),
          tilt: 0.9 + (Math.random() * 0.2 - 0.1)
        }
      },
      {
        id: 'S-004',
        location: '桥梁南侧出口',
        status: 'normal',
        data: {
          temperature: 23.8 + (Math.random() * 0.5 - 0.25),
          vibration: 1.1 + (Math.random() * 0.2 - 0.1),
          tilt: 0.4 + (Math.random() * 0.1 - 0.05)
        }
      },
      {
        id: 'S-087',
        location: '桥面东侧',
        status: 'warning',
        data: {
          temperature: 24.5 + (Math.random() * 0.5 - 0.25),
          vibration: 1.8 + (Math.random() * 0.3 - 0.15),
          tilt: 2.3 + (Math.random() * 0.3 - 0.15)
        }
      }
    ]
  };
}

// 初始化WebSocket服务器连接
let ws;
function initWebSocket() {
  try {
    ws = new WebSocket('ws://your-server-address:port');
    
    ws.on('open', function open() {
      log('info', '已连接到WebSocket服务器');
    });
    
    ws.on('message', function incoming(data) {
      // 将接收到的数据转发到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('sensor-data', JSON.parse(data));
      }
    });
    
    ws.on('close', function close() {
      log('info', '与WebSocket服务器断开连接');
      // 尝试重新连接
      setTimeout(initWebSocket, 3000);
    });
    
    ws.on('error', function error(err) {
      log('error', `WebSocket错误: ${err.message}`);
      
      // 通知渲染进程连接失败
      if (mainWindow) {
        mainWindow.webContents.send('ws-connection-failed');
      }
      
      // 使用模拟数据
      startSendingSimulatedData();
    });
  } catch (error) {
    log('error', `初始化WebSocket失败: ${error.message}`);
    startSendingSimulatedData();
  }
}

// 发送模拟数据
let simulatedDataInterval;
function startSendingSimulatedData() {
  log('info', '开发模式：WebSocket连接已禁用，使用模拟数据');
  
  // 清除现有的定时器
  if (simulatedDataInterval) {
    clearInterval(simulatedDataInterval);
  }
  
  // 每2秒发送一次模拟数据
  simulatedDataInterval = setInterval(() => {
    if (mainWindow) {
      const data = generateSensorData();
      mainWindow.webContents.send('sensor-data', data);
    }
  }, 2000);
}

// 应用启动时
app.whenReady().then(() => {
  log('info', `应用启动 (版本: ${app.getVersion() || '1.0.0'}, 环境: ${process.env.NODE_ENV || 'production'})`);
  
  // 注册自定义协议
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ]);
  
  createWindow();
  
  // 在开发模式下使用模拟数据，在生产模式下尝试连接WebSocket
  if (process.env.NODE_ENV === 'development') {
    startSendingSimulatedData();
  } else {
    initWebSocket();
  }
  
  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', function() {
  // 在macOS上，除非用户用Cmd + Q确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  // 清除模拟数据定时器
  if (simulatedDataInterval) {
    clearInterval(simulatedDataInterval);
  }
});

// 处理来自渲染进程的IPC消息
ipcMain.handle('login', async (event, credentials) => {
  log('info', `收到登录请求: ${credentials.username}`);
  
  // 在实际应用中，这里应该进行真正的身份验证
  // 这里简单地返回成功
  return { success: true, token: 'simulated-auth-token' };
});

ipcMain.handle('logout', async (event) => {
  log('info', '收到登出请求');
  
  // 在实际应用中，这里应该清除会话等
  return { success: true };
});

ipcMain.handle('reconnect-ws', async (event) => {
  log('info', '收到重新连接WebSocket请求');
  
  // 清除模拟数据定时器
  if (simulatedDataInterval) {
    clearInterval(simulatedDataInterval);
  }
  
  // 尝试重新连接
  initWebSocket();
  
  return { success: true };
});

ipcMain.handle('get-system-info', async (event) => {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    appVersion: app.getVersion() || '1.0.0'
  };
});

// 监听预加载脚本加载完成事件
ipcMain.on('preload-loaded', () => {
  log('info', '预加载脚本已加载完成');
});
