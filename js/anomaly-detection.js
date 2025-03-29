/**
 * 黑龙江大桥监测系统 - 异常检测与分类模块
 * 负责检测和分类不同类型的传感器数据异常
 */

// 异常检测与分类模块
const AnomalyDetectionModule = {
  // 异常检测配置
  config: {
    // 异常检测阈值设置
    thresholds: {
      // Z分数阈值（用于单点异常和多点异常）
      zScoreThreshold: 3.0,
      // 数据增益异常检测阈值（数据突然增大的倍数）
      gainThreshold: 2.5,
      // 数据漂移检测窗口大小
      driftWindowSize: 30,
      // 漂移检测阈值（均值变化百分比）
      driftThreshold: 0.2
    },
    
    // 异常标记颜色
    colors: {
      singlePoint: '#ff3b30', // 单点异常
      multiPoint: '#ff9500', // 多点异常
      gainAnomaly: '#ff2d55', // 数据增益异常
      driftAnomaly: '#5856d6', // 数据漂移异常
      compositeAnomaly: '#af52de' // 多异常综合情况
    }
  },
  
  // 存储检测到的异常
  detectedAnomalies: {
    // 按传感器ID存储异常记录
    bySensor: {},
    // 按异常类型存储数量统计
    byType: {
      singlePoint: 0,
      multiPoint: 0,
      gainAnomaly: 0,
      driftAnomaly: 0,
      compositeAnomaly: 0
    },
    // 最近检测到的异常
    recent: []
  },
  
  // 初始化异常检测模块
  init: function() {
    console.log('初始化异常检测模块...');
    
    try {
      // 设置异常检测表单事件
      this.setupAnomalyDetectionForm();
      
      // 初始化异常统计图表
      this.initAnomalyCharts();
      
      // 加载异常检测历史
      this.loadAnomalyHistory();
      
      console.log('异常检测模块初始化完成');
    } catch (error) {
      console.error('异常检测模块初始化失败:', error);
    }
  },
  
  // 设置异常检测表单事件
  setupAnomalyDetectionForm: function() {
    const anomalyForm = document.getElementById('anomaly-detection-form');
    if (!anomalyForm) return;
    
    anomalyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // 获取表单数据
      const sensorId = document.getElementById('anomaly-sensor-select').value;
      const startDate = document.getElementById('anomaly-start-date').value;
      const endDate = document.getElementById('anomaly-end-date').value;
      const anomalyTypes = Array.from(document.querySelectorAll('input[name="anomaly-type"]:checked'))
        .map(input => input.value);
      
      // 验证数据
      if (!sensorId || !startDate || !endDate) {
        alert('请填写完整的检测参数');
        return;
      }
      
      if (anomalyTypes.length === 0) {
        alert('请至少选择一种异常类型进行检测');
        return;
      }
      
      // 显示加载状态
      document.getElementById('anomaly-detection-btn').disabled = true;
      document.getElementById('anomaly-detection-btn').textContent = '检测中...';
      document.getElementById('anomaly-detection-progress').style.display = 'block';
      
      // 模拟异常检测过程
      setTimeout(() => {
        // 执行异常检测
        const results = this.detectAnomalies(sensorId, startDate, endDate, anomalyTypes);
        
        // 显示检测结果
        this.displayAnomalyResults(results);
        
        // 恢复按钮状态
        document.getElementById('anomaly-detection-btn').disabled = false;
        document.getElementById('anomaly-detection-btn').textContent = '开始检测';
        document.getElementById('anomaly-detection-progress').style.display = 'none';
      }, 2000);
    });
  },
  
  // 检测异常
  detectAnomalies: function(sensorId, startDate, endDate, anomalyTypes) {
    console.log(`检测传感器 ${sensorId} 从 ${startDate} 到 ${endDate} 的异常数据`);
    
    // 这里应该是真实的异常检测算法
    // 当前为模拟数据，在实际应用中应该从数据库获取数据并执行检测算法
    
    // 模拟结果数据
    const results = {
      sensorId: sensorId,
      timeRange: { start: startDate, end: endDate },
      detectedAnomalies: []
    };
    
    // 生成模拟的异常数据
    const anomalyCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < anomalyCount; i++) {
      // 随机选择异常类型
      const typeIndex = Math.floor(Math.random() * anomalyTypes.length);
      const anomalyType = anomalyTypes[typeIndex];
      
      // 随机日期（在开始和结束日期之间）
      const start = new Date(startDate);
      const end = new Date(endDate);
      const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      
      // 创建异常记录
      const anomaly = {
        id: `anomaly-${Date.now()}-${i}`,
        timestamp: date.toISOString(),
        value: (Math.random() * 100).toFixed(2),
        expectedValue: (Math.random() * 50).toFixed(2),
        deviation: (Math.random() * 30).toFixed(2) + '%',
        type: anomalyType,
        description: this.getAnomalyDescription(anomalyType),
        severity: this.getRandomSeverity()
      };
      
      results.detectedAnomalies.push(anomaly);
      
      // 更新异常统计
      if (!this.detectedAnomalies.bySensor[sensorId]) {
        this.detectedAnomalies.bySensor[sensorId] = [];
      }
      this.detectedAnomalies.bySensor[sensorId].push(anomaly);
      this.detectedAnomalies.byType[anomalyType]++;
      
      // 添加到最近检测的异常
      this.detectedAnomalies.recent.unshift(anomaly);
      if (this.detectedAnomalies.recent.length > 20) {
        this.detectedAnomalies.recent.pop();
      }
    }
    
    // 更新异常统计图表
    this.updateAnomalyCharts();
    
    return results;
  },
  
  // 获取异常描述
  getAnomalyDescription: function(anomalyType) {
    switch(anomalyType) {
      case 'singlePoint':
        return '单点异常：传感器读数出现临时性偏离，可能是由测量误差或突发环境因素引起';
      case 'multiPoint':
        return '多点异常：多个数据点偏离正常范围，可能由传感器故障引起，但未改变整体趋势';
      case 'gainAnomaly':
        return '数据增益异常：数据值整体显著增大，可能由传感器增益错误或系统设置问题引起';
      case 'driftAnomaly':
        return '数据漂移异常：数据逐渐偏离正常范围，表现为系统性、趋势性偏差';
      case 'compositeAnomaly':
        return '多异常综合情况：同时存在多种类型的异常，表明可能存在复杂的系统问题';
      default:
        return '未知异常类型';
    }
  },
  
  // 获取随机严重程度
  getRandomSeverity: function() {
    const severities = ['低', '中', '高', '紧急'];
    return severities[Math.floor(Math.random() * severities.length)];
  },
  
  // 显示异常检测结果
  displayAnomalyResults: function(results) {
    const resultsContainer = document.getElementById('anomaly-results');
    const resultsTable = document.getElementById('anomaly-results-table');
    const resultsBody = document.getElementById('anomaly-results-body');
    
    if (!resultsContainer || !resultsTable || !resultsBody) return;
    
    // 清空现有结果
    resultsBody.innerHTML = '';
    
    // 显示结果容器
    resultsContainer.style.display = 'block';
    
    // 更新表格标题
    document.getElementById('anomaly-sensor-name').textContent = `传感器 ${results.sensorId}`;
    document.getElementById('anomaly-time-range').textContent = 
      `${results.timeRange.start} 至 ${results.timeRange.end}`;
    
    // 没有检测到异常
    if (results.detectedAnomalies.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="text-center">未检测到异常</td>';
      resultsBody.appendChild(row);
      return;
    }
    
    // 添加检测到的异常
    results.detectedAnomalies.forEach(anomaly => {
      const row = document.createElement('tr');
      
      // 设置行样式
      if (anomaly.severity === '高' || anomaly.severity === '紧急') {
        row.classList.add('high-severity');
      }
      
      // 格式化时间戳
      const date = new Date(anomaly.timestamp);
      const formattedDate = date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      
      // 设置单元格内容
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${this.getAnomalyTypeDisplay(anomaly.type)}</td>
        <td>${anomaly.value}</td>
        <td>${anomaly.expectedValue}</td>
        <td>${anomaly.deviation}</td>
        <td>
          <span class="severity-badge severity-${anomaly.severity.toLowerCase()}">
            ${anomaly.severity}
          </span>
        </td>
        <td>
          <button class="details-btn" data-anomaly-id="${anomaly.id}">详情</button>
        </td>
      `;
      
      resultsBody.appendChild(row);
    });
    
    // 添加详情按钮点击事件
    document.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const anomalyId = e.target.getAttribute('data-anomaly-id');
        this.showAnomalyDetails(anomalyId, results.detectedAnomalies);
      });
    });
  },
  
  // 获取异常类型显示名称
  getAnomalyTypeDisplay: function(type) {
    const typeMap = {
      singlePoint: '单点异常',
      multiPoint: '多点异常',
      gainAnomaly: '数据增益异常',
      driftAnomaly: '数据漂移异常',
      compositeAnomaly: '多异常综合'
    };
    
    return typeMap[type] || '未知类型';
  },
  
  // 显示异常详情
  showAnomalyDetails: function(anomalyId, anomalies) {
    const anomaly = anomalies.find(a => a.id === anomalyId);
    if (!anomaly) return;
    
    const detailsModal = document.getElementById('anomaly-details-modal');
    if (!detailsModal) return;
    
    // 填充详情内容
    document.getElementById('anomaly-details-type').textContent = this.getAnomalyTypeDisplay(anomaly.type);
    document.getElementById('anomaly-details-time').textContent = new Date(anomaly.timestamp).toLocaleString('zh-CN');
    document.getElementById('anomaly-details-value').textContent = anomaly.value;
    document.getElementById('anomaly-details-expected').textContent = anomaly.expectedValue;
    document.getElementById('anomaly-details-deviation').textContent = anomaly.deviation;
    document.getElementById('anomaly-details-severity').textContent = anomaly.severity;
    document.getElementById('anomaly-details-description').textContent = anomaly.description;
    
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
  
  // 初始化异常统计图表
  initAnomalyCharts: function() {
    const typeChartCanvas = document.getElementById('anomaly-type-chart');
    const severityChartCanvas = document.getElementById('anomaly-severity-chart');
    const trendChartCanvas = document.getElementById('anomaly-trend-chart');
    
    if (!typeChartCanvas || !severityChartCanvas || !trendChartCanvas) return;
    
    // 异常类型分布图
    this.typeChart = new Chart(typeChartCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['单点异常', '多点异常', '数据增益异常', '数据漂移异常', '多异常综合'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            this.config.colors.singlePoint,
            this.config.colors.multiPoint,
            this.config.colors.gainAnomaly,
            this.config.colors.driftAnomaly,
            this.config.colors.compositeAnomaly
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: '异常类型分布'
          }
        }
      }
    });
    
    // 异常严重程度分布图
    this.severityChart = new Chart(severityChartCanvas.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['低', '中', '高', '紧急'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#4cd964', '#ffcc00', '#ff9500', '#ff3b30']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: '异常严重程度分布'
          }
        }
      }
    });
    
    // 异常趋势图
    this.trendChart = new Chart(trendChartCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '异常数量',
          data: [],
          borderColor: '#5856d6',
          backgroundColor: 'rgba(88, 86, 214, 0.1)',
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '异常数量'
            }
          },
          x: {
            title: {
              display: true,
              text: '日期'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: '异常检测趋势'
          }
        }
      }
    });
  },
  
  // 更新异常统计图表
  updateAnomalyCharts: function() {
    if (!this.typeChart || !this.severityChart || !this.trendChart) return;
    
    // 更新异常类型分布图
    this.typeChart.data.datasets[0].data = [
      this.detectedAnomalies.byType.singlePoint,
      this.detectedAnomalies.byType.multiPoint,
      this.detectedAnomalies.byType.gainAnomaly,
      this.detectedAnomalies.byType.driftAnomaly,
      this.detectedAnomalies.byType.compositeAnomaly
    ];
    this.typeChart.update();
    
    // 更新异常严重程度分布图
    const severityCounts = { '低': 0, '中': 0, '高': 0, '紧急': 0 };
    
    // 计算各严重程度的数量
    Object.values(this.detectedAnomalies.bySensor).flat().forEach(anomaly => {
      severityCounts[anomaly.severity]++;
    });
    
    this.severityChart.data.datasets[0].data = [
      severityCounts['低'],
      severityCounts['中'],
      severityCounts['高'],
      severityCounts['紧急']
    ];
    this.severityChart.update();
    
    // 更新异常趋势图
    // 按日期分组统计异常数量
    const dateGroups = {};
    Object.values(this.detectedAnomalies.bySensor).flat().forEach(anomaly => {
      const date = new Date(anomaly.timestamp).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });
    
    // 按日期排序
    const sortedDates = Object.keys(dateGroups).sort();
    
    this.trendChart.data.labels = sortedDates.map(date => {
      // 格式化日期显示
      const [year, month, day] = date.split('-');
      return `${month}/${day}`;
    });
    
    this.trendChart.data.datasets[0].data = sortedDates.map(date => dateGroups[date]);
    this.trendChart.update();
  },
  
  // 加载异常检测历史
  loadAnomalyHistory: function() {
    const historyTable = document.getElementById('anomaly-history-table');
    const historyBody = document.getElementById('anomaly-history-body');
    
    if (!historyTable || !historyBody) return;
    
    // 清空现有历史记录
    historyBody.innerHTML = '';
    
    // 生成模拟的历史记录
    const historyCount = 10;
    const sensorIds = ['S001', 'S002', 'S003', 'S004', 'S005'];
    const anomalyTypes = ['singlePoint', 'multiPoint', 'gainAnomaly', 'driftAnomaly', 'compositeAnomaly'];
    
    for (let i = 0; i < historyCount; i++) {
      // 创建行
      const row = document.createElement('tr');
      
      // 随机传感器ID
      const sensorId = sensorIds[Math.floor(Math.random() * sensorIds.length)];
      
      // 随机异常类型
      const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      
      // 随机日期（过去30天内）
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const formattedDate = date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      
      // 随机异常数量
      const anomalyCount = Math.floor(Math.random() * 20) + 1;
      
      // 随机处理状态
      const status = Math.random() > 0.5 ? '已处理' : '未处理';
      const statusClass = status === '已处理' ? 'status-resolved' : 'status-pending';
      
      // 设置单元格内容
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${sensorId}</td>
        <td>${this.getAnomalyTypeDisplay(anomalyType)}</td>
        <td>${anomalyCount}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>
          <button class="view-btn">查看</button>
        </td>
      `;
      
      historyBody.appendChild(row);
    }
    
    // 添加查看按钮点击事件
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        alert('查看历史异常详情功能尚未实现');
      });
    });
  }
};

// 初始化异常检测模块
function initAnomalyDetection() {
  AnomalyDetectionModule.init();
}

/**
 * 异常检测增强脚本
 * 用于修复和增强异常检测功能
 * 
 * 版本: 2.0 - 增强型异常检测处理
 */

(function() {
    console.log('异常检测增强脚本初始化...');
    
    // 备份原始方法，如果存在
    const originalProcessWithLSTM = window.processWithLSTM;
    const originalProcessWithDBSCAN = window.processWithDBSCAN;
    const originalProcessWithIsolationForest = window.processWithIsolationForest;
    const originalCreateAnomalyChart = window.createAnomalyChart;
    const originalDetermineAnomalyType = window.determineAnomalyType;
    
    // 增强版LSTM异常检测处理
    window.processWithLSTM = function(sensorData, config) {
        console.log('增强型LSTM异常检测开始...');
        
        try {
            // 检查输入
            if (!sensorData || !Array.isArray(sensorData) || sensorData.length === 0) {
                console.error('LSTM异常检测: 传入的传感器数据无效');
                return [];
            }
            
            // 如果有原始方法，调用它
            if (typeof originalProcessWithLSTM === 'function') {
                return originalProcessWithLSTM(sensorData, config);
            } else {
                // 提供一个基本的模拟实现
                console.warn('原始LSTM处理函数未找到，使用简化算法');
                
                // 简化的LSTM异常模拟
                const anomalies = [];
                
                // 遍历每个传感器
                sensorData.forEach((sensor, sensorIndex) => {
                    if (!sensor || !sensor.data || !Array.isArray(sensor.data)) return;
                    
                    const values = sensor.data.map(point => point.value);
                    const timestamps = sensor.data.map(point => point.timestamp);
                    
                    // 非常简单的异常检测 - 查找数据中的急剧变化
                    for (let i = 1; i < values.length; i++) {
                        // 简化计算: 检查与前一点的差距是否大于阈值
                        const threshold = 0.5; // 可根据实际情况调整
                        const diff = Math.abs(values[i] - values[i-1]);
                        
                        if (diff > threshold * Math.max(...values.filter(v => !isNaN(v)))) {
                            anomalies.push({
                                sensorId: sensor.id,
                                sensorName: sensor.name,
                                index: i,
                                timestamp: timestamps[i],
                                value: values[i],
                                expected: values[i-1],
                                score: diff,
                                type: 'sudden_change'
                            });
                        }
                    }
                });
                
                return anomalies;
            }
        } catch (error) {
            console.error('LSTM处理过程中出错:', error);
            return []; // 返回空数组，避免后续处理错误
        }
    };
    
    // 增强版DBSCAN异常检测处理
    window.processWithDBSCAN = function(sensorData, config) {
        console.log('增强型DBSCAN异常检测开始...');
        
        try {
            // 检查输入
            if (!sensorData || !Array.isArray(sensorData) || sensorData.length === 0) {
                console.error('DBSCAN异常检测: 传入的传感器数据无效');
                return [];
            }
            
            // 如果有原始方法，调用它
            if (typeof originalProcessWithDBSCAN === 'function') {
                return originalProcessWithDBSCAN(sensorData, config);
            } else {
                // 提供一个基本的模拟实现
                console.warn('原始DBSCAN处理函数未找到，使用简化算法');
                
                // 简化的DBSCAN异常模拟
                const anomalies = [];
                
                // 遍历每个传感器
                sensorData.forEach((sensor, sensorIndex) => {
                    if (!sensor || !sensor.data || !Array.isArray(sensor.data)) return;
                    
                    const values = sensor.data.map(point => point.value);
                    const timestamps = sensor.data.map(point => point.timestamp);
                    
                    // 计算简单统计量
                    const validValues = values.filter(v => !isNaN(v));
                    const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
                    const stdDev = Math.sqrt(
                        validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length
                    );
                    
                    // 使用3个标准差作为异常值阈值
                    const threshold = 3 * stdDev;
                    
                    // 检测异常 - 偏离均值超过3个标准差
                    for (let i = 0; i < values.length; i++) {
                        const diff = Math.abs(values[i] - mean);
                        
                        if (diff > threshold) {
                            anomalies.push({
                                sensorId: sensor.id,
                                sensorName: sensor.name,
                                index: i,
                                timestamp: timestamps[i],
                                value: values[i],
                                expected: mean,
                                score: diff / stdDev, // z-score作为异常分数
                                type: 'outlier'
                            });
                        }
                    }
                });
                
                return anomalies;
            }
        } catch (error) {
            console.error('DBSCAN处理过程中出错:', error);
            return []; // 返回空数组，避免后续处理错误
        }
    };
    
    // 增强版IsolationForest异常检测处理
    window.processWithIsolationForest = function(sensorData, config) {
        console.log('增强型IsolationForest异常检测开始...');
        
        try {
            // 检查输入
            if (!sensorData || !Array.isArray(sensorData) || sensorData.length === 0) {
                console.error('IsolationForest异常检测: 传入的传感器数据无效');
                return [];
            }
            
            // 如果有原始方法，调用它
            if (typeof originalProcessWithIsolationForest === 'function') {
                return originalProcessWithIsolationForest(sensorData, config);
            } else {
                // 提供一个基本的模拟实现
                console.warn('原始IsolationForest处理函数未找到，使用简化算法');
                
                // 简化的IsolationForest异常模拟 - 使用滑动窗口检测异常模式
                const anomalies = [];
                
                // 遍历每个传感器
                sensorData.forEach((sensor, sensorIndex) => {
                    if (!sensor || !sensor.data || !Array.isArray(sensor.data)) return;
                    
                    const values = sensor.data.map(point => point.value);
                    const timestamps = sensor.data.map(point => point.timestamp);
                    
                    // 使用滑动窗口检测异常模式
                    const windowSize = 5; // 可根据实际情况调整
                    
                    for (let i = windowSize; i < values.length; i++) {
                        // 获取当前窗口的值
                        const window = values.slice(i - windowSize, i);
                        const currentValue = values[i];
                        
                        // 计算窗口均值和标准差
                        const windowMean = window.reduce((sum, v) => sum + v, 0) / windowSize;
                        const windowStdDev = Math.sqrt(
                            window.reduce((sum, v) => sum + Math.pow(v - windowMean, 2), 0) / windowSize
                        );
                        
                        // 计算当前值与窗口均值的距离
                        const distance = Math.abs(currentValue - windowMean);
                        
                        // 如果距离大于2.5个窗口标准差，认为是异常
                        if (distance > 2.5 * windowStdDev) {
                            anomalies.push({
                                sensorId: sensor.id,
                                sensorName: sensor.name,
                                index: i,
                                timestamp: timestamps[i],
                                value: currentValue,
                                expected: windowMean,
                                score: distance / windowStdDev,
                                type: 'pattern_break'
                            });
                        }
                    }
                });
                
                return anomalies;
            }
        } catch (error) {
            console.error('IsolationForest处理过程中出错:', error);
            return []; // 返回空数组，避免后续处理错误
        }
    };
    
    // 增强版异常类型判定函数
    window.determineAnomalyType = function(anomaly) {
        console.log('增强型异常类型判定...');
        
        try {
            // 如果有原始方法，调用它
            if (typeof originalDetermineAnomalyType === 'function') {
                return originalDetermineAnomalyType(anomaly);
            } else {
                // 提供一个基本实现
                console.warn('原始异常类型判定函数未找到，使用简化判定');
                
                // 如果已有类型字段，直接使用
                if (anomaly.type) {
                    switch (anomaly.type) {
                        case 'sudden_change':
                            return '突变异常';
                        case 'outlier':
                            return '离群异常';
                        case 'pattern_break':
                            return '模式异常';
                        default:
                            return anomaly.type;
                    }
                }
                
                // 根据分数和其他特征判断类型
                if (anomaly.score > 10) {
                    return '严重异常';
                } else if (anomaly.score > 5) {
                    return '中度异常';
                } else {
                    return '轻微异常';
                }
            }
        } catch (error) {
            console.error('异常类型判定过程中出错:', error);
            return '未知异常'; // 返回默认值，避免显示错误
        }
    };
    
    // 增强版异常图表创建
    window.createAnomalyChart = function(sensorGroups, options) {
        console.log('增强型异常图表创建开始...');
        
        try {
            // 检查输入
            if (!sensorGroups || !Array.isArray(sensorGroups)) {
                console.error('创建异常图表: 传入的传感器组数据无效');
                
                // 清空并显示错误消息
                const container = document.getElementById('anomaly-chart-container');
                if (container) {
                    container.innerHTML = '<div class="error-message">无法创建图表：传感器数据无效</div>';
                }
                
                return;
            }
            
            // 如果有原始方法，调用它
            if (typeof originalCreateAnomalyChart === 'function') {
                originalCreateAnomalyChart(sensorGroups, options);
                return;
            }
            
            // 否则提供一个基本实现
            console.warn('原始异常图表创建函数未找到，使用简化创建方法');
            
            // 创建基本图表
            const container = document.getElementById('anomaly-chart-container');
            if (!container) {
                console.error('找不到anomaly-chart-container元素');
                return;
            }
            
            // 清空容器
            container.innerHTML = '';
            
            // 如果没有传感器组或者所有组都没有数据，显示提示
            if (sensorGroups.length === 0 || sensorGroups.every(group => !group.sensors || group.sensors.length === 0)) {
                container.innerHTML = '<div class="no-data-message">没有检测到异常</div>';
                return;
            }
            
            // 按传感器类型分组
            const sensorsByType = {};
            
            // 遍历所有传感器组
            sensorGroups.forEach(group => {
                if (!group.sensors || !Array.isArray(group.sensors)) return;
                
                group.sensors.forEach(sensor => {
                    if (!sensor) return;
                    
                    // 获取传感器类型
                    const type = sensor.type || '未分类传感器';
                    
                    // 初始化类型数组
                    if (!sensorsByType[type]) {
                        sensorsByType[type] = [];
                    }
                    
                    // 添加传感器到对应类型
                    sensorsByType[type].push(sensor);
                });
            });
            
            // 为每种传感器类型创建单独的图表
            for (const type in sensorsByType) {
                const sensors = sensorsByType[type];
                
                // 创建图表容器
                const chartSection = document.createElement('div');
                chartSection.className = 'chart-section';
                
                // 添加标题
                const header = document.createElement('h3');
                header.textContent = `${type}异常检测结果`;
                chartSection.appendChild(header);
                
                // 创建canvas元素
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 400;
                chartSection.appendChild(canvas);
                
                // 将图表添加到主容器
                container.appendChild(chartSection);
                
                // 准备数据
                const datasets = [];
                const labels = [];
                
                // 颜色映射
                const colors = [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)',
                    'rgba(83, 102, 255, 0.8)',
                    'rgba(40, 159, 64, 0.8)',
                    'rgba(210, 199, 199, 0.8)'
                ];
                
                // 收集所有时间戳
                const allTimestamps = new Set();
                sensors.forEach(sensor => {
                    if (!sensor.data) return;
                    
                    sensor.data.forEach(point => {
                        if (point.timestamp) {
                            allTimestamps.add(point.timestamp);
                        }
                    });
                });
                
                // 排序时间戳
                const sortedTimestamps = Array.from(allTimestamps).sort();
                
                // 创建数据集
                sensors.forEach((sensor, index) => {
                    if (!sensor.data || !Array.isArray(sensor.data)) return;
                    
                    const color = colors[index % colors.length];
                    const borderColor = color.replace('0.8', '1');
                    
                    // 创建传感器数据集
                    const dataset = {
                        label: sensor.name || `传感器 ${index + 1}`,
                        data: [],
                        borderColor: borderColor,
                        backgroundColor: color,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    };
                    
                    // 为每个时间戳查找对应的值
                    sortedTimestamps.forEach(timestamp => {
                        const point = sensor.data.find(p => p.timestamp === timestamp);
                        dataset.data.push(point ? point.value : null);
                    });
                    
                    datasets.push(dataset);
                });
                
                // 使用时间戳作为标签
                const formattedLabels = sortedTimestamps.map(timestamp => {
                    const date = new Date(timestamp);
                    return date.toLocaleString('zh-CN', { 
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit', 
                        minute: '2-digit'
                    });
                });
                
                // 配置图表选项
                const chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '时间'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '数值'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    return `${label}: ${context.parsed.y}`;
                                }
                            }
                        }
                    }
                };
                
                // 创建图表
                try {
                    new Chart(canvas.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: formattedLabels,
                            datasets: datasets
                        },
                        options: chartOptions
                    });
                } catch (chartError) {
                    console.error('创建Chart实例时出错:', chartError);
                    
                    // 在canvas上显示错误信息
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#f8f8f8';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        ctx.font = '14px Arial';
                        ctx.fillStyle = '#ff0000';
                        ctx.textAlign = 'center';
                        ctx.fillText('图表创建失败: ' + chartError.message, canvas.width / 2, canvas.height / 2);
                    }
                }
            }
        } catch (error) {
            console.error('创建异常图表过程中出错:', error);
            
            // 显示错误消息
            const container = document.getElementById('anomaly-chart-container');
            if (container) {
                container.innerHTML = '<div class="error-message">创建图表时出错: ' + error.message + '</div>';
            }
        }
    };
    
    console.log('异常检测增强脚本加载完成');
})(); 