/**
 * 黑龙江大桥监测系统 - 主应用逻辑
 * 负责初始化应用程序和管理主要逻辑
 */

// 应用程序主对象
const BridgeMonitorApp = {
  // 当前应用状态
  state: {
    isLoggedIn: false,
    currentUser: null,
    activeTab: 'dashboard',
    theme: 'light',
    sensors: {}
  },

  // 初始化应用
  init: function() {
    console.log('初始化应用程序...');
    
    // 设置登录页面事件监听
    this.setupLoginEvents();
    
    // 尝试恢复会话
    this.tryRestoreSession();
    
    // 设置主界面事件监听
    this.setupMainEvents();
    
    // 设置全局事件
    this.setupGlobalEvents();
    
    console.log('应用程序初始化完成');
  },
  
  // 设置登录事件
  setupLoginEvents: function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 简单验证
        if (!username || !password) {
          this.showError('请输入用户名和密码');
          return;
        }
        
        // 显示加载状态
        document.getElementById('login-btn').disabled = true;
        document.getElementById('login-btn').textContent = '登录中...';
        
        // 模拟登录请求
        setTimeout(() => {
          // 模拟登录成功
          this.state.isLoggedIn = true;
          this.state.currentUser = {
            username: username,
            role: 'admin',
            lastLogin: new Date().toLocaleString('zh-CN')
          };
          
          // 保存会话
          localStorage.setItem('user', JSON.stringify(this.state.currentUser));
          
          // 显示主界面
          this.showMainInterface();
        }, 1000);
      });
    }
  },
  
  // 尝试恢复会话
  tryRestoreSession: function() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.state.currentUser = JSON.parse(savedUser);
        this.state.isLoggedIn = true;
        this.showMainInterface();
      } catch(e) {
        console.error('恢复会话出错:', e);
        localStorage.removeItem('user');
      }
    }
  },
  
  // 设置主界面事件
  setupMainEvents: function() {
    // 标签切换
    const tabLinks = document.querySelectorAll('.nav-item');
    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
    
    // 退出登录
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
    
    // 快速操作按钮
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
      action.addEventListener('click', (e) => {
        const actionType = action.getAttribute('data-action');
        this.handleQuickAction(actionType);
      });
    });
  },
  
  // 设置全局事件
  setupGlobalEvents: function() {
    // 主题切换
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // 页面加载完成后初始化各个模块
    window.addEventListener('load', () => {
      // 初始化桥梁矢量图模块
      if (typeof BridgeVectorController !== 'undefined') {
        BridgeVectorController.init('bridge-model-container', 'sensor-detail-panel');
      }
      
      // 初始化数据库模块
      if (typeof initDatabaseModule !== 'undefined') {
        initDatabaseModule();
      }
      
      // 初始化异常检测模块
      if (typeof initAnomalyDetection !== 'undefined') {
        initAnomalyDetection();
      }
      
      // 初始化统计分析模块
      if (typeof initStatisticsModule !== 'undefined') {
        initStatisticsModule();
      }
    });
  },
  
  // 显示主界面
  showMainInterface: function() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    
    // 更新用户信息显示
    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl && this.state.currentUser) {
      userInfoEl.textContent = this.state.currentUser.username;
    }
    
    // 加载初始标签内容
    this.switchTab(this.state.activeTab);
  },
  
  // 切换标签
  switchTab: function(tabId) {
    // 更新活动标签
    this.state.activeTab = tabId;
    
    // 移除所有标签的active类
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // 激活选择的标签
    const selectedTab = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // 显示选择的标签内容
    const selectedContent = document.getElementById(`${tabId}-content`);
    if (selectedContent) {
      selectedContent.style.display = 'block';
    }
    
    // 特殊标签处理
    if (tabId === 'bridge-model') {
      // 刷新矢量图
      if (typeof BridgeVectorController !== 'undefined') {
        BridgeVectorController.refresh();
      }
    } else if (tabId === 'database') {
      // 刷新数据库统计
      if (typeof displayDatabaseStats !== 'undefined') {
        displayDatabaseStats();
      }
    }
  },
  
  // 退出登录
  logout: function() {
    this.state.isLoggedIn = false;
    this.state.currentUser = null;
    localStorage.removeItem('user');
    
    // 显示登录界面
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
    
    // 重置表单
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.reset();
    }
    
    // 重置登录按钮
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = '登录';
    }
  },
  
  // 处理快速操作
  handleQuickAction: function(actionType) {
    switch(actionType) {
      case 'show-all-sensors':
        this.switchTab('sensors');
        break;
      case 'export-data':
        this.switchTab('database');
        document.getElementById('database-tab-export').click();
        break;
      case 'anomaly-detection':
        this.switchTab('analysis');
        document.getElementById('analysis-tab-anomaly').click();
        break;
      case 'system-status':
        this.switchTab('dashboard');
        break;
    }
  },
  
  // 切换主题
  toggleTheme: function() {
    const body = document.body;
    if (this.state.theme === 'light') {
      body.classList.add('dark-theme');
      this.state.theme = 'dark';
        } else {
      body.classList.remove('dark-theme');
      this.state.theme = 'light';
    }
    
    // 保存主题设置
    localStorage.setItem('theme', this.state.theme);
  },
  
  // 显示错误消息
  showError: function(message) {
    const errorBox = document.getElementById('login-error');
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = 'block';
      
      // 5秒后隐藏错误
      setTimeout(() => {
        errorBox.style.display = 'none';
      }, 5000);
    }
  }
};

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  BridgeMonitorApp.init();
}); 