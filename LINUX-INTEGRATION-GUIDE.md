# 黑龙江大桥监测系统 - Linux服务器整合指南

本文档提供在Linux云服务器上部署和运行黑龙江大桥监测系统的详细说明，包括如何解决常见问题和优化系统性能。

## 1. 系统要求

### 硬件要求
- CPU: 至少2核
- 内存: 最低2GB，推荐4GB以上
- 存储: 至少10GB可用空间
- 网络: 稳定的互联网连接，推荐固定IP

### 软件要求
- 操作系统: Ubuntu 18.04/20.04 LTS 或 CentOS 7/8
- Web服务器: Nginx 1.14+ 或 Apache 2.4+
- 其他依赖:
  - Node.js 14+（可选，用于运行额外的分析工具）
  - Python 3.6+（可选，用于数据处理脚本）

## 2. 部署步骤

### 2.1 基础环境准备

#### Ubuntu系统:
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y nginx wget unzip curl vim

# 创建应用目录
sudo mkdir -p /var/www/bridge-monitoring
sudo chown -R $USER:$USER /var/www/bridge-monitoring
```

#### CentOS系统:
```bash
# 更新系统
sudo yum update -y

# 安装EPEL仓库
sudo yum install -y epel-release

# 安装必要工具
sudo yum install -y nginx wget unzip curl vim

# 创建应用目录
sudo mkdir -p /var/www/bridge-monitoring
sudo chown -R $USER:$USER /var/www/bridge-monitoring
```

### 2.2 部署系统文件

1. 将系统文件上传到服务器:

```bash
# 如果有ZIP包
cd /var/www/bridge-monitoring
wget http://your-download-url/bridge-monitoring-system.zip
unzip bridge-monitoring-system.zip

# 如果使用Git
git clone https://your-repository/bridge-monitoring.git /var/www/bridge-monitoring
```

2. 准备修复脚本和兼容性文件:

```bash
# 创建必要的文件夹
mkdir -p /var/www/bridge-monitoring/js
mkdir -p /var/www/bridge-monitoring/fonts

# 下载Chart.js本地副本
wget -O /var/www/bridge-monitoring/js/chart.min.js https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js

# 下载字体文件
wget -O /var/www/bridge-monitoring/fonts/MaterialIcons-Regular.woff2 https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2
wget -O /var/www/bridge-monitoring/fonts/MaterialIcons-Regular.woff https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff
wget -O /var/www/bridge-monitoring/fonts/MaterialIcons-Regular.ttf https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNa.ttf
```

3. 复制修复脚本:

```bash
# 确保修复脚本存在
cp /path/to/server-compatibility.js /var/www/bridge-monitoring/js/
cp /path/to/bridge-patch.js /var/www/bridge-monitoring/js/
cp /path/to/chart-fix.js /var/www/bridge-monitoring/js/
cp /path/to/emergency-fix.js /var/www/bridge-monitoring/js/

# 设置正确的权限
chmod 644 /var/www/bridge-monitoring/js/*.js
```

### 2.3 配置Web服务器

#### Nginx配置:

创建配置文件:
```bash
sudo vim /etc/nginx/conf.d/bridge-monitoring.conf
```

添加以下内容:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或服务器IP
    
    root /var/www/bridge-monitoring;
    index bridge-structure-detection.html index.html;
    
    # 添加字符集
    charset utf-8;
    
    # 启用压缩
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    
    # 设置缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # 处理主应用
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 错误页
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

应用配置:
```bash
sudo nginx -t  # 测试配置是否有误
sudo systemctl restart nginx
```

#### Apache配置:

创建配置文件:
```bash
sudo vim /etc/apache2/sites-available/bridge-monitoring.conf
```

添加以下内容:
```apache
<VirtualHost *:80>
    ServerName your-domain.com  # 替换为您的域名或服务器IP
    
    DocumentRoot /var/www/bridge-monitoring
    DirectoryIndex bridge-structure-detection.html index.html
    
    AddDefaultCharset UTF-8
    
    <Directory /var/www/bridge-monitoring>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # 设置缓存
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$">
        Header set Cache-Control "max-age=2592000, public"
    </FilesMatch>
    
    ErrorLog ${APACHE_LOG_DIR}/bridge-error.log
    CustomLog ${APACHE_LOG_DIR}/bridge-access.log combined
</VirtualHost>
```

应用配置:
```bash
# Ubuntu系统
sudo a2ensite bridge-monitoring.conf
sudo a2enmod headers
sudo systemctl restart apache2

# CentOS系统
sudo systemctl restart httpd
```

### 2.4 修改HTML文件以包含兼容性脚本

编辑主HTML文件:
```bash
vim /var/www/bridge-monitoring/bridge-structure-detection.html
```

在`<head>`节点的开始处添加:
```html
<!-- Linux服务器兼容性脚本 -->
<script src="js/server-compatibility.js"></script>
```

在所有其他JS脚本之前添加:
```html
<!-- 补丁脚本 -->
<script src="js/bridge-patch.js"></script>
```

在`</body>`标签之前添加:
```html
<!-- Chart.js修复脚本 -->
<script src="js/chart-fix.js"></script>
<!-- 紧急修复脚本 -->
<script src="js/emergency-fix.js"></script>
```

## 3. 故障排除

### 3.1 检查文件权限

确保所有文件具有正确的权限:
```bash
sudo chown -R www-data:www-data /var/www/bridge-monitoring  # Nginx/Apache用户
sudo chmod -R 755 /var/www/bridge-monitoring
sudo chmod -R 644 /var/www/bridge-monitoring/*.html /var/www/bridge-monitoring/js/*.js /var/www/bridge-monitoring/css/*.css
```

### 3.2 检查文件编码

确保所有文件都是UTF-8编码:
```bash
file -i /var/www/bridge-monitoring/bridge-structure-detection.html

# 如果不是UTF-8，转换编码
iconv -f GBK -t UTF-8 bridge-structure-detection.html > bridge-structure-detection.utf8.html
mv bridge-structure-detection.utf8.html bridge-structure-detection.html
```

### 3.3 检查脚本加载顺序

确保脚本按以下顺序加载:
1. server-compatibility.js (在head中)
2. bridge-patch.js (在其他脚本之前)
3. 主应用脚本
4. chart-fix.js (在body结束前)
5. emergency-fix.js (在body结束前)

### 3.4 常见问题解决方法

#### 资源加载失败
如果字体、图表等资源无法加载，请确保:
- 检查 `/var/www/bridge-monitoring/fonts/` 目录中是否有所需字体文件
- 检查 `/var/www/bridge-monitoring/js/chart.min.js` 是否存在
- 检查服务器是否可以访问互联网 (对于CDN资源)

#### 图表不显示
如果图表无法显示:
```bash
# 手动下载Chart.js
wget -O /var/www/bridge-monitoring/js/chart.min.js https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js

# 确保在控制台没有JavaScript错误
```

#### 内存问题
如果服务器内存不足:
```bash
# 创建swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用swap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. 性能优化

### 4.1 服务器优化

#### 增加PHP限制 (如果使用PHP)
```bash
sudo vim /etc/php/7.4/fpm/php.ini  # 版本可能不同

# 修改以下值
memory_limit = 256M
max_execution_time = 300
post_max_size = 64M
upload_max_filesize = 64M
```

#### 优化Nginx
```bash
sudo vim /etc/nginx/nginx.conf

# 在http块中添加或修改
http {
    # 工作进程数量，通常设置为CPU核心数
    worker_processes auto;
    
    # 每个工作进程的最大连接数
    worker_connections 1024;
    
    # 保持连接超时
    keepalive_timeout 65;
    
    # 文件发送缓冲区大小
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 压缩设置
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types application/javascript application/json text/css text/plain;
}
```

### 4.2 应用优化

在`emergency-fix.js`中可以添加性能优化参数:
```javascript
// 性能设置
window.PERFORMANCE_SETTINGS = {
    maxSensorsPerType: 10,       // 每类型最多显示传感器数量
    maxDataPoints: 500,          // 每个图表最多数据点数
    enableAnimation: false,      // 禁用动画以提高性能
    cleanupInterval: 120000      // 内存清理间隔(毫秒)
};
```

## 5. 维护和监控

### 5.1 日志监控

定期检查服务器日志:
```bash
# Nginx日志
sudo tail -100 /var/log/nginx/error.log

# Apache日志
sudo tail -100 /var/log/apache2/error.log  # Ubuntu
sudo tail -100 /var/log/httpd/error_log    # CentOS
```

### 5.2 性能监控

安装监控工具:
```bash
# 安装htop
sudo apt install htop  # Ubuntu
sudo yum install htop  # CentOS

# 运行htop查看资源使用情况
htop
```

### 5.3 备份

定期备份系统:
```bash
# 创建备份脚本
vim /usr/local/bin/backup-bridge.sh
```

添加以下内容:
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# 备份网站文件
tar -czf $BACKUP_DIR/bridge-monitoring-$DATE.tar.gz /var/www/bridge-monitoring

# 保留最近10个备份
ls -t $BACKUP_DIR/bridge-monitoring-*.tar.gz | tail -n +11 | xargs rm -f
```

设置权限和定时任务:
```bash
chmod +x /usr/local/bin/backup-bridge.sh

# 添加到crontab，每天凌晨2点执行
(crontab -l ; echo "0 2 * * * /usr/local/bin/backup-bridge.sh") | crontab -
```

## 6. 安全建议

### 6.1 启用HTTPS

使用Let's Encrypt获取免费SSL证书:

```bash
# Ubuntu系统
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# CentOS系统
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6.2 设置文件权限

确保文件权限安全:
```bash
sudo find /var/www/bridge-monitoring -type d -exec chmod 755 {} \;
sudo find /var/www/bridge-monitoring -type f -exec chmod 644 {} \;
```

### 6.3 防火墙配置

配置基本防火墙:
```bash
# Ubuntu系统
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS系统
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 7. 更新与升级

### 7.1 系统更新步骤

1. 备份当前系统:
```bash
tar -czf bridge-backup.tar.gz /var/www/bridge-monitoring
```

2. 更新系统文件:
```bash
# 下载新版本
wget http://your-download-url/bridge-monitoring-system-new.zip
unzip bridge-monitoring-system-new.zip -d /tmp/bridge-new

# 应用更新
cp -r /tmp/bridge-new/* /var/www/bridge-monitoring/
```

3. 确保兼容性脚本仍然存在:
```bash
# 如果更新覆盖了兼容性脚本，请重新添加
cp /path/to/backup/js/server-compatibility.js /var/www/bridge-monitoring/js/
cp /path/to/backup/js/bridge-patch.js /var/www/bridge-monitoring/js/
cp /path/to/backup/js/chart-fix.js /var/www/bridge-monitoring/js/
cp /path/to/backup/js/emergency-fix.js /var/www/bridge-monitoring/js/
```

## 联系与支持

若您在部署或使用过程中遇到任何问题，请通过以下方式获取支持：

- 技术支持邮箱: support@example.com
- 技术文档网站: https://docs.example.com
- 问题报告: https://github.com/your-repo/issues 