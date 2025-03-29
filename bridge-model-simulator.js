/**
 * 黑龙江大桥监测系统 - 传感器数据模拟器
 * 这个文件用于生成模拟的传感器数据，并提供接口给主程序使用
 */

// 传感器数据模拟器
const SensorDataSimulator = {
  // 传感器数据
  sensorData: [
    {
      id: 'S-001',
      location: '桥梁北侧入口',
      status: 'normal',
      type: '温度传感器',
      data: {
        temperature: 23.5,
        vibration: 1.2,
        tilt: 0.3
      },
      position: { x: -180, y: 10, section: '北侧引桥' },
      historyData: []
    },
    {
      id: 'S-002',
      location: '桥梁中部西侧',
      status: 'normal',
      type: '振动传感器',
      data: {
        temperature: 24.1,
        vibration: 0.8,
        tilt: 0.2
      },
      position: { x: -100, y: 10, section: '主桥北段' },
      historyData: []
    },
    {
      id: 'S-103',
      location: '主桥中部支架',
      status: 'alert',
      type: '综合传感器',
      data: {
        temperature: 25.3,
        vibration: 8.7,
        tilt: 0.9
      },
      position: { x: 0, y: 0, section: '主桥中央' },
      historyData: []
    },
    {
      id: 'S-004',
      location: '桥梁南侧出口',
      status: 'normal',
      type: '温度传感器',
      data: {
        temperature: 23.8,
        vibration: 1.1,
        tilt: 0.4
      },
      position: { x: 180, y: 10, section: '南侧引桥' },
      historyData: []
    },
    {
      id: 'S-087',
      location: '桥面东侧',
      status: 'warning',
      type: '倾斜传感器',
      data: {
        temperature: 24.5,
        vibration: 1.8,
        tilt: 2.3
      },
      position: { x: 100, y: 10, section: '主桥南段' },
      historyData: []
    },
    {
      id: 'S-T12',
      location: '北塔基础',
      status: 'normal',
      type: '应力传感器',
      data: {
        temperature: 22.1,
        vibration: 0.9,
        tilt: 0.2,
        stress: 45.2
      },
      position: { x: -80, y: -50, section: '北塔' },
      historyData: []
    },
    {
      id: 'S-T24',
      location: '南塔基础',
      status: 'normal',
      type: '应力传感器',
      data: {
        temperature: 22.3,
        vibration: 1.0,
        tilt: 0.2,
        stress: 44.8
      },
      position: { x: 80, y: -50, section: '南塔' },
      historyData: []
    },
    {
      id: 'S-C01',
      location: '北塔拉索',
      status: 'normal',
      type: '拉索监测器',
      data: {
        temperature: 21.2,
        vibration: 2.1,
        tension: 320.5
      },
      position: { x: -50, y: 30, section: '北塔拉索' },
      historyData: []
    },
    {
      id: 'S-C02',
      location: '南塔拉索',
      status: 'warning',
      type: '拉索监测器',
      data: {
        temperature: 21.5,
        vibration: 3.2,
        tension: 290.8
      },
      position: { x: 50, y: 30, section: '南塔拉索' },
      historyData: []
    },
    {
      id: 'S-D01',
      location: '桥面中央',
      status: 'normal',
      type: '挠度传感器',
      data: {
        temperature: 24.8,
        deflection: 12.3,
        vibration: 1.1
      },
      position: { x: 0, y: 10, section: '桥面中央' },
      historyData: []
    }
  ],
  
  // 生成历史数据
  generateHistoryData: function(baseTemp, baseVib, baseTilt, status) {
    const historyData = [];
    const now = new Date();
    
    // 生成24小时的历史数据
    for (let i = 24; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 3600000);
      const hour = date.getHours();
      
      // 根据状态生成不同的波动范围
      let tempRange, vibRange, tiltRange;
      switch (status) {
        case 'alert':
          tempRange = 2;
          vibRange = 2;
          tiltRange = 0.5;
          break;
        case 'warning':
          tempRange = 1;
          vibRange = 1;
          tiltRange = 0.3;
          break;
        default:
          tempRange = 0.5;
          vibRange = 0.3;
          tiltRange = 0.1;
      }
      
      // 添加时间变化
      const timeFactor = Math.sin(hour * Math.PI / 12) * 0.5 + 0.5;
      
      historyData.push({
        date: date.toLocaleTimeString(),
        timestamp: date.getTime(),
        temperature: baseTemp + (Math.random() * tempRange - tempRange/2) + timeFactor,
        vibration: baseVib + (Math.random() * vibRange - vibRange/2),
        tilt: baseTilt + (Math.random() * tiltRange - tiltRange/2),
        anomalyType: this.generateRandomAnomaly(status)
      });
    }
    
    return historyData;
  },

  // 生成随机异常类型
  generateRandomAnomaly: function(status) {
    if (status === 'normal') return 'none';
    
    const anomalyTypes = [
      'none',
      'single_point',
      'multi_point',
      'gain',
      'drift',
      'complex'
    ];
    
    const weights = {
      'warning': [0.7, 0.15, 0.1, 0.025, 0.025, 0],
      'alert': [0.3, 0.2, 0.2, 0.15, 0.1, 0.05]
    };
    
    const statusWeights = weights[status] || weights['warning'];
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < statusWeights.length; i++) {
      cumulativeWeight += statusWeights[i];
      if (random < cumulativeWeight) {
        return anomalyTypes[i];
      }
    }
    
    return 'none';
  },
  
  // 更新传感器数据
  updateSensorData: function() {
    this.sensorData.forEach(sensor => {
      // 根据状态生成不同的波动
      let tempRange, vibRange, tiltRange;
      switch (sensor.status) {
        case 'alert':
          tempRange = 2;
          vibRange = 2;
          tiltRange = 0.5;
          break;
        case 'warning':
          tempRange = 1;
          vibRange = 1;
          tiltRange = 0.3;
          break;
        default:
          tempRange = 0.5;
          vibRange = 0.3;
          tiltRange = 0.1;
      }
      
      // 更新基础数据
      sensor.data.temperature += (Math.random() * tempRange - tempRange/2);
      sensor.data.vibration += (Math.random() * vibRange - vibRange/2);
      
      if (sensor.data.tilt !== undefined) {
        sensor.data.tilt += (Math.random() * tiltRange - tiltRange/2);
      }
      
      // 更新特殊数据
      if (sensor.data.stress !== undefined) {
        sensor.data.stress += (Math.random() * 2 - 1);
      }
      
      if (sensor.data.tension !== undefined) {
        sensor.data.tension += (Math.random() * 5 - 2.5);
      }
      
      if (sensor.data.deflection !== undefined) {
        sensor.data.deflection += (Math.random() * 0.5 - 0.25);
      }
      
      // 更新状态
      if (sensor.data.vibration > 5 || (sensor.data.tilt !== undefined && sensor.data.tilt > 1.5)) {
        sensor.status = 'alert';
      } else if (sensor.data.vibration > 3 || (sensor.data.tilt !== undefined && sensor.data.tilt > 1)) {
        sensor.status = 'warning';
      } else {
        sensor.status = 'normal';
      }
      
      // 生成新的历史数据点
      const now = new Date();
      sensor.historyData.push({
        date: now.toLocaleTimeString(),
        timestamp: now.getTime(),
        temperature: sensor.data.temperature,
        vibration: sensor.data.vibration,
        tilt: sensor.data.tilt,
        stress: sensor.data.stress,
        tension: sensor.data.tension,
        deflection: sensor.data.deflection,
        anomalyType: this.generateRandomAnomaly(sensor.status)
      });
      
      // 保持历史数据在24小时内
      if (sensor.historyData.length > 24) {
        sensor.historyData.shift();
      }
    });
  },

  // 生成大量历史数据用于分析
  generateExtendedHistoryData: function(sensorId, days = 30) {
    const sensor = this.getSensorById(sensorId);
    if (!sensor) return [];
    
    const historyData = [];
    const now = new Date();
    const baseValues = {
      temperature: sensor.data.temperature,
      vibration: sensor.data.vibration,
      tilt: sensor.data.tilt,
      stress: sensor.data.stress,
      tension: sensor.data.tension,
      deflection: sensor.data.deflection
    };
    
    // 每个异常类型的特征
    const anomalyPatterns = {
      single_point: (i) => Math.random() < 0.05, // 5%几率出现单点异常
      multi_point: (i) => i % 24 < 3, // 每天前3小时出现异常
      gain: (i) => i > days * 24 * 0.7, // 最后30%的时间出现增益异常
      drift: (i) => i / (days * 24), // 线性漂移
      complex: (i) => Math.random() < 0.1 || i % 24 < 2 // 复杂模式
    };
    
    // 为不同传感器设置不同的异常模式
    let anomalyType = 'none';
    if (sensor.id === 'S-103') anomalyType = 'multi_point';
    else if (sensor.id === 'S-087') anomalyType = 'drift';
    else if (sensor.id === 'S-C02') anomalyType = 'gain';
    else if (Math.random() < 0.3) anomalyType = 'single_point';
    
    // 生成数据
    for (let i = days * 24; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 3600000);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      // 基础波动
      const timeFactor = Math.sin(hour * Math.PI / 12) * 0.5 + 0.5;
      const weekFactor = Math.sin(dayOfWeek * Math.PI / 7) * 0.3;
      
      // 是否应用异常模式
      const applyAnomaly = anomalyType !== 'none' && anomalyPatterns[anomalyType](i);
      
      // 计算数据点
      const dataPoint = {
        date: date.toLocaleString(),
        timestamp: date.getTime(),
        temperature: baseValues.temperature + (Math.random() * 1 - 0.5) + timeFactor,
        anomalyType: applyAnomaly ? anomalyType : 'none'
      };
      
      // 添加震动数据
      if (baseValues.vibration !== undefined) {
        dataPoint.vibration = baseValues.vibration + (Math.random() * 0.6 - 0.3) + weekFactor;
        
        // 应用异常
        if (applyAnomaly) {
          switch (anomalyType) {
            case 'single_point':
              dataPoint.vibration *= 3 + Math.random() * 2;
              break;
            case 'multi_point':
              dataPoint.vibration *= 2.5 + Math.random();
              break;
            case 'gain':
              dataPoint.vibration *= 1.5;
              break;
            case 'drift':
              dataPoint.vibration += anomalyPatterns.drift(i) * 5;
              break;
            case 'complex':
              dataPoint.vibration *= 2 + Math.sin(i * 0.1) + Math.random();
              break;
          }
        }
      }
      
      // 添加倾斜数据
      if (baseValues.tilt !== undefined) {
        dataPoint.tilt = baseValues.tilt + (Math.random() * 0.2 - 0.1) + weekFactor * 0.5;
        
        // 应用异常
        if (applyAnomaly) {
          switch (anomalyType) {
            case 'single_point':
              dataPoint.tilt *= 2 + Math.random();
              break;
            case 'multi_point':
              dataPoint.tilt *= 1.5 + Math.random() * 0.5;
              break;
            case 'gain':
              dataPoint.tilt *= 1.3;
              break;
            case 'drift':
              dataPoint.tilt += anomalyPatterns.drift(i) * 2;
              break;
            case 'complex':
              dataPoint.tilt *= 1.5 + Math.sin(i * 0.2) + Math.random() * 0.5;
              break;
          }
        }
      }
      
      // 添加其他特殊数据
      if (baseValues.stress !== undefined) {
        dataPoint.stress = baseValues.stress + (Math.random() * 3 - 1.5) + weekFactor * 2;
        if (applyAnomaly) dataPoint.stress *= 1.2;
      }
      
      if (baseValues.tension !== undefined) {
        dataPoint.tension = baseValues.tension + (Math.random() * 10 - 5) + timeFactor * 5;
        if (applyAnomaly) dataPoint.tension *= 0.85; // 拉索异常通常是张力下降
      }
      
      if (baseValues.deflection !== undefined) {
        dataPoint.deflection = baseValues.deflection + (Math.random() * 1 - 0.5) + timeFactor * 2;
        if (applyAnomaly) dataPoint.deflection *= 1.25;
      }
      
      historyData.push(dataPoint);
    }
    
    return historyData;
  },
  
  // 获取传感器数据
  getSensorData: function() {
    return this.sensorData;
  },
  
  // 根据ID获取传感器
  getSensorById: function(id) {
    return this.sensorData.find(sensor => sensor.id === id);
  },

  // 根据部位获取传感器
  getSensorsBySection: function(section) {
    return this.sensorData.filter(sensor => sensor.position.section === section);
  },
  
  // 获取传感器状态统计
  getSensorStatusStats: function() {
    const stats = {
      normal: 0,
      warning: 0,
      alert: 0,
      offline: 0
    };
    
    this.sensorData.forEach(sensor => {
      stats[sensor.status]++;
    });
    
    return stats;
  },

  // 获取传感器异常统计
  getAnomalyStats: function() {
    const anomalyStats = {
      none: 0,
      single_point: 0,
      multi_point: 0,
      gain: 0,
      drift: 0,
      complex: 0
    };
    
    // 统计当前异常
    this.sensorData.forEach(sensor => {
      if (sensor.historyData && sensor.historyData.length > 0) {
        const latestData = sensor.historyData[sensor.historyData.length - 1];
        anomalyStats[latestData.anomalyType || 'none']++;
      }
    });
    
    return anomalyStats;
  },
  
  // 分析传感器数据
  analyzeSensorData: function(sensorId, days = 7) {
    const sensor = this.getSensorById(sensorId);
    if (!sensor) return null;
    
    // 如果没有足够的历史数据，生成扩展历史数据
    let historyData = sensor.historyData;
    if (historyData.length < days * 24) {
      historyData = this.generateExtendedHistoryData(sensorId, days);
    }
    
    // 计算基本统计量
    const stats = this.calculateBasicStats(historyData);
    
    // 检测异常
    const anomalies = this.detectAnomalies(historyData, stats);
    
    // 生成健康评分
    const healthScore = this.calculateHealthScore(anomalies);
    
    return {
      sensorInfo: {
        id: sensor.id,
        location: sensor.location,
        type: sensor.type
      },
      stats: stats,
      anomalies: anomalies,
      healthScore: healthScore
    };
  },
  
  // 计算基本统计量
  calculateBasicStats: function(data) {
    const stats = {};
    const metrics = ['temperature', 'vibration', 'tilt', 'stress', 'tension', 'deflection'];
    
    metrics.forEach(metric => {
      // 检查数据中是否有该指标
      if (data[0] && data[0][metric] !== undefined) {
        const values = data.map(d => d[metric]).filter(v => v !== undefined);
        
        if (values.length > 0) {
          // 计算平均值
          const sum = values.reduce((a, b) => a + b, 0);
          const mean = sum / values.length;
          
          // 计算标准差
          const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          // 计算最大最小值
          const min = Math.min(...values);
          const max = Math.max(...values);
          
          stats[metric] = {
            mean: mean,
            stdDev: stdDev,
            min: min,
            max: max,
            range: max - min,
            count: values.length
          };
        }
      }
    });
    
    return stats;
  },
  
  // 检测异常
  detectAnomalies: function(data, stats) {
    const anomalies = {
      single_point: [],
      multi_point: [],
      gain: [],
      drift: [],
      complex: []
    };
    
    // 遍历数据中的每个指标
    Object.keys(stats).forEach(metric => {
      const values = data.map(d => d[metric]).filter(v => v !== undefined);
      const { mean, stdDev } = stats[metric];
      
      // 单点异常: 超过3个标准差
      values.forEach((value, i) => {
        if (Math.abs(value - mean) > stdDev * 3) {
          anomalies.single_point.push({
            metric: metric,
            index: i,
            value: value,
            expected: mean,
            deviation: (value - mean) / stdDev
          });
        }
      });
      
      // 多点异常: 连续3个点超过2个标准差
      for (let i = 0; i < values.length - 2; i++) {
        if (Math.abs(values[i] - mean) > stdDev * 2 &&
            Math.abs(values[i+1] - mean) > stdDev * 2 &&
            Math.abs(values[i+2] - mean) > stdDev * 2) {
          anomalies.multi_point.push({
            metric: metric,
            startIndex: i,
            endIndex: i + 2,
            values: [values[i], values[i+1], values[i+2]],
            expected: mean
          });
          i += 2; // 跳过已检测的点
        }
      }
      
      // 数据增益异常: 一组数据显著高于平均值
      const halfLength = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, halfLength);
      const secondHalf = values.slice(halfLength);
      
      const firstHalfMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (Math.abs(secondHalfMean - firstHalfMean) > stdDev * 1.5) {
        anomalies.gain.push({
          metric: metric,
          firstHalfMean: firstHalfMean,
          secondHalfMean: secondHalfMean,
          difference: secondHalfMean - firstHalfMean,
          percentChange: ((secondHalfMean - firstHalfMean) / firstHalfMean) * 100
        });
      }
      
      // 数据漂移异常: 使用线性回归检测趋势
      const linearRegression = this.calculateLinearRegression(
        values.map((v, i) => [i, v])
      );
      
      if (Math.abs(linearRegression.slope) > stdDev * 0.1) {
        anomalies.drift.push({
          metric: metric,
          slope: linearRegression.slope,
          intercept: linearRegression.intercept,
          r2: linearRegression.r2
        });
      }
    });
    
    // 复杂异常: 多种类型异常同时存在
    if (Object.values(anomalies).flat().length >= 3) {
      anomalies.complex.push({
        description: "多种异常模式同时存在",
        anomalyCount: Object.values(anomalies).flat().length
      });
    }
    
    return anomalies;
  },
  
  // 计算线性回归
  calculateLinearRegression: function(data) {
    const n = data.length;
    
    // 计算平均值
    let sumX = 0;
    let sumY = 0;
    data.forEach(([x, y]) => {
      sumX += x;
      sumY += y;
    });
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    // 计算回归系数
    let numerator = 0;
    let denominator = 0;
    data.forEach(([x, y]) => {
      numerator += (x - meanX) * (y - meanY);
      denominator += Math.pow(x - meanX, 2);
    });
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;
    
    // 计算R平方
    let SST = 0;
    let SSE = 0;
    data.forEach(([x, y]) => {
      SST += Math.pow(y - meanY, 2);
      const prediction = slope * x + intercept;
      SSE += Math.pow(y - prediction, 2);
    });
    
    const r2 = 1 - (SSE / SST);
    
    return { slope, intercept, r2 };
  },
  
  // 计算健康评分
  calculateHealthScore: function(anomalies) {
    // 基础评分为100
    let score = 100;
    
    // 根据异常类型和严重程度扣分
    if (anomalies.single_point.length > 0) {
      score -= Math.min(15, anomalies.single_point.length * 3);
    }
    
    if (anomalies.multi_point.length > 0) {
      score -= Math.min(25, anomalies.multi_point.length * 7);
    }
    
    if (anomalies.gain.length > 0) {
      const maxPercentChange = Math.max(...anomalies.gain.map(a => Math.abs(a.percentChange)));
      score -= Math.min(30, maxPercentChange * 0.5);
    }
    
    if (anomalies.drift.length > 0) {
      const maxSlope = Math.max(...anomalies.drift.map(a => Math.abs(a.slope)));
      score -= Math.min(20, maxSlope * 10);
    }
    
    if (anomalies.complex.length > 0) {
      score -= 35;
    }
    
    // 确保分数在0-100之间
    return Math.max(0, Math.min(100, Math.round(score)));
  },
  
  // 初始化模拟器
  init: function() {
    console.log('初始化传感器数据模拟器...');
    
    // 确保历史数据已生成
    this.sensorData.forEach(sensor => {
      if (!sensor.historyData || sensor.historyData.length === 0) {
        sensor.historyData = this.generateHistoryData(
          sensor.data.temperature,
          sensor.data.vibration,
          sensor.data.tilt,
          sensor.status
        );
      }
    });
    
    // 设置定时更新
    setInterval(() => this.updateSensorData(), 60000); // 每分钟更新一次
    
    console.log('传感器数据模拟器初始化完成');
  }
};

// 全局导出
window.SensorDataSimulator = SensorDataSimulator; 