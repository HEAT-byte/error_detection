// 数据库管理模块
// 提供数据导入导出、统计和可视化功能

// 模拟数据库连接状态
let databaseConnected = true;
let databaseStats = {
    totalRecords: 12458,
    sensorCount: 16,
    earliestRecord: '2023-01-01',
    latestRecord: '2024-03-17',
    databaseSize: '256 MB',
    lastUpdate: '2024-03-17 14:30'
};

// 初始化数据库模块
function initDatabaseModule() {
    console.log('初始化数据库模块...');
    try {
        // 显示数据库统计信息
        displayDatabaseStats();
        
        // 设置事件监听器
        setupDatabaseEvents();
        
        // 填充导出选项的传感器列表
        populateSensorOptions();
        
        // 初始化数据可视化
        initDataVisualization();
        
        console.log('数据库模块初始化完成');
    } catch (error) {
        console.error('初始化数据库模块出错:', error);
    }
}

// 显示数据库统计信息
function displayDatabaseStats() {
    document.getElementById('total-records').textContent = databaseStats.totalRecords.toLocaleString();
    document.getElementById('sensor-count').textContent = databaseStats.sensorCount;
    document.getElementById('earliest-record').textContent = databaseStats.earliestRecord;
    document.getElementById('latest-record').textContent = databaseStats.latestRecord;
    document.getElementById('database-size').textContent = databaseStats.databaseSize;
    document.getElementById('last-update').textContent = databaseStats.lastUpdate;
}

// 设置数据库相关事件监听器
function setupDatabaseEvents() {
    // 文件选择事件
    const fileInput = document.getElementById('data-import-file');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files.length > 0 ? this.files[0].name : '未选择文件';
            document.getElementById('selected-file-name').textContent = fileName;
        });
    }
    
    // 导入按钮事件
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const fileInput = document.getElementById('data-import-file');
            if (fileInput.files.length === 0) {
                alert('请先选择要导入的文件');
                return;
            }
            
            const replaceExisting = document.getElementById('replace-existing').checked;
            const validateData = document.getElementById('validate-data').checked;
            
            // 显示进度条
            const progressBar = document.getElementById('import-progress');
            const progressBarInner = progressBar.querySelector('.progress-bar');
            const progressText = progressBar.querySelector('.progress-text');
            
            progressBar.style.display = 'block';
            
            // 模拟导入过程
            let progress = 0;
            const interval = setInterval(function() {
                progress += 5;
                progressBarInner.style.width = progress + '%';
                progressText.textContent = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // 更新统计信息
                    databaseStats.totalRecords += 256;
                    databaseStats.lastUpdate = new Date().toLocaleString('zh-CN', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });
                    
                    displayDatabaseStats();
                    
                    // 显示成功消息
                    setTimeout(function() {
                        alert('数据导入成功');
                        progressBar.style.display = 'none';
                    }, 500);
                }
            }, 200);
        });
    }
    
    // 导出按钮事件
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const sensorSelect = document.getElementById('export-sensor-select').value;
            const timeRange = document.getElementById('export-time-range').value;
            const exportFormat = document.getElementById('export-format').value;
            
            let message = `正在导出数据:\n`;
            message += `- 传感器: ${sensorSelect === 'all' ? '全部传感器' : sensorSelect}\n`;
            message += `- 时间范围: ${getTimeRangeText(timeRange)}\n`;
            message += `- 导出格式: ${exportFormat.toUpperCase()}`;
            
            alert(message);
            
            // 模拟导出过程
            setTimeout(function() {
                // 创建一个虚拟下载链接
                const link = document.createElement('a');
                link.href = `data:text/plain,${encodeURIComponent('这是模拟导出的数据文件内容')}`;
                link.download = `传感器数据_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, 1000);
        });
    }
    
    // 自定义时间范围显示/隐藏
    const timeRangeSelect = document.getElementById('export-time-range');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', function() {
            const customDateRange = document.getElementById('custom-date-range');
            if (this.value === 'custom') {
                customDateRange.style.display = 'block';
            } else {
                customDateRange.style.display = 'none';
            }
        });
    }
    
    // 更新可视化按钮事件
    const updateVizBtn = document.getElementById('update-viz-btn');
    if (updateVizBtn) {
        updateVizBtn.addEventListener('click', function() {
            updateDataVisualization();
        });
    }
}

// 获取时间范围文本描述
function getTimeRangeText(timeRange) {
    switch(timeRange) {
        case 'all': return '全部时间';
        case 'day': return '最近24小时';
        case 'week': return '最近一周';
        case 'month': return '最近一个月';
        case 'custom':
            const startDate = document.getElementById('start-date').value || '未设置';
            const endDate = document.getElementById('end-date').value || '未设置';
            return `${startDate} 至 ${endDate}`;
        default: return timeRange;
    }
}

// 填充传感器选项
function populateSensorOptions() {
    const exportSensorSelect = document.getElementById('export-sensor-select');
    const vizSensorSelect = document.getElementById('viz-sensor-select');
    
    if (!exportSensorSelect || !vizSensorSelect) return;
    
    // 获取传感器数据
    const sensors = window.sensorData || {};
    
    // 清空现有选项
    while (exportSensorSelect.options.length > 1) {
        exportSensorSelect.remove(1);
    }
    
    while (vizSensorSelect.options.length > 0) {
        vizSensorSelect.remove(0);
    }
    
    // 添加传感器选项
    for (const sensorId in sensors) {
        if (sensors.hasOwnProperty(sensorId)) {
            const sensor = sensors[sensorId];
            const optionText = `${sensorId} (${sensor.location})`;
            
            // 添加到导出选择器
            const exportOption = document.createElement('option');
            exportOption.value = sensorId;
            exportOption.textContent = optionText;
            exportSensorSelect.appendChild(exportOption);
            
            // 添加到可视化选择器
            const vizOption = document.createElement('option');
            vizOption.value = sensorId;
            vizOption.textContent = optionText;
            vizSensorSelect.appendChild(vizOption);
        }
    }
}

// 初始化数据可视化
function initDataVisualization() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载，无法初始化数据可视化');
        return;
    }
    
    // 获取图表画布
    const canvas = document.getElementById('data-visualization-chart');
    if (!canvas) return;
    
    // 创建图表实例
    window.dataVizChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: [], // 将由updateDataVisualization填充
            datasets: [] // 将由updateDataVisualization填充
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '传感器数据趋势',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
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
            }
        }
    });
    
    // 首次更新可视化
    updateDataVisualization();
}

// 更新数据可视化
function updateDataVisualization() {
    if (!window.dataVizChart) {
        console.error('数据可视化图表未初始化');
        return;
    }
    
    // 获取选择的选项
    const sensorId = document.getElementById('viz-sensor-select').value;
    const dataType = document.getElementById('viz-data-type').value;
    const timeRange = document.getElementById('viz-time-range').value;
    
    if (!sensorId) {
        console.warn('未选择传感器，无法更新可视化');
        return;
    }
    
    // 生成时间标签
    const labels = generateTimeLabels(timeRange);
    
    // 生成数据集
    const datasets = generateDatasets(sensorId, dataType, timeRange);
    
    // 更新图表数据
    window.dataVizChart.data.labels = labels;
    window.dataVizChart.data.datasets = datasets;
    
    // 更新图表
    window.dataVizChart.update();
}

// 生成时间标签
function generateTimeLabels(timeRange) {
    const labels = [];
    const now = new Date();
    let points = 0;
    let interval = 0;
    
    switch(timeRange) {
        case 'day':
            points = 24; // 每小时一个点
            interval = 60 * 60 * 1000; // 1小时
            break;
        case 'week':
            points = 7; // 每天一个点
            interval = 24 * 60 * 60 * 1000; // 1天
            break;
        case 'month':
            points = 30; // 每天一个点
            interval = 24 * 60 * 60 * 1000; // 1天
            break;
        case 'year':
            points = 12; // 每月一个点
            interval = 30 * 24 * 60 * 60 * 1000; // 近似一个月
            break;
        default:
            points = 24;
            interval = 60 * 60 * 1000;
    }
    
    // 生成时间标签
    for (let i = points - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * interval));
        let label = '';
        
        switch(timeRange) {
            case 'day':
                label = date.getHours() + ':00';
                break;
            case 'week':
            case 'month':
                label = (date.getMonth() + 1) + '/' + date.getDate();
                break;
            case 'year':
                label = (date.getMonth() + 1) + '月';
                break;
        }
        
        labels.push(label);
    }
    
    return labels;
}

// 生成数据集
function generateDatasets(sensorId, dataType, timeRange) {
    const datasets = [];
    const points = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12;
    
    // 定义数据类型的颜色和标签
    const dataTypeConfig = {
        temperature: {
            label: '温度 (°C)',
            color: 'rgb(255, 99, 132)',
            min: 20,
            max: 40
        },
        vibration: {
            label: '振动 (Hz)',
            color: 'rgb(54, 162, 235)',
            min: 0,
            max: 5
        },
        tilt: {
            label: '倾斜 (°)',
            color: 'rgb(75, 192, 192)',
            min: 0,
            max: 2
        }
    };
    
    // 生成单个类型的数据
    function generateData(type) {
        const data = [];
        const config = dataTypeConfig[type];
        let value = (config.min + config.max) / 2; // 起始值
        
        for (let i = 0; i < points; i++) {
            // 添加一些随机波动
            value += (Math.random() - 0.5) * ((config.max - config.min) / 10);
            // 确保值在范围内
            value = Math.max(config.min, Math.min(config.max, value));
            data.push(value.toFixed(2));
        }
        
        return data;
    }
    
    // 根据选择的数据类型生成数据集
    if (dataType === 'all') {
        // 生成所有类型的数据
        for (const type in dataTypeConfig) {
            if (dataTypeConfig.hasOwnProperty(type)) {
                const config = dataTypeConfig[type];
                datasets.push({
                    label: config.label,
                    data: generateData(type),
                    borderColor: config.color,
                    backgroundColor: config.color + '20', // 添加透明度
                    fill: false,
                    tension: 0.4
                });
            }
        }
    } else {
        // 生成选定类型的数据
        const config = dataTypeConfig[dataType];
        if (config) {
            datasets.push({
                label: config.label,
                data: generateData(dataType),
                borderColor: config.color,
                backgroundColor: config.color + '20',
                fill: true,
                tension: 0.4
            });
        }
    }
    
    return datasets;
}

// 导出模块函数
window.databaseModule = {
    init: initDatabaseModule,
    updateVisualization: updateDataVisualization
}; 