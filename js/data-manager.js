/**
 * 黑龙江大桥监测系统 - 数据导入导出模块
 * 支持多种格式的数据处理和文件管理
 */

// 数据管理模块
const DataManager = {
  // 配置选项
  config: {
    // 支持的文件类型
    supportedFormats: {
      excel: ['.xlsx', '.xls'],
      csv: ['.csv'],
      json: ['.json'],
      text: ['.txt']
    },
    
    // 数据批处理大小
    batchSize: 1000,
    
    // 导出默认设置
    defaultExportSettings: {
      format: 'xlsx',
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  
  // 状态记录
  state: {
    isProcessing: false,
    lastImportedFile: null,
    lastExportedFile: null,
    importProgress: 0,
    exportProgress: 0,
    processedData: null
  },
  
  // 初始化数据管理模块
  init: function() {
    console.log('初始化数据管理模块...');
    
    try {
      // 设置导入文件事件
      this.setupImportEvents();
      
      // 设置导出设置事件
      this.setupExportEvents();
      
      // 初始化文件拖放功能
      this.setupFileDrop();
      
      console.log('数据管理模块初始化完成');
    } catch (error) {
      console.error('数据管理模块初始化失败:', error);
    }
  },
  
  // 设置导入文件事件
  setupImportEvents: function() {
    // 文件选择器变更事件
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          this.displaySelectedFile(file);
        }
      });
    }
    
    // 导入按钮点击事件
    const importBtn = document.getElementById('start-import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('import-file-input');
        if (fileInput.files.length === 0) {
          alert('请先选择要导入的文件');
          return;
        }
        
        const file = fileInput.files[0];
        this.importFile(file);
      });
    }
    
    // 清除按钮点击事件
    const clearBtn = document.getElementById('clear-import-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('import-file-input');
        fileInput.value = '';
        this.displaySelectedFile(null);
      });
    }
  },
  
  // 设置导出设置事件
  setupExportEvents: function() {
    // 导出按钮点击事件
    const exportBtn = document.getElementById('start-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }
    
    // 格式选择事件
    const formatSelect = document.getElementById('export-format');
    if (formatSelect) {
      formatSelect.addEventListener('change', () => {
        this.updateExportOptions();
      });
    }
    
    // 初始设置
    this.updateExportOptions();
  },
  
  // 根据导出格式更新选项
  updateExportOptions: function() {
    const formatSelect = document.getElementById('export-format');
    if (!formatSelect) return;
    
    const selectedFormat = formatSelect.value;
    const optionsContainer = document.getElementById('format-specific-options');
    if (!optionsContainer) return;
    
    // 清空现有选项
    optionsContainer.innerHTML = '';
    
    // 根据不同格式添加特定选项
    if (selectedFormat === 'xlsx' || selectedFormat === 'csv') {
      // Excel/CSV 特有选项
      optionsContainer.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="include-headers" checked>
            包含表头
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="include-metadata" checked>
            包含元数据
          </label>
        </div>
      `;
    } else if (selectedFormat === 'json') {
      // JSON 特有选项
      optionsContainer.innerHTML = `
        <div class="form-group">
          <label>JSON格式</label>
          <select id="json-format" class="form-control form-control-sm">
            <option value="pretty">美化格式</option>
            <option value="compact">紧凑格式</option>
          </select>
        </div>
      `;
    }
  },
  
  // 设置文件拖放功能
  setupFileDrop: function() {
    const dropArea = document.getElementById('file-drop-area');
    if (!dropArea) return;
    
    // 阻止默认行为以允许拖放
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });
    
    // 高亮显示拖放区域
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('highlight');
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('highlight');
      }, false);
    });
    
    // 处理拖放的文件
    dropArea.addEventListener('drop', e => {
      const file = e.dataTransfer.files[0]; // 只处理第一个文件
      if (file) {
        // 更新文件输入控件
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) {
          // 注意：由于安全限制，不能直接设置File对象到input[type=file]
          // 但可以显示文件信息并在后续处理中使用这个file对象
          this.displaySelectedFile(file);
          this.state.lastImportedFile = file;
        }
      }
    }, false);
  },
  
  // 显示选择的文件信息
  displaySelectedFile: function(file) {
    const fileInfo = document.getElementById('selected-file-info');
    if (!fileInfo) return;
    
    if (!file) {
      fileInfo.innerHTML = '<span class="text-muted">未选择文件</span>';
      return;
    }
    
    // 获取文件扩展名
    const extension = file.name.split('.').pop().toLowerCase();
    
    // 确定文件类型图标
    let fileIcon = 'file-text';
    let fileTypeClass = 'text-secondary';
    
    if (this.config.supportedFormats.excel.includes(`.${extension}`)) {
      fileIcon = 'file-excel';
      fileTypeClass = 'text-success';
    } else if (this.config.supportedFormats.csv.includes(`.${extension}`)) {
      fileIcon = 'file-text';
      fileTypeClass = 'text-primary';
    } else if (this.config.supportedFormats.json.includes(`.${extension}`)) {
      fileIcon = 'file-code';
      fileTypeClass = 'text-warning';
    }
    
    // 格式化文件大小
    const sizeInKB = file.size / 1024;
    let formattedSize = '';
    
    if (sizeInKB < 1024) {
      formattedSize = sizeInKB.toFixed(2) + ' KB';
    } else {
      formattedSize = (sizeInKB / 1024).toFixed(2) + ' MB';
    }
    
    // 显示文件信息
    fileInfo.innerHTML = `
      <div class="selected-file">
        <span class="file-icon ${fileTypeClass}">
          <i class="icon-${fileIcon}"></i>
        </span>
        <div class="file-details">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">
            ${formattedSize} | ${extension.toUpperCase()} | 最后修改: ${new Date(file.lastModified).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    `;
    
    // 保存到状态
    this.state.lastImportedFile = file;
  },
  
  // 导入文件
  importFile: function(file) {
    if (this.state.isProcessing) {
      alert('有正在进行的操作，请等待完成');
      return;
    }
    
    // 获取文件扩展名
    const extension = file.name.split('.').pop().toLowerCase();
    
    // 验证文件类型
    let isSupported = false;
    for (const format in this.config.supportedFormats) {
      if (this.config.supportedFormats[format].includes(`.${extension}`)) {
        isSupported = true;
        break;
      }
    }
    
    if (!isSupported) {
      alert(`不支持的文件类型: ${extension}。请使用Excel、CSV、JSON或文本文件。`);
      return;
    }
    
    // 获取导入选项
    const validateData = document.getElementById('validate-data').checked;
    const replaceExisting = document.getElementById('replace-existing').checked;
    
    // 开始导入
    this.startImport(file, { validateData, replaceExisting });
  },
  
  // 开始导入过程
  startImport: function(file, options) {
    // 设置状态
    this.state.isProcessing = true;
    this.state.importProgress = 0;
    
    // 显示进度条
    const progressBar = document.getElementById('import-progress-bar');
    const progressContainer = document.getElementById('import-progress-container');
    const progressText = document.getElementById('import-progress-text');
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '准备导入...';
    
    // 根据文件类型调用不同的解析器
    const extension = file.name.split('.').pop().toLowerCase();
    
    // 模拟导入过程
    let processFunction;
    if (this.config.supportedFormats.excel.includes(`.${extension}`)) {
      processFunction = this.processExcelFile;
    } else if (this.config.supportedFormats.csv.includes(`.${extension}`)) {
      processFunction = this.processCSVFile;
    } else if (this.config.supportedFormats.json.includes(`.${extension}`)) {
      processFunction = this.processJSONFile;
    } else {
      processFunction = this.processTextFile;
    }
    
    // 调用处理函数
    setTimeout(() => {
      processFunction.call(this, file, options);
    }, 500);
  },
  
  // 更新导入进度
  updateImportProgress: function(progress, statusText) {
    this.state.importProgress = progress;
    
    const progressBar = document.getElementById('import-progress-bar');
    const progressText = document.getElementById('import-progress-text');
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = statusText || `已完成 ${progress}%`;
    
    // 检查是否完成
    if (progress >= 100) {
      setTimeout(() => {
        this.finalizeImport();
      }, 500);
    }
  },
  
  // 完成导入过程
  finalizeImport: function() {
    // 恢复状态
    this.state.isProcessing = false;
    
    // 更新界面
    const progressContainer = document.getElementById('import-progress-container');
    const successMessage = document.getElementById('import-success-message');
    
    if (progressContainer) progressContainer.style.display = 'none';
    if (successMessage) {
      successMessage.style.display = 'block';
      successMessage.querySelector('.imported-filename').textContent = this.state.lastImportedFile.name;
      
      // 3秒后隐藏成功消息
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);
    }
  },
  
  // 处理Excel文件
  processExcelFile: function(file, options) {
    console.log(`处理Excel文件: ${file.name}`);
    console.log('选项:', options);
    
    // 模拟Excel处理过程
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      this.updateImportProgress(progress, `解析Excel文件... ${progress}%`);
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
    
    // 模拟处理结果
    this.state.processedData = {
      type: 'excel',
      filename: file.name,
      rowCount: 1250,
      processed: true,
      timestamp: new Date().toISOString()
    };
  },
  
  // 处理CSV文件
  processCSVFile: function(file, options) {
    console.log(`处理CSV文件: ${file.name}`);
    console.log('选项:', options);
    
    // 模拟CSV处理过程
    let progress = 0;
    const interval = setInterval(() => {
      progress += 8;
      this.updateImportProgress(progress, `解析CSV文件... ${progress}%`);
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
    
    // 模拟处理结果
    this.state.processedData = {
      type: 'csv',
      filename: file.name,
      rowCount: 850,
      processed: true,
      timestamp: new Date().toISOString()
    };
  },
  
  // 处理JSON文件
  processJSONFile: function(file, options) {
    console.log(`处理JSON文件: ${file.name}`);
    console.log('选项:', options);
    
    // 模拟读取JSON文件
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // 尝试解析JSON
        const jsonData = JSON.parse(e.target.result);
        
        // 模拟处理
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          this.updateImportProgress(progress, `处理JSON数据... ${progress}%`);
          
          if (progress >= 100) {
            clearInterval(interval);
            
            // 设置处理结果
            this.state.processedData = {
              type: 'json',
              filename: file.name,
              rowCount: Array.isArray(jsonData) ? jsonData.length : 1,
              processed: true,
              timestamp: new Date().toISOString()
            };
          }
        }, 200);
      } catch (error) {
        console.error('JSON解析错误:', error);
        alert('JSON文件格式错误，无法解析');
        this.state.isProcessing = false;
        
        // 隐藏进度条
        const progressContainer = document.getElementById('import-progress-container');
        if (progressContainer) progressContainer.style.display = 'none';
      }
    };
    
    reader.onerror = () => {
      console.error('文件读取错误');
      alert('文件读取错误');
      this.state.isProcessing = false;
      
      // 隐藏进度条
      const progressContainer = document.getElementById('import-progress-container');
      if (progressContainer) progressContainer.style.display = 'none';
    };
    
    // 开始读取文件
    this.updateImportProgress(5, '读取文件...');
    reader.readAsText(file);
  },
  
  // 处理文本文件
  processTextFile: function(file, options) {
    console.log(`处理文本文件: ${file.name}`);
    console.log('选项:', options);
    
    // 读取文本文件
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      
      // 简单的行分割
      const lines = text.split('\n');
      
      // 模拟处理
      let progress = 0;
      const interval = setInterval(() => {
        progress += 12;
        this.updateImportProgress(progress, `处理文本数据... ${progress}%`);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // 设置处理结果
          this.state.processedData = {
            type: 'text',
            filename: file.name,
            rowCount: lines.length,
            processed: true,
            timestamp: new Date().toISOString()
          };
        }
      }, 200);
    };
    
    reader.onerror = () => {
      console.error('文件读取错误');
      alert('文件读取错误');
      this.state.isProcessing = false;
      
      // 隐藏进度条
      const progressContainer = document.getElementById('import-progress-container');
      if (progressContainer) progressContainer.style.display = 'none';
    };
    
    // 开始读取文件
    this.updateImportProgress(5, '读取文件...');
    reader.readAsText(file);
  },
  
  // 导出数据
  exportData: function() {
    if (this.state.isProcessing) {
      alert('有正在进行的操作，请等待完成');
      return;
    }
    
    // 获取导出设置
    const format = document.getElementById('export-format').value;
    const sensorSelect = document.getElementById('export-sensor-select').value;
    const dateRangeType = document.getElementById('export-date-range').value;
    
    // 验证选择
    if (!sensorSelect) {
      alert('请选择要导出的传感器');
      return;
    }
    
    // 日期范围
    let startDate, endDate;
    
    if (dateRangeType === 'custom') {
      startDate = document.getElementById('export-start-date').value;
      endDate = document.getElementById('export-end-date').value;
      
      if (!startDate || !endDate) {
        alert('请选择完整的日期范围');
        return;
      }
    } else {
      const today = new Date();
      endDate = today.toISOString().split('T')[0];
      
      switch(dateRangeType) {
        case 'last7':
          startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
          break;
        case 'last30':
          startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
          break;
        case 'last90':
          startDate = new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
          break;
        case 'all':
          startDate = '2023-01-01';
          break;
      }
    }
    
    // 特定格式选项
    let formatOptions = {};
    
    if (format === 'xlsx' || format === 'csv') {
      formatOptions.includeHeaders = document.getElementById('include-headers')?.checked ?? true;
      formatOptions.includeMetadata = document.getElementById('include-metadata')?.checked ?? true;
    } else if (format === 'json') {
      formatOptions.jsonFormat = document.getElementById('json-format')?.value ?? 'pretty';
    }
    
    // 开始导出
    this.startExport({
      format,
      sensorId: sensorSelect,
      dateRange: { start: startDate, end: endDate },
      formatOptions
    });
  },
  
  // 开始导出过程
  startExport: function(options) {
    // 设置状态
    this.state.isProcessing = true;
    this.state.exportProgress = 0;
    
    // 显示进度条
    const progressBar = document.getElementById('export-progress-bar');
    const progressContainer = document.getElementById('export-progress-container');
    const progressText = document.getElementById('export-progress-text');
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '准备导出...';
    
    console.log('导出选项:', options);
    
    // 模拟数据提取过程
    setTimeout(() => {
      this.updateExportProgress(15, '查询数据...');
      
      // 模拟数据处理过程
      setTimeout(() => {
        this.updateExportProgress(45, '处理数据...');
        
        // 模拟文件创建过程
        setTimeout(() => {
          this.updateExportProgress(75, `创建${options.format.toUpperCase()}文件...`);
          
          // 完成导出
          setTimeout(() => {
            this.updateExportProgress(100, '导出完成');
            this.simulateFileDownload(options);
          }, 500);
        }, 500);
      }, 700);
    }, 500);
  },
  
  // 更新导出进度
  updateExportProgress: function(progress, statusText) {
    this.state.exportProgress = progress;
    
    const progressBar = document.getElementById('export-progress-bar');
    const progressText = document.getElementById('export-progress-text');
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = statusText || `已完成 ${progress}%`;
    
    // 检查是否完成
    if (progress >= 100) {
      setTimeout(() => {
        this.finalizeExport();
      }, 800);
    }
  },
  
  // 完成导出过程
  finalizeExport: function() {
    // 恢复状态
    this.state.isProcessing = false;
    
    // 更新界面
    const progressContainer = document.getElementById('export-progress-container');
    if (progressContainer) progressContainer.style.display = 'none';
  },
  
  // 模拟文件下载
  simulateFileDownload: function(options) {
    // 获取传感器名称
    const sensorSelect = document.getElementById('export-sensor-select');
    const sensorName = sensorSelect.options[sensorSelect.selectedIndex].text;
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${sensorName}_${timestamp}.${options.format}`;
    
    // 创建一个 Blob 作为模拟数据
    let content = '';
    const isBinary = (options.format === 'xlsx');
    
    if (!isBinary) {
      if (options.format === 'json') {
        // 创建模拟 JSON 内容
        const jsonData = {
          sensorId: options.sensorId,
          sensorName: sensorName,
          dateRange: options.dateRange,
          exportTime: new Date().toISOString(),
          data: this.generateMockSensorData()
        };
        
        content = options.formatOptions.jsonFormat === 'pretty' 
          ? JSON.stringify(jsonData, null, 2) 
          : JSON.stringify(jsonData);
      } else if (options.format === 'csv') {
        // 创建模拟 CSV 内容
        const mockData = this.generateMockSensorData();
        const headers = options.formatOptions.includeHeaders 
          ? 'timestamp,value,status\n' 
          : '';
        
        content = headers + mockData.map(item => 
          `${item.timestamp},${item.value},${item.status}`
        ).join('\n');
      } else {
        // 创建模拟文本内容
        content = `传感器数据导出\n\n`;
        content += `传感器: ${sensorName}\n`;
        content += `时间范围: ${options.dateRange.start} 至 ${options.dateRange.end}\n`;
        content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        content += `数据:\n`;
        
        const mockData = this.generateMockSensorData();
        mockData.forEach(item => {
          content += `${item.timestamp}: ${item.value} (${item.status})\n`;
        });
      }
    }
    
    // 创建下载链接
    const blob = isBinary 
      ? new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/octet-stream' }) // 模拟二进制文件
      : new Blob([content], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // 添加到文档并模拟点击
    document.body.appendChild(link);
    link.click();
    
    // 记录最后导出的文件
    this.state.lastExportedFile = {
      name: fileName,
      timestamp: new Date().toISOString(),
      format: options.format,
      sensorId: options.sensorId,
      sensorName: sensorName
    };
    
    // 延迟移除链接和释放URL
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  },
  
  // 生成模拟传感器数据
  generateMockSensorData: function() {
    const result = [];
    const now = new Date();
    const baseValue = 200 + Math.random() * 50;
    
    // 生成过去24小时的数据点，每小时一个
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - i);
      
      // 随机值，但保持一定的趋势
      const randomFactor = Math.sin(i / 4) * 10;
      const value = baseValue + randomFactor + (Math.random() * 5 - 2.5);
      
      // 随机状态，大多是正常的
      const statusRandom = Math.random();
      let status = 'normal';
      
      if (statusRandom > 0.9) {
        status = 'warning';
      } else if (statusRandom > 0.97) {
        status = 'alarm';
      }
      
      result.push({
        timestamp: timestamp.toISOString(),
        value: value.toFixed(2),
        status: status
      });
    }
    
    return result;
  }
};

// 初始化数据管理模块
function initDataManager() {
  DataManager.init();
} 