/**
 * 黑龙江大桥监测系统 - 数据统计与分析模块
 * 提供数据可视化和分类功能
 */

// 数据统计与分析模块
const StatisticsModule = {
  // 配置参数
  config: {
    // 图表颜色配置
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8'
    },
    
    // 时间周期配置
    timeRanges: {
      hour: '小时',
      day: '日',
      week: '周',
      month: '月'
    },
    
    // 异常阈值配置
    thresholds: {
      temperature: { warning: 35, alert: 45 },
      vibration: { warning: 2.5, alert: 4.0 },
      stress: { warning: 250, alert: 350 }
    }
  },
  
  // 存储当前分析状态
  state: {
    selectedSensor: null,
    selectedTimeRange: 'day',
    selectedDataType: 'strain',
    dateRange: {
      start: null,
      end: null
    },
    analysisResults: null
  },
  
  // 模拟数据库 - 传感器列表
  sensors: [
    { id: 'US1C2', name: '上游一号塔二号索', type: 'strain', location: '上游段', tower: '一号塔', cable: '二号索' },
    { id: 'US1C8', name: '上游一号塔八号索', type: 'strain', location: '上游段', tower: '一号塔', cable: '八号索' },
    { id: 'US2C2', name: '上游二号塔二号索', type: 'strain', location: '上游段', tower: '二号塔', cable: '二号索' },
    { id: 'US2C8', name: '上游二号塔八号索', type: 'strain', location: '上游段', tower: '二号塔', cable: '八号索' },
    { id: 'US3C2', name: '上游三号塔二号索', type: 'strain', location: '上游段', tower: '三号塔', cable: '二号索' },
    { id: 'US3C8', name: '上游三号塔八号索', type: 'strain', location: '上游段', tower: '三号塔', cable: '八号索' },
    { id: 'DS1C2', name: '下游一号塔二号索', type: 'strain', location: '下游段', tower: '一号塔', cable: '二号索' },
    { id: 'DS1C8', name: '下游一号塔八号索', type: 'strain', location: '下游段', tower: '一号塔', cable: '八号索' },
    { id: 'DS2C2', name: '下游二号塔二号索', type: 'strain', location: '下游段', tower: '二号塔', cable: '二号索' },
    { id: 'DS2C8', name: '下游二号塔八号索', type: 'strain', location: '下游段', tower: '二号塔', cable: '八号索' },
    { id: 'DS3C2', name: '下游三号塔二号索', type: 'strain', location: '下游段', tower: '三号塔', cable: '二号索' },
    { id: 'DS3C8', name: '下游三号塔八号索', type: 'strain', location: '下游段', tower: '三号塔', cable: '八号索' }
  ],
  
  // 模拟的上游一号塔二号索1月数据
  // 简化版，实际应该从Excel文件中读取
  januaryDataUS1C2: {
    dates: Array.from({length: 31}, (_, i) => `2024-01-${String(i+1).padStart(2, '0')}`),
    values: [
      // 正常数据
      210, 215, 208, 212, 214, 209, 213, 211, 210, 216,
      // 单点异常
      245, 
      // 正常数据
      213, 209, 214, 210, 211, 208, 215, 212, 
      // 多点异常
      235, 232, 240, 
      // 数据漂移异常
      218, 224, 229, 234, 241, 247, 250, 248
    ],
    anomalies: [
      { date: '2024-01-11', type: 'singlePoint', value: 245, expected: 212, severity: '中' },
      { date: '2024-01-21', type: 'multiPoint', value: 235, expected: 211, severity: '中' },
      { date: '2024-01-22', type: 'multiPoint', value: 232, expected: 210, severity: '低' },
      { date: '2024-01-23', type: 'multiPoint', value: 240, expected: 212, severity: '中' },
      { date: '2024-01-25', type: 'driftAnomaly', value: 224, expected: 212, severity: '低' },
      { date: '2024-01-26', type: 'driftAnomaly', value: 229, expected: 211, severity: '中' },
      { date: '2024-01-27', type: 'driftAnomaly', value: 234, expected: 213, severity: '中' },
      { date: '2024-01-28', type: 'driftAnomaly', value: 241, expected: 210, severity: '高' },
      { date: '2024-01-29', type: 'driftAnomaly', value: 247, expected: 212, severity: '高' },
      { date: '2024-01-30', type: 'driftAnomaly', value: 250, expected: 211, severity: '紧急' },
      { date: '2024-01-31', type: 'driftAnomaly', value: 248, expected: 210, severity: '高' }
    ]
  },
  
  // 统计指标
  statistics: {
    US1C2: {
      mean: 223.16,
      median: 214,
      stdDev: 14.32,
      min: 208,
      max: 250,
      anomalyCount: 11,
      anomalyPercentage: 35.48
    }
  },
  
  // 初始化模块
  init: function() {
    console.log('初始化数据统计与分析模块...');
    
    try {
      // 填充传感器选择下拉菜单
      this.populateSensorSelect();
      
      // 设置分析表单事件
      this.setupAnalysisForm();
      
      // 初始化图表
      this.initCharts();
      
      // 设置日期选择器
      this.setupDatePickers();
      
      console.log('数据统计与分析模块初始化完成');
    } catch (error) {
      console.error('数据统计与分析模块初始化失败:', error);
    }
  },
  
  // 填充传感器选择下拉菜单
  populateSensorSelect: function() {
    const sensorSelect = document.getElementById('analysis-sensor-select');
    if (!sensorSelect) return;
    
    // 清空现有选项
    sensorSelect.innerHTML = '<option value="">选择传感器</option>';
    
    // 添加传感器选项
    this.sensors.forEach(sensor => {
      const option = document.createElement('option');
      option.value = sensor.id;
      option.textContent = `${sensor.name} (${sensor.id})`;
      sensorSelect.appendChild(option);
    });
  },
  
  // 设置分析表单事件
  setupAnalysisForm: function() {
    const analysisForm = document.getElementById('analysis-form');
    if (!analysisForm) return;
    
    analysisForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // 获取分析参数
      const sensorId = document.getElementById('analysis-sensor-select').value;
      const dataType = document.getElementById('data-type-select').value;
      const timeRange = document.getElementById('time-range-select').value;
      const startDate = document.getElementById('analysis-start-date').value;
      const endDate = document.getElementById('analysis-end-date').value;
      
      // 验证参数
      if (!sensorId) {
        alert('请选择要分析的传感器');
        return;
      }
      
      if (!startDate || !endDate) {
        alert('请选择分析的时间范围');
        return;
      }
      
      // 更新状态
      this.state.selectedSensor = sensorId;
      this.state.selectedDataType = dataType;
      this.state.selectedTimeRange = timeRange;
      this.state.dateRange.start = startDate;
      this.state.dateRange.end = endDate;
      
      // 执行分析
      this.performAnalysis();
    });
    
    // 数据类型选择事件
    const dataTypeSelect = document.getElementById('data-type-select');
    if (dataTypeSelect) {
      dataTypeSelect.addEventListener('change', () => {
        this.state.selectedDataType = dataTypeSelect.value;
      });
    }
    
    // 时间范围选择事件
    const timeRangeSelect = document.getElementById('time-range-select');
    if (timeRangeSelect) {
      timeRangeSelect.addEventListener('change', () => {
        this.state.selectedTimeRange = timeRangeSelect.value;
        
        // 更新日期选择器
        this.updateDateRangeByTimeRange(timeRangeSelect.value);
      });
    }
  },
  
  // 根据时间范围更新日期选择器
  updateDateRangeByTimeRange: function(timeRange) {
    const today = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'hour':
        // 最近24小时
        startDate.setHours(today.getHours() - 24);
        break;
      case 'day':
        // 最近7天
        startDate.setDate(today.getDate() - 7);
        break;
      case 'week':
        // 最近4周
        startDate.setDate(today.getDate() - 28);
        break;
      case 'month':
        // 最近3个月
        startDate.setMonth(today.getMonth() - 3);
        break;
    }
    
    // 格式化日期
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // 更新日期选择器
    const startDateInput = document.getElementById('analysis-start-date');
    const endDateInput = document.getElementById('analysis-end-date');
    
    if (startDateInput && endDateInput) {
      startDateInput.value = formatDate(startDate);
      endDateInput.value = formatDate(today);
      
      // 更新状态
      this.state.dateRange.start = startDateInput.value;
      this.state.dateRange.end = endDateInput.value;
    }
  },
  
  // 设置日期选择器
  setupDatePickers: function() {
    // 设置默认日期范围为最近7天
    this.updateDateRangeByTimeRange('day');
  },
  
  // 初始化图表
  initCharts: function() {
    // 数据趋势图
    const trendChartCanvas = document.getElementById('data-trend-chart');
    if (trendChartCanvas) {
      this.trendChart = new Chart(trendChartCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: '传感器数据',
            data: [],
            borderColor: this.config.colors.primary,
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: '数据趋势分析'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '日期'
              }
            },
            y: {
              title: {
                display: true,
                text: '值'
              },
              beginAtZero: false
            }
          }
        }
      });
    }
    
    // 异常分布图
    const anomalyChartCanvas = document.getElementById('anomaly-distribution-chart');
    if (anomalyChartCanvas) {
      this.anomalyChart = new Chart(anomalyChartCanvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: ['正常', '单点异常', '多点异常', '数据增益异常', '数据漂移异常'],
          datasets: [{
            data: [100, 0, 0, 0, 0],
            backgroundColor: [
              this.config.colors.success,
              this.config.colors.warning,
              this.config.colors.danger,
              this.config.colors.info,
              this.config.colors.secondary
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
    }
    
    // 统计指标图
    const statsChartCanvas = document.getElementById('statistics-chart');
    if (statsChartCanvas) {
      this.statsChart = new Chart(statsChartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['均值', '中位数', '标准差', '最小值', '最大值'],
          datasets: [{
            label: '统计指标',
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              this.config.colors.primary,
              this.config.colors.primary,
              this.config.colors.primary,
              this.config.colors.primary,
              this.config.colors.primary
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: '基础统计指标'
            }
          },
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    }
  },
  
  // 执行数据分析
  performAnalysis: function() {
    console.log(`分析传感器 ${this.state.selectedSensor} 的数据...`);
    
    // 显示加载状态
    document.getElementById('analysis-loading').style.display = 'block';
    document.getElementById('analysis-results').style.display = 'none';
    
    // 模拟分析过程（实际应该从数据文件中读取）
    setTimeout(() => {
      // 针对上游一号塔二号索的特殊处理
      if (this.state.selectedSensor === 'US1C2') {
        // 使用预设的模拟数据
        this.displayAnalysisResults(this.januaryDataUS1C2, this.statistics.US1C2);
      } else {
        // 对其他传感器，使用随机生成的模拟数据
        this.generateAndDisplayRandomData();
      }
      
      // 隐藏加载状态
      document.getElementById('analysis-loading').style.display = 'none';
      document.getElementById('analysis-results').style.display = 'block';
    }, 1500);
  },
  
  // 生成并显示随机数据（用于未特别定义的传感器）
  generateAndDisplayRandomData: function() {
    // 生成日期范围
    const start = new Date(this.state.dateRange.start);
    const end = new Date(this.state.dateRange.end);
    const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
    
    const dates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 生成随机值
    const baseValue = 200 + Math.random() * 50;
    const values = [];
    const anomalies = [];
    
    for (let i = 0; i < days; i++) {
      // 随机波动
      let value = baseValue + (Math.random() * 20 - 10);
      
      // 随机生成一些异常
      if (Math.random() < 0.2) {
        const anomalyTypes = ['singlePoint', 'multiPoint', 'gainAnomaly', 'driftAnomaly'];
        const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
        const severity = ['低', '中', '高', '紧急'][Math.floor(Math.random() * 4)];
        
        // 根据异常类型调整值
        let expectedValue = baseValue + (Math.random() * 10 - 5);
        
        if (type === 'singlePoint') {
          value = baseValue + (Math.random() > 0.5 ? 30 : -30);
        } else if (type === 'multiPoint') {
          value = baseValue + (Math.random() > 0.5 ? 25 : -25);
        } else if (type === 'gainAnomaly') {
          value = baseValue * (1.5 + Math.random() * 0.5);
        } else if (type === 'driftAnomaly') {
          value = baseValue + (i / days) * 50;
        }
        
        // 添加异常记录
        anomalies.push({
          date: dates[i],
          type: type,
          value: value.toFixed(2),
          expected: expectedValue.toFixed(2),
          severity: severity
        });
      }
      
      values.push(parseFloat(value.toFixed(2)));
    }
    
    // 计算统计值
    const stats = {
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
      stdDev: Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - (values.reduce((s, val) => s + val, 0) / values.length), 2), 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      anomalyCount: anomalies.length,
      anomalyPercentage: (anomalies.length / days * 100).toFixed(2)
    };
    
    // 显示结果
    this.displayAnalysisResults({dates, values, anomalies}, stats);
  },
  
  // 显示分析结果
  displayAnalysisResults: function(data, stats) {
    // 更新统计信息
    document.getElementById('stat-mean').textContent = stats.mean.toFixed(2);
    document.getElementById('stat-median').textContent = stats.median.toFixed(2);
    document.getElementById('stat-stddev').textContent = stats.stdDev.toFixed(2);
    document.getElementById('stat-min').textContent = stats.min.toFixed(2);
    document.getElementById('stat-max').textContent = stats.max.toFixed(2);
    document.getElementById('stat-anomaly-count').textContent = stats.anomalyCount;
    document.getElementById('stat-anomaly-percentage').textContent = stats.anomalyPercentage + '%';
    
    // 更新数据趋势图
    this.updateTrendChart(data);
    
    // 更新异常分布图
    this.updateAnomalyChart(data.anomalies);
    
    // 更新统计指标图
    this.updateStatsChart(stats);
    
    // 显示异常列表
    this.displayAnomalyList(data.anomalies);
  },
  
  // 更新数据趋势图
  updateTrendChart: function(data) {
    if (!this.trendChart) return;
    
    // 获取选中传感器的名称
    const sensorName = this.sensors.find(s => s.id === this.state.selectedSensor)?.name || this.state.selectedSensor;
    
    // 更新图表数据
    this.trendChart.data.labels = data.dates;
    this.trendChart.data.datasets[0].label = `${sensorName} - ${this.state.selectedDataType}`;
    this.trendChart.data.datasets[0].data = data.values;
    
    // 添加异常点标记
    if (data.anomalies && data.anomalies.length > 0) {
      // 移除之前的异常点数据集
      while (this.trendChart.data.datasets.length > 1) {
        this.trendChart.data.datasets.pop();
      }
      
      // 按异常类型分组
      const anomalyGroups = {};
      data.anomalies.forEach(anomaly => {
        if (!anomalyGroups[anomaly.type]) {
          anomalyGroups[anomaly.type] = [];
        }
        
        // 查找日期索引
        const dateIndex = data.dates.indexOf(anomaly.date);
        if (dateIndex !== -1) {
          anomalyGroups[anomaly.type].push({
            x: dateIndex,
            y: data.values[dateIndex]
          });
        }
      });
      
      // 添加异常点数据集
      for (const [type, points] of Object.entries(anomalyGroups)) {
        const color = this.getAnomalyColor(type);
        const typeName = this.getAnomalyTypeName(type);
        
        // 创建稀疏数据集，只在异常点位置有值
        const anomalyData = Array(data.dates.length).fill(null);
        points.forEach(point => {
          anomalyData[point.x] = point.y;
        });
        
        this.trendChart.data.datasets.push({
          label: typeName,
          data: anomalyData,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 0,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: false,
          showLine: false
        });
      }
    }
    
    // 更新图表
    this.trendChart.update();
  },
  
  // 更新异常分布图
  updateAnomalyChart: function(anomalies) {
    if (!this.anomalyChart) return;
    
    // 计算各类型异常的数量
    const counts = {
      normal: 0,
      singlePoint: 0,
      multiPoint: 0,
      gainAnomaly: 0,
      driftAnomaly: 0
    };
    
    // 总的数据点数量
    const totalPoints = this.state.dateRange.end && this.state.dateRange.start ?
                        (new Date(this.state.dateRange.end) - new Date(this.state.dateRange.start)) / (1000 * 60 * 60 * 24) + 1 :
                        31; // 默认为一个月
    
    // 计算正常点数量
    counts.normal = totalPoints - anomalies.length;
    
    // 计算各类异常点数量
    anomalies.forEach(anomaly => {
      if (counts[anomaly.type] !== undefined) {
        counts[anomaly.type]++;
      }
    });
    
    // 更新图表数据
    this.anomalyChart.data.datasets[0].data = [
      counts.normal,
      counts.singlePoint,
      counts.multiPoint,
      counts.gainAnomaly,
      counts.driftAnomaly
    ];
    
    // 更新图表
    this.anomalyChart.update();
  },
  
  // 更新统计指标图
  updateStatsChart: function(stats) {
    if (!this.statsChart) return;
    
    // 更新图表数据
    this.statsChart.data.datasets[0].data = [
      stats.mean,
      stats.median,
      stats.stdDev,
      stats.min,
      stats.max
    ];
    
    // 更新图表
    this.statsChart.update();
  },
  
  // 显示异常列表
  displayAnomalyList: function(anomalies) {
    const anomalyListContainer = document.getElementById('anomaly-list');
    const anomalyTable = document.getElementById('anomaly-table');
    const anomalyBody = document.getElementById('anomaly-table-body');
    
    if (!anomalyListContainer || !anomalyTable || !anomalyBody) return;
    
    // 清空现有内容
    anomalyBody.innerHTML = '';
    
    // 没有异常
    if (!anomalies || anomalies.length === 0) {
      anomalyListContainer.style.display = 'none';
      return;
    }
    
    // 显示容器
    anomalyListContainer.style.display = 'block';
    
    // 添加异常记录
    anomalies.forEach(anomaly => {
      const row = document.createElement('tr');
      
      // 设置严重程度样式
      if (anomaly.severity === '高' || anomaly.severity === '紧急') {
        row.classList.add('high-severity');
      }
      
      // 设置单元格内容
      row.innerHTML = `
        <td>${anomaly.date}</td>
        <td>${this.getAnomalyTypeName(anomaly.type)}</td>
        <td>${anomaly.value}</td>
        <td>${anomaly.expected}</td>
        <td>
          <span class="severity-badge severity-${anomaly.severity.toLowerCase()}">
            ${anomaly.severity}
          </span>
        </td>
      `;
      
      anomalyBody.appendChild(row);
    });
  },
  
  // 获取异常类型颜色
  getAnomalyColor: function(type) {
    const colorMap = {
      singlePoint: '#ff9500',
      multiPoint: '#ff3b30',
      gainAnomaly: '#ff2d55',
      driftAnomaly: '#5856d6'
    };
    
    return colorMap[type] || '#999';
  },
  
  // 获取异常类型名称
  getAnomalyTypeName: function(type) {
    const typeMap = {
      singlePoint: '单点异常',
      multiPoint: '多点异常',
      gainAnomaly: '数据增益异常',
      driftAnomaly: '数据漂移异常'
    };
    
    return typeMap[type] || '未知类型';
  }
};

// 初始化统计分析模块
function initStatisticsModule() {
  StatisticsModule.init();
} 