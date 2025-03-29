/**
 * 黑龙江大桥监测系统 - 预警与决策支持系统
 * 提供多级预警机制、风险评估和决策建议
 */

// 预警与决策支持系统
const AlertSystem = {
  // 配置选项
  config: {
    // 预警等级
    alertLevels: {
      normal: { name: '正常', color: '#28a745', threshold: 0 },
      low: { name: '低级预警', color: '#ffc107', threshold: 20 },
      medium: { name: '中级预警', color: '#fd7e14', threshold: 40 },
      high: { name: '高级预警', color: '#dc3545', threshold: 60 },
      critical: { name: '紧急预警', color: '#6f42c1', threshold: 80 }
    },
    
    // 预警检查间隔（毫秒）
    checkInterval: 60000, // 1分钟
    
    // 最大预警记录数量
    maxAlertHistory: 100
  },
  
  // 当前预警状态
  state: {
    currentAlertLevel: 'normal',
    alertHistory: [],
    activeAlerts: {},
    isCheckingScheduled: false,
    lastCheckTime: null
  },
  
  // 初始化预警系统
  init: function() {
    console.log('初始化预警与决策支持系统...');
    
    try {
      // 加载预警历史记录
      this.loadAlertHistory();
      
      // 初始化预警配置
      this.setupAlertConfig();
      
      // 设置决策建议事件
      this.setupAdvisoryEvents();
      
      // 启动预警检查定时器
      this.startAlertChecking();
      
      console.log('预警与决策支持系统初始化完成');
    } catch (error) {
      console.error('预警与决策支持系统初始化失败:', error);
    }
  },
  
  // 加载预警历史记录
  loadAlertHistory: function() {
    // 模拟加载历史数据
    // 实际应用中可能从localStorage或后端API获取
    this.state.alertHistory = [
      {
        id: 'alert-001',
        timestamp: '2024-03-15 08:23:45',
        level: 'medium',
        sensorId: 'US1C2',
        sensorName: '上游一号塔二号索',
        message: '检测到持续的数据漂移异常，可能表明拉索张力异常',
        value: 247,
        threshold: 220,
        isActive: false,
        resolvedAt: '2024-03-15 14:45:22',
        resolvedBy: '工程师A'
      },
      {
        id: 'alert-002',
        timestamp: '2024-03-16 12:15:32',
        level: 'high',
        sensorId: 'US1C8',
        sensorName: '上游一号塔八号索',
        message: '多点异常值超出正常范围，建议立即检查传感器',
        value: 312,
        threshold: 250,
        isActive: true,
        resolvedAt: null,
        resolvedBy: null
      },
      {
        id: 'alert-003',
        timestamp: '2024-03-17 06:47:19',
        level: 'critical',
        sensorId: 'DS2C5',
        sensorName: '下游二号塔五号索',
        message: '数据增益异常严重，可能存在设备故障或结构性问题',
        value: 378,
        threshold: 260,
        isActive: true,
        resolvedAt: null,
        resolvedBy: null
      }
    ];
    
    // 更新活动预警
    this.updateActiveAlerts();
  },
  
  // 更新活动预警
  updateActiveAlerts: function() {
    this.state.activeAlerts = {};
    
    this.state.alertHistory.forEach(alert => {
      if (alert.isActive) {
        if (!this.state.activeAlerts[alert.sensorId]) {
          this.state.activeAlerts[alert.sensorId] = [];
        }
        this.state.activeAlerts[alert.sensorId].push(alert);
      }
    });
    
    // 更新预警计数
    this.updateAlertCounts();
  },
  
  // 更新预警计数
  updateAlertCounts: function() {
    // 获取活动预警的数量
    const activeAlerts = this.state.alertHistory.filter(alert => alert.isActive);
    
    // 按级别计数
    const counts = {
      total: activeAlerts.length,
      low: activeAlerts.filter(alert => alert.level === 'low').length,
      medium: activeAlerts.filter(alert => alert.level === 'medium').length,
      high: activeAlerts.filter(alert => alert.level === 'high').length,
      critical: activeAlerts.filter(alert => alert.level === 'critical').length
    };
    
    // 更新显示
    document.getElementById('alert-count-total').textContent = counts.total;
    document.getElementById('alert-count-low').textContent = counts.low;
    document.getElementById('alert-count-medium').textContent = counts.medium;
    document.getElementById('alert-count-high').textContent = counts.high;
    document.getElementById('alert-count-critical').textContent = counts.critical;
    
    // 更新当前系统预警等级
    this.updateSystemAlertLevel();
  },
  
  // 更新系统预警等级
  updateSystemAlertLevel: function() {
    // 确定最高级别的活动预警
    const activeAlerts = this.state.alertHistory.filter(alert => alert.isActive);
    
    if (activeAlerts.length === 0) {
      this.state.currentAlertLevel = 'normal';
    } else {
      // 按严重程度排序
      const levelOrder = ['low', 'medium', 'high', 'critical'];
      const maxLevel = activeAlerts.reduce((max, alert) => {
        const currentIndex = levelOrder.indexOf(alert.level);
        const maxIndex = levelOrder.indexOf(max);
        return currentIndex > maxIndex ? alert.level : max;
      }, 'low');
      
      this.state.currentAlertLevel = maxLevel;
    }
    
    // 更新系统状态显示
    this.updateSystemStatusDisplay();
  },
  
  // 更新系统状态显示
  updateSystemStatusDisplay: function() {
    const statusIndicator = document.getElementById('system-status-indicator');
    const statusText = document.getElementById('system-status-text');
    
    if (!statusIndicator || !statusText) return;
    
    // 获取当前等级
    const level = this.config.alertLevels[this.state.currentAlertLevel];
    
    // 更新显示
    statusIndicator.style.backgroundColor = level.color;
    statusText.textContent = level.name;
    statusText.style.color = level.color;
  },
  
  // 设置预警配置
  setupAlertConfig: function() {
    // 获取预警阈值表单
    const thresholdForm = document.getElementById('alert-thresholds-form');
    if (!thresholdForm) return;
    
    // 设置提交事件
    thresholdForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // 获取新的阈值设置
      const strainWarning = parseFloat(document.getElementById('strain-warning').value);
      const strainAlert = parseFloat(document.getElementById('strain-alert').value);
      const vibrationWarning = parseFloat(document.getElementById('vibration-warning').value);
      const vibrationAlert = parseFloat(document.getElementById('vibration-alert').value);
      const tiltWarning = parseFloat(document.getElementById('tilt-warning').value);
      const tiltAlert = parseFloat(document.getElementById('tilt-alert').value);
      
      // 更新预警阈值配置
      // 实际应用中这里可能需要保存到后端或localStorage
      
      // 显示保存成功消息
      alert('预警阈值配置已更新');
    });
    
    // 加载预警历史到表格
    this.loadAlertHistoryTable();
  },
  
  // 加载预警历史到表格
  loadAlertHistoryTable: function() {
    const alertHistoryBody = document.getElementById('alert-history-body');
    if (!alertHistoryBody) return;
    
    // 清空现有内容
    alertHistoryBody.innerHTML = '';
    
    // 按时间倒序排序
    const sortedHistory = [...this.state.alertHistory].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // 添加到表格
    sortedHistory.forEach(alert => {
      const row = document.createElement('tr');
      
      // 设置行样式
      if (alert.level === 'high' || alert.level === 'critical') {
        row.classList.add('high-alert-row');
      }
      
      // 状态标签
      const statusLabel = alert.isActive ? 
        `<span class="status-badge status-active">活动</span>` :
        `<span class="status-badge status-resolved">已解决</span>`;
      
      // 设置单元格内容
      row.innerHTML = `
        <td>${alert.timestamp}</td>
        <td>
          <span class="alert-level-badge alert-level-${alert.level}">
            ${this.config.alertLevels[alert.level].name}
          </span>
        </td>
        <td>${alert.sensorName}</td>
        <td>${alert.message}</td>
        <td>${statusLabel}</td>
        <td>
          <button class="details-btn" data-alert-id="${alert.id}">详情</button>
          ${alert.isActive ? `<button class="resolve-btn" data-alert-id="${alert.id}">解决</button>` : ''}
        </td>
      `;
      
      alertHistoryBody.appendChild(row);
    });
    
    // 添加按钮事件
    document.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alertId = e.target.getAttribute('data-alert-id');
        this.showAlertDetails(alertId);
      });
    });
    
    document.querySelectorAll('.resolve-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alertId = e.target.getAttribute('data-alert-id');
        this.resolveAlert(alertId);
      });
    });
  },
  
  // 显示预警详情
  showAlertDetails: function(alertId) {
    const alert = this.state.alertHistory.find(a => a.id === alertId);
    if (!alert) return;
    
    const detailsModal = document.getElementById('alert-details-modal');
    if (!detailsModal) return;
    
    // 填充详情内容
    document.getElementById('alert-details-id').textContent = alert.id;
    document.getElementById('alert-details-time').textContent = alert.timestamp;
    document.getElementById('alert-details-level').textContent = this.config.alertLevels[alert.level].name;
    document.getElementById('alert-details-level').style.color = this.config.alertLevels[alert.level].color;
    document.getElementById('alert-details-sensor').textContent = alert.sensorName;
    document.getElementById('alert-details-message').textContent = alert.message;
    document.getElementById('alert-details-value').textContent = alert.value;
    document.getElementById('alert-details-threshold').textContent = alert.threshold;
    
    // 解决状态
    const resolvedStatus = document.getElementById('alert-details-resolved');
    if (alert.isActive) {
      resolvedStatus.textContent = '未解决';
      resolvedStatus.style.color = '#dc3545';
    } else {
      resolvedStatus.textContent = `已解决 (${alert.resolvedAt} 由 ${alert.resolvedBy})`;
      resolvedStatus.style.color = '#28a745';
    }
    
    // 添加决策建议
    document.getElementById('alert-details-advisory').textContent = this.generateAdvisory(alert);
    
    // 显示模态框
    detailsModal.style.display = 'block';
    
    // 关闭按钮事件
    const closeBtn = detailsModal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        detailsModal.style.display = 'none';
      });
    }
  },
  
  // 解决预警
  resolveAlert: function(alertId) {
    // 确认是否解决
    if (!confirm('确认将此预警标记为已解决？')) return;
    
    // 查找并更新预警
    const alert = this.state.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.isActive = false;
      alert.resolvedAt = new Date().toLocaleString('zh-CN');
      alert.resolvedBy = '当前用户'; // 实际应用中应使用真实的用户信息
      
      // 更新活动预警
      this.updateActiveAlerts();
      
      // 重新加载表格
      this.loadAlertHistoryTable();
      
      // 显示成功消息
      this.showNotification('预警已成功解决', 'success');
    }
  },
  
  // 生成决策建议
  generateAdvisory: function(alert) {
    // 根据预警类型和级别生成建议
    // 实际应用中可能有更复杂的逻辑
    
    const advisories = {
      low: {
        defaultMsg: '建议监控情况，无需立即采取行动。增加监测频率，观察是否有变化趋势。'
      },
      medium: {
        defaultMsg: '建议安排工程师进行现场检查，评估可能的风险。考虑增加额外的临时监测设备。'
      },
      high: {
        defaultMsg: '需要立即安排专业团队进行现场评估。考虑限制桥梁上的交通流量，增加24小时监控。'
      },
      critical: {
        defaultMsg: '紧急情况！需要立即关闭桥梁交通，组织专家团队进行全面检查和评估。启动应急预案。'
      }
    };
    
    // 根据传感器类型和异常情况生成更具体的建议
    let specificAdvice = '';
    
    if (alert.message.includes('数据漂移')) {
      specificAdvice = '检查拉索张力系统，可能出现逐渐松动或材料疲劳。';
    } else if (alert.message.includes('多点异常')) {
      specificAdvice = '检查传感器安装和校准状态，排除设备故障可能性。';
    } else if (alert.message.includes('增益异常')) {
      specificAdvice = '检查信号放大器和电路系统，可能存在电气故障。';
    }
    
    return advisories[alert.level].defaultMsg + ' ' + specificAdvice;
  },
  
  // 设置决策建议事件
  setupAdvisoryEvents: function() {
    // 获取风险评估按钮
    const riskAssessmentBtn = document.getElementById('generate-risk-assessment');
    if (riskAssessmentBtn) {
      riskAssessmentBtn.addEventListener('click', () => {
        this.generateRiskAssessment();
      });
    }
    
    // 获取维护建议按钮
    const maintenanceAdviceBtn = document.getElementById('generate-maintenance-advice');
    if (maintenanceAdviceBtn) {
      maintenanceAdviceBtn.addEventListener('click', () => {
        this.generateMaintenanceAdvice();
      });
    }
  },
  
  // 生成风险评估报告
  generateRiskAssessment: function() {
    // 显示加载状态
    document.getElementById('risk-assessment-loading').style.display = 'block';
    document.getElementById('risk-assessment-content').style.display = 'none';
    
    // 模拟生成报告过程
    setTimeout(() => {
      // 计算风险指数
      const activeAlerts = this.state.alertHistory.filter(alert => alert.isActive);
      
      // 风险得分计算（实际应用中会有更复杂的算法）
      let riskScore = 0;
      const levelScores = { low: 1, medium: 2, high: 4, critical: 8 };
      
      activeAlerts.forEach(alert => {
        riskScore += levelScores[alert.level] || 0;
      });
      
      // 归一化到0-100
      const normalizedScore = Math.min(100, Math.max(0, riskScore * 5));
      
      // 确定风险级别
      let riskLevel, riskColor;
      if (normalizedScore < 20) {
        riskLevel = '低风险';
        riskColor = '#28a745';
      } else if (normalizedScore < 40) {
        riskLevel = '中低风险';
        riskColor = '#ffc107';
      } else if (normalizedScore < 60) {
        riskLevel = '中风险';
        riskColor = '#fd7e14';
      } else if (normalizedScore < 80) {
        riskLevel = '中高风险';
        riskColor = '#dc3545';
      } else {
        riskLevel = '高风险';
        riskColor = '#6f42c1';
      }
      
      // 更新风险评估内容
      document.getElementById('risk-score').textContent = normalizedScore.toFixed(1);
      document.getElementById('risk-score').style.color = riskColor;
      document.getElementById('risk-level').textContent = riskLevel;
      document.getElementById('risk-level').style.color = riskColor;
      document.getElementById('assessment-date').textContent = new Date().toLocaleString('zh-CN');
      
      // 更新风险因素列表
      const riskFactorsList = document.getElementById('risk-factors-list');
      riskFactorsList.innerHTML = '';
      
      if (activeAlerts.length === 0) {
        riskFactorsList.innerHTML = '<li>未发现活动预警</li>';
      } else {
        activeAlerts.forEach(alert => {
          const item = document.createElement('li');
          item.innerHTML = `<span class="factor-level factor-${alert.level}">${this.config.alertLevels[alert.level].name}</span> ${alert.sensorName}: ${alert.message}`;
          riskFactorsList.appendChild(item);
        });
      }
      
      // 显示评估结果
      document.getElementById('risk-assessment-loading').style.display = 'none';
      document.getElementById('risk-assessment-content').style.display = 'block';
    }, 1500);
  },
  
  // 生成维护建议
  generateMaintenanceAdvice: function() {
    // 显示加载状态
    document.getElementById('maintenance-advice-loading').style.display = 'block';
    document.getElementById('maintenance-advice-content').style.display = 'none';
    
    // 模拟生成建议过程
    setTimeout(() => {
      // 获取活动预警
      const activeAlerts = this.state.alertHistory.filter(alert => alert.isActive);
      
      // 更新生成时间
      document.getElementById('advice-generation-date').textContent = new Date().toLocaleString('zh-CN');
      
      // 更新维护建议列表
      const adviceList = document.getElementById('maintenance-advice-list');
      adviceList.innerHTML = '';
      
      if (activeAlerts.length === 0) {
        adviceList.innerHTML = '<li>当前系统状态正常，建议按照常规维护计划进行检查</li>';
      } else {
        // 根据不同传感器位置和预警类型生成建议
        const sensorGroups = {};
        
        // 按位置分组
        activeAlerts.forEach(alert => {
          const location = alert.sensorName.split('号索')[0] + '号索';
          if (!sensorGroups[location]) {
            sensorGroups[location] = [];
          }
          sensorGroups[location].push(alert);
        });
        
        // 生成建议
        for (const [location, alerts] of Object.entries(sensorGroups)) {
          // 取该位置最高级别的预警
          const levelOrder = ['low', 'medium', 'high', 'critical'];
          const maxLevelAlert = alerts.reduce((max, alert) => {
            const currentIndex = levelOrder.indexOf(alert.level);
            const maxIndex = levelOrder.indexOf(max.level);
            return currentIndex > maxIndex ? alert : max;
          }, { level: 'low' });
          
          // 生成具体建议
          const item = document.createElement('li');
          item.innerHTML = `<strong>${location}:</strong> ${this.generateAdvisory(maxLevelAlert)}`;
          adviceList.appendChild(item);
        }
        
        // 添加通用建议
        const generalItem = document.createElement('li');
        generalItem.innerHTML = '<strong>通用建议:</strong> 建议增强对桥梁的监测频率，特别关注上游一号塔和二号塔区域。';
        adviceList.appendChild(generalItem);
      }
      
      // 显示建议内容
      document.getElementById('maintenance-advice-loading').style.display = 'none';
      document.getElementById('maintenance-advice-content').style.display = 'block';
    }, 1500);
  },
  
  // 启动预警检查定时器
  startAlertChecking: function() {
    if (this.state.isCheckingScheduled) return;
    
    // 设置定时器
    setInterval(() => {
      this.checkForAlerts();
    }, this.config.checkInterval);
    
    this.state.isCheckingScheduled = true;
    this.state.lastCheckTime = new Date();
    
    console.log('预警检查定时器已启动');
  },
  
  // 检查预警
  checkForAlerts: function() {
    console.log('检查预警...');
    
    // 实际应用中，这里应该查询最新的传感器数据，并与阈值进行比较
    // 由于我们使用的是模拟数据，这里只是演示，不执行实际的检查逻辑
    
    this.state.lastCheckTime = new Date();
    
    // 更新"上次检查时间"显示
    const lastCheckElem = document.getElementById('last-alert-check');
    if (lastCheckElem) {
      lastCheckElem.textContent = this.state.lastCheckTime.toLocaleString('zh-CN');
    }
  },
  
  // 显示通知
  showNotification: function(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到页面
    const notificationsContainer = document.getElementById('notifications-container');
    if (notificationsContainer) {
      notificationsContainer.appendChild(notification);
      
      // 自动消失
      setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          notificationsContainer.removeChild(notification);
        }, 300);
      }, 3000);
    } else {
      // 如果没有通知容器，使用alert作为备选
      alert(message);
    }
  }
};

// 初始化预警系统
function initAlertSystem() {
  AlertSystem.init();
} 