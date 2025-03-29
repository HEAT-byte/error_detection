/**
 * 黑龙江大桥监测系统 - 高级数据分析模块
 * 提供数据趋势分析、异常检测和预测功能
 */

// 高级数据分析模块
const AdvancedAnalysis = {
  // 配置选项
  config: {
    // 分析时间范围选项
    timeRanges: {
      day: { label: '24小时', value: 24 * 60 * 60 * 1000 },
      week: { label: '7天', value: 7 * 24 * 60 * 60 * 1000 },
      month: { label: '30天', value: 30 * 24 * 60 * 60 * 1000 },
      year: { label: '365天', value: 365 * 24 * 60 * 60 * 1000 }
    },
    
    // 异常检测敏感度
    anomalyThresholds: {
      low: { z: 2.0, label: '低灵敏度' },
      medium: { z: 2.5, label: '中灵敏度' },
      high: { z: 3.0, label: '高灵敏度' }
    },
    
    // 默认图表颜色
    chartColors: {
      primary: 'rgba(0, 123, 255, 0.7)',
      secondary: 'rgba(108, 117, 125, 0.7)',
      success: 'rgba(40, 167, 69, 0.7)',
      warning: 'rgba(255, 193, 7, 0.7)',
      danger: 'rgba(220, 53, 69, 0.7)',
      info: 'rgba(23, 162, 184, 0.7)',
      anomaly: 'rgba(220, 53, 69, 1)',
      prediction: 'rgba(23, 162, 184, 0.5)',
      threshold: 'rgba(0, 0, 0, 0.2)'
    }
  },
  
  // 状态变量
  state: {
    currentSensor: null,
    currentTimeRange: 'week',
    currentData: [],
    anomalies: [],
    predictions: [],
    isAnalyzing: false,
    lastAnalysisTime: null,
    selectedSensitivity: 'medium',
    chartInstances: {}
  },
  
  // 初始化分析模块
  init: function() {
    console.log('初始化高级数据分析模块...');
    
    try {
      // 设置UI事件监听
      this.setupUIEvents();
      
      // 初始化图表
      this.initCharts();
      
      console.log('高级数据分析模块初始化完成');
    } catch (error) {
      console.error('高级数据分析模块初始化失败:', error);
    }
  },
  
  // 设置UI事件监听
  setupUIEvents: function() {
    // 传感器选择变更
    const sensorSelect = document.getElementById('analysis-sensor-select');
    if (sensorSelect) {
      sensorSelect.addEventListener('change', (e) => {
        this.state.currentSensor = e.target.value;
        this.loadSensorData();
      });
    }
    
    // 时间范围选择
    const timeRangeSelect = document.getElementById('analysis-time-range');
    if (timeRangeSelect) {
      timeRangeSelect.addEventListener('change', (e) => {
        this.state.currentTimeRange = e.target.value;
        this.loadSensorData();
      });
    }
    
    // 灵敏度选择
    const sensitivitySelect = document.getElementById('anomaly-sensitivity');
    if (sensitivitySelect) {
      sensitivitySelect.addEventListener('change', (e) => {
        this.state.selectedSensitivity = e.target.value;
        this.detectAnomalies();
        this.updateAnomalyChart();
      });
    }
    
    // 运行分析按钮
    const runAnalysisBtn = document.getElementById('run-analysis-btn');
    if (runAnalysisBtn) {
      runAnalysisBtn.addEventListener('click', () => {
        this.runFullAnalysis();
      });
    }
    
    // 导出报告按钮
    const exportReportBtn = document.getElementById('export-analysis-report');
    if (exportReportBtn) {
      exportReportBtn.addEventListener('click', () => {
        this.exportAnalysisReport();
      });
    }
  },
  
  // 初始化图表
  initCharts: function() {
    // 趋势分析图表
    const trendChartCanvas = document.getElementById('trend-analysis-chart');
    if (trendChartCanvas) {
      this.state.chartInstances.trend = new Chart(trendChartCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: '传感器数据',
            data: [],
            borderColor: this.config.chartColors.primary,
            backgroundColor: this.config.chartColors.primary,
            borderWidth: 2,
            tension: 0.1,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
          }
        }
      });
    }
    
    // 异常检测图表
    const anomalyChartCanvas = document.getElementById('anomaly-detection-chart');
    if (anomalyChartCanvas) {
      this.state.chartInstances.anomaly = new Chart(anomalyChartCanvas.getContext('2d'), {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: '正常数据',
              data: [],
              backgroundColor: this.config.chartColors.primary,
              pointRadius: 3
            },
            {
              label: '异常数据',
              data: [],
              backgroundColor: this.config.chartColors.anomaly,
              pointRadius: 5,
              pointStyle: 'triangle'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day'
              },
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
          }
        }
      });
    }
    
    // 预测分析图表
    const predictionChartCanvas = document.getElementById('prediction-analysis-chart');
    if (predictionChartCanvas) {
      this.state.chartInstances.prediction = new Chart(predictionChartCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: '历史数据',
              data: [],
              borderColor: this.config.chartColors.primary,
              backgroundColor: 'transparent',
              borderWidth: 2
            },
            {
              label: '预测数据',
              data: [],
              borderColor: this.config.chartColors.prediction,
              backgroundColor: this.config.chartColors.prediction,
              borderWidth: 2,
              borderDash: [5, 5]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
          }
        }
      });
    }
  },
  
  // 加载传感器数据
  loadSensorData: function() {
    if (!this.state.currentSensor) {
      console.warn('未选择传感器，无法加载数据');
      return;
    }
    
    // 显示加载状态
    this.showLoadingState(true);
    
    // 在实际应用中，这里应该调用API获取传感器数据
    // 现在我们使用模拟数据
    setTimeout(() => {
      this.state.currentData = this.generateMockData();
      
      // 更新图表
      this.updateTrendChart();
      this.detectAnomalies();
      this.generatePredictions();
      
      // 隐藏加载状态
      this.showLoadingState(false);
      
      console.log(`已加载 ${this.state.currentSensor} 传感器的 ${this.state.currentTimeRange} 数据`);
    }, 800);
  },
  
  // 显示/隐藏加载状态
  showLoadingState: function(isLoading) {
    const loadingElements = document.querySelectorAll('.analysis-loading');
    const contentElements = document.querySelectorAll('.analysis-content');
    
    loadingElements.forEach(elem => {
      elem.style.display = isLoading ? 'flex' : 'none';
    });
    
    contentElements.forEach(elem => {
      elem.style.display = isLoading ? 'none' : 'block';
    });
  },
  
  // 运行完整分析
  runFullAnalysis: function() {
    if (!this.state.currentSensor) {
      alert('请先选择一个传感器');
      return;
    }
    
    if (this.state.isAnalyzing) {
      alert('分析正在进行中，请稍候');
      return;
    }
    
    // 设置状态
    this.state.isAnalyzing = true;
    
    // 显示加载状态
    this.showLoadingState(true);
    document.getElementById('analysis-status').textContent = '正在进行分析...';
    
    // 模拟分析过程
    setTimeout(() => {
      // 执行各种分析
      this.detectAnomalies();
      this.generatePredictions();
      this.performCorrelationAnalysis();
      
      // 更新所有图表
      this.updateAllCharts();
      
      // 更新状态
      this.state.isAnalyzing = false;
      this.state.lastAnalysisTime = new Date();
      document.getElementById('analysis-status').textContent = 
        `分析完成 (${this.state.lastAnalysisTime.toLocaleString('zh-CN')})`;
      
      // 显示分析结果
      this.showAnalysisResults();
      
      // 隐藏加载状态
      this.showLoadingState(false);
    }, 2000);
  },
  
  // 更新所有图表
  updateAllCharts: function() {
    this.updateTrendChart();
    this.updateAnomalyChart();
    this.updatePredictionChart();
  },
  
  // 更新趋势分析图表
  updateTrendChart: function() {
    const chart = this.state.chartInstances.trend;
    if (!chart) return;
    
    // 准备数据
    const labels = this.state.currentData.map(item => item.timestamp);
    const data = this.state.currentData.map(item => item.value);
    
    // 更新图表数据
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].label = `${this.state.currentSensor} 传感器数据`;
    
    // 更新图表
    chart.update();
  },
  
  // 检测异常
  detectAnomalies: function() {
    if (!this.state.currentData || this.state.currentData.length === 0) {
      return;
    }
    
    // 获取所有数值
    const values = this.state.currentData.map(item => item.value);
    
    // 计算统计量
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => (val - mean) ** 2);
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // 获取选定的敏感度
    const threshold = this.config.anomalyThresholds[this.state.selectedSensitivity].z;
    
    // 检测异常点
    this.state.anomalies = this.state.currentData.filter(item => {
      const zScore = Math.abs(item.value - mean) / stdDev;
      return zScore > threshold;
    });
    
    // 更新异常统计
    this.updateAnomalyStats();
    
    console.log(`检测到 ${this.state.anomalies.length} 个异常点`);
  },
  
  // 更新异常检测图表
  updateAnomalyChart: function() {
    const chart = this.state.chartInstances.anomaly;
    if (!chart) return;
    
    // 准备正常数据点
    const normalData = this.state.currentData
      .filter(item => !this.state.anomalies.some(a => a.timestamp === item.timestamp))
      .map(item => ({
        x: new Date(item.timestamp),
        y: item.value
      }));
    
    // 准备异常数据点
    const anomalyData = this.state.anomalies
      .map(item => ({
        x: new Date(item.timestamp),
        y: item.value
      }));
    
    // 更新图表数据
    chart.data.datasets[0].data = normalData;
    chart.data.datasets[1].data = anomalyData;
    
    // 调整时间单位
    let timeUnit = 'day';
    if (this.state.currentTimeRange === 'day') {
      timeUnit = 'hour';
    } else if (this.state.currentTimeRange === 'year') {
      timeUnit = 'month';
    }
    
    chart.options.scales.x.time.unit = timeUnit;
    
    // 更新图表
    chart.update();
  },
  
  // 更新异常统计
  updateAnomalyStats: function() {
    const countElem = document.getElementById('anomaly-count');
    const percentElem = document.getElementById('anomaly-percentage');
    
    if (countElem) {
      countElem.textContent = this.state.anomalies.length;
    }
    
    if (percentElem && this.state.currentData.length > 0) {
      const percentage = (this.state.anomalies.length / this.state.currentData.length * 100).toFixed(2);
      percentElem.textContent = `${percentage}%`;
    }
  },
  
  // 生成预测数据
  generatePredictions: function() {
    if (!this.state.currentData || this.state.currentData.length < 10) {
      console.warn('数据点太少，无法生成可靠的预测');
      return;
    }
    
    // 在实际应用中，这里应该使用更复杂的预测算法
    // 现在我们使用简单的线性回归
    
    // 获取最后10个点
    const recentData = this.state.currentData.slice(-10);
    
    // 准备X和Y数据
    const xData = recentData.map((_, index) => index);
    const yData = recentData.map(item => item.value);
    
    // 计算线性回归参数 (y = mx + b)
    const n = xData.length;
    const sumX = xData.reduce((sum, x) => sum + x, 0);
    const sumY = yData.reduce((sum, y) => sum + y, 0);
    const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
    const sumXX = xData.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 生成预测点
    this.state.predictions = [];
    
    // 获取最后一个时间点
    const lastTimestamp = new Date(this.state.currentData[this.state.currentData.length - 1].timestamp);
    
    // 生成未来7个点的预测
    for (let i = 1; i <= 7; i++) {
      const predictedValue = slope * (xData.length + i - 1) + intercept;
      
      // 创建新的时间点
      const predictedTimestamp = new Date(lastTimestamp);
      
      // 根据时间范围调整预测间隔
      if (this.state.currentTimeRange === 'day') {
        predictedTimestamp.setHours(predictedTimestamp.getHours() + i);
      } else if (this.state.currentTimeRange === 'week') {
        predictedTimestamp.setDate(predictedTimestamp.getDate() + i);
      } else if (this.state.currentTimeRange === 'month') {
        predictedTimestamp.setDate(predictedTimestamp.getDate() + i * 3); // 每3天一个点
      } else if (this.state.currentTimeRange === 'year') {
        predictedTimestamp.setDate(predictedTimestamp.getDate() + i * 15); // 每15天一个点
      }
      
      this.state.predictions.push({
        timestamp: predictedTimestamp.toISOString(),
        value: predictedValue
      });
    }
    
    // 更新预测图表
    this.updatePredictionChart();
  },
  
  // 更新预测图表
  updatePredictionChart: function() {
    const chart = this.state.chartInstances.prediction;
    if (!chart) return;
    
    // 准备历史数据
    const historicalLabels = this.state.currentData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString('zh-CN');
    });
    
    const historicalData = this.state.currentData.map(item => item.value);
    
    // 准备预测数据
    const predictionLabels = this.state.predictions.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString('zh-CN');
    });
    
    const predictionData = new Array(historicalData.length).fill(null);
    this.state.predictions.forEach((item, index) => {
      predictionData.push(item.value);
    });
    
    // 更新图表数据
    chart.data.labels = [...historicalLabels, ...predictionLabels];
    chart.data.datasets[0].data = historicalData;
    chart.data.datasets[1].data = predictionData;
    
    // 更新图表
    chart.update();
    
    // 更新预测趋势文本
    this.updatePredictionTrend();
  },
  
  // 更新预测趋势文本
  updatePredictionTrend: function() {
    const trendElem = document.getElementById('prediction-trend');
    if (!trendElem || this.state.predictions.length === 0) return;
    
    // 确定趋势
    const firstValue = this.state.predictions[0].value;
    const lastValue = this.state.predictions[this.state.predictions.length - 1].value;
    const difference = lastValue - firstValue;
    
    let trendText = '';
    let trendClass = '';
    
    if (Math.abs(difference) < 1) {
      trendText = '平稳';
      trendClass = 'trend-stable';
    } else if (difference > 0) {
      trendText = `上升 (${difference.toFixed(2)})`;
      trendClass = 'trend-rising';
    } else {
      trendText = `下降 (${Math.abs(difference).toFixed(2)})`;
      trendClass = 'trend-falling';
    }
    
    // 更新UI
    trendElem.textContent = trendText;
    trendElem.className = `trend-indicator ${trendClass}`;
  },
  
  // 执行相关性分析
  performCorrelationAnalysis: function() {
    // 在实际应用中，这里应该分析多个传感器之间的相关性
    // 由于是模拟数据，我们将生成一些模拟的相关性结果
    
    const correlationTable = document.getElementById('correlation-table-body');
    if (!correlationTable) return;
    
    // 清空表格
    correlationTable.innerHTML = '';
    
    // 创建模拟相关性数据
    const mockCorrelations = [
      { sensor: '上游一号塔二号索', correlation: 0.92, significance: '高', status: 'positive' },
      { sensor: '上游一号塔八号索', correlation: 0.87, significance: '高', status: 'positive' },
      { sensor: '下游二号塔五号索', correlation: -0.64, significance: '中', status: 'negative' },
      { sensor: '上游二号塔四号索', correlation: 0.31, significance: '低', status: 'neutral' },
      { sensor: '下游一号塔七号索', correlation: 0.12, significance: '微弱', status: 'neutral' }
    ];
    
    // 添加到表格
    mockCorrelations.forEach(item => {
      const row = document.createElement('tr');
      
      // 设置相关性状态的样式
      let correlationClass = '';
      if (item.status === 'positive') {
        correlationClass = 'correlation-positive';
      } else if (item.status === 'negative') {
        correlationClass = 'correlation-negative';
      } else {
        correlationClass = 'correlation-neutral';
      }
      
      row.innerHTML = `
        <td>${item.sensor}</td>
        <td class="${correlationClass}">${item.correlation.toFixed(2)}</td>
        <td>${item.significance}</td>
      `;
      
      correlationTable.appendChild(row);
    });
  },
  
  // 显示分析结果
  showAnalysisResults: function() {
    // 显示结果容器
    const resultsContainer = document.getElementById('analysis-results-container');
    if (resultsContainer) {
      resultsContainer.style.display = 'block';
    }
    
    // 生成摘要
    this.generateAnalysisSummary();
  },
  
  // 生成分析摘要
  generateAnalysisSummary: function() {
    const summaryElem = document.getElementById('analysis-summary');
    if (!summaryElem) return;
    
    // 生成摘要文本
    let summary = '';
    
    // 异常数据摘要
    if (this.state.anomalies.length > 0) {
      const percentage = (this.state.anomalies.length / this.state.currentData.length * 100).toFixed(1);
      summary += `<p>检测到 <strong>${this.state.anomalies.length}</strong> 个异常数据点，占总数据的 <strong>${percentage}%</strong>。`;
      
      if (percentage > 10) {
        summary += ` 异常比例较高，建议检查传感器 <strong>${this.state.currentSensor}</strong> 的工作状态。</p>`;
      } else {
        summary += ` 异常比例在可接受范围内。</p>`;
      }
    } else {
      summary += `<p>未检测到异常数据点，传感器 <strong>${this.state.currentSensor}</strong> 工作正常。</p>`;
    }
    
    // 预测趋势摘要
    if (this.state.predictions.length > 0) {
      const firstValue = this.state.predictions[0].value;
      const lastValue = this.state.predictions[this.state.predictions.length - 1].value;
      const difference = lastValue - firstValue;
      
      if (Math.abs(difference) < 1) {
        summary += `<p>数据预测显示未来趋势平稳，无明显变化。</p>`;
      } else if (difference > 0) {
        summary += `<p>数据预测显示未来趋势上升，预计增加 <strong>${difference.toFixed(2)}</strong> 个单位。`;
        
        if (difference > 10) {
          summary += ` 增长幅度较大，建议密切监控。</p>`;
        } else {
          summary += ` 增长幅度在正常范围内。</p>`;
        }
      } else {
        summary += `<p>数据预测显示未来趋势下降，预计减少 <strong>${Math.abs(difference).toFixed(2)}</strong> 个单位。`;
        
        if (Math.abs(difference) > 10) {
          summary += ` 下降幅度较大，建议密切监控。</p>`;
        } else {
          summary += ` 下降幅度在正常范围内。</p>`;
        }
      }
    }
    
    // 更新摘要内容
    summaryElem.innerHTML = summary;
  },
  
  // 导出分析报告
  exportAnalysisReport: function() {
    if (!this.state.currentSensor || !this.state.lastAnalysisTime) {
      alert('请先运行分析');
      return;
    }
    
    // 显示导出进度指示器
    const exportIndicator = document.getElementById('export-indicator');
    if (exportIndicator) {
      exportIndicator.style.display = 'inline-block';
      exportIndicator.textContent = '导出中...';
    }
    
    // 模拟导出过程
    setTimeout(() => {
      // 格式化当前日期时间
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      // 创建文件名
      const fileName = `分析报告_${this.state.currentSensor}_${dateStr}.pdf`;
      
      // 模拟文件下载
      if (exportIndicator) {
        exportIndicator.textContent = `报告已导出: ${fileName}`;
      }
      
      // 3秒后隐藏导出指示器
      setTimeout(() => {
        if (exportIndicator) {
          exportIndicator.style.display = 'none';
        }
      }, 3000);
      
      console.log(`已导出分析报告: ${fileName}`);
    }, 1500);
  },
  
  // 生成模拟数据
  generateMockData: function() {
    const result = [];
    const now = new Date();
    let timeRange, interval, pointCount;
    
    // 根据选定的时间范围确定数据点数量和间隔
    switch (this.state.currentTimeRange) {
      case 'day':
        timeRange = 24 * 60 * 60 * 1000; // 24小时
        interval = 30 * 60 * 1000; // 30分钟
        pointCount = 48; // 每30分钟一个点
        break;
      case 'week':
        timeRange = 7 * 24 * 60 * 60 * 1000; // 7天
        interval = 4 * 60 * 60 * 1000; // 4小时
        pointCount = 42; // 每4小时一个点
        break;
      case 'month':
        timeRange = 30 * 24 * 60 * 60 * 1000; // 30天
        interval = 12 * 60 * 60 * 1000; // 12小时
        pointCount = 60; // 每12小时一个点
        break;
      case 'year':
        timeRange = 365 * 24 * 60 * 60 * 1000; // 365天
        interval = 7 * 24 * 60 * 60 * 1000; // 7天
        pointCount = 52; // 每周一个点
        break;
      default:
        timeRange = 7 * 24 * 60 * 60 * 1000; // 默认7天
        interval = 4 * 60 * 60 * 1000; // 4小时
        pointCount = 42; // 每4小时一个点
    }
    
    // 数据基础值，根据传感器ID生成一个稳定的基础值
    let baseValue;
    if (this.state.currentSensor && this.state.currentSensor.includes('C')) {
      baseValue = 200 + parseInt(this.state.currentSensor.replace(/\D/g, '')) * 5;
    } else {
      baseValue = 200;
    }
    
    // 生成时间点
    for (let i = 0; i < pointCount; i++) {
      const timestamp = new Date(now.getTime() - (pointCount - i) * interval);
      
      // 生成数值，添加一些随机性和周期性变化
      let value = baseValue;
      
      // 添加随机波动
      value += (Math.random() - 0.5) * 20;
      
      // 添加周期性变化
      value += Math.sin(i / 5) * 15;
      
      // 添加轻微的上升趋势
      value += i * 0.1;
      
      // 偶尔添加异常点
      if (Math.random() > 0.95) {
        value += (Math.random() > 0.5 ? 1 : -1) * Math.random() * 50;
      }
      
      result.push({
        timestamp: timestamp.toISOString(),
        value: parseFloat(value.toFixed(2))
      });
    }
    
    return result;
  }
};

// 初始化高级数据分析模块
function initAdvancedAnalysis() {
  AdvancedAnalysis.init();
} 