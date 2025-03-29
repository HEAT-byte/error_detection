# 黑龙江大桥监测系统 - Linux服务器部署指南

本文档提供在Linux云服务器上部署黑龙江大桥监测系统的详细指南，包括系统需求、安装步骤、配置和常见问题的解决方案。

## 1. 系统要求

### 硬件需求
- CPU: 至少2核
- 内存: 最低2GB，推荐4GB或更高
- 存储: 至少10GB可用空间
- 网络: 稳定的网络连接，建议固定IP

### 软件需求
- 操作系统: Ubuntu 18.04/20.04 LTS 或 CentOS 7/8
- Web服务器: Nginx 1.14+ 或 Apache 2.4+
- Node.js: 14.x 或更高版本 (可选，用于辅助工具)

## 2. 安装步骤

### 2.1 准备服务器环境

#### Ubuntu系统:
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y nginx curl wget unzip git vim

# 安装Node.js (可选)
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs

# 创建部署目录
sudo mkdir -p /var/www/bridge-monitoring
sudo chown -R $USER:$USER /var/www/bridge-monitoring
```

#### CentOS系统:
```bash
# 更新系统包
sudo yum update -y

# 安装EPEL仓库
sudo yum install -y epel-release

# 安装必要工具
sudo yum install -y nginx curl wget unzip git vim

# 安装Node.js (可选)
curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
sudo yum install -y nodejs

# 创建部署目录
sudo mkdir -p /var/www/bridge-monitoring
sudo chown -R $USER:$USER /var/www/bridge-monitoring
```

### 2.2 部署系统文件

1. 复制系统文件到服务器:

```bash
# 如果使用ZIP包部署
cd /var/www/bridge-monitoring
# 通过SFTP等方式上传ZIP文件到此目录
unzip bridge-monitoring-system.zip

# 如果从Git仓库部署
git clone https://your-repository-url.git /var/www/bridge-monitoring
```

2. 安装兼容性修复脚本:

```bash
# 创建必要的目录
mkdir -p /var/www/bridge-monitoring/js
mkdir -p /var/www/bridge-monitoring/fonts

# 复制兼容性脚本 (根据实际情况调整路径)
cp /path/to/server-compatibility.js /var/www/bridge-monitoring/js/
cp /path/to/bridge-patch.js /var/www/bridge-monitoring/js/
cp /path/to/chart-fix.js /var/www/bridge-monitoring/js/
cp /path/to/emergency-fix.js /var/www/bridge-monitoring/js/

# 下载Chart.js本地副本
wget -O /var/www/bridge-monitoring/js/chart.min.js https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js

# 下载Material Icons字体文件
wget -O /var/www/bridge-monitoring/fonts/MaterialIcons-Regular.woff2 https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2
wget -O /var/www/bridge-monitoring/fonts/MaterialIcons-Regular.woff https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff
wget -O /var/www/bridge-monitoring/fonts/MaterialIcons-Regular.ttf https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNa.ttf

# 设置正确的文件权限
sudo find /var/www/bridge-monitoring -type d -exec chmod 755 {} \;
sudo find /var/www/bridge-monitoring -type f -exec chmod 644 {} \;
```

3. 复制兼容版HTML文件:

```bash
# 将bridge-structure-detection-fix.html复制到部署目录
cp /path/to/bridge-structure-detection-fix.html /var/www/bridge-monitoring/

# 将其设置为默认首页(可选)
ln -s /var/www/bridge-monitoring/bridge-structure-detection-fix.html /var/www/bridge-monitoring/index.html
```

### 2.3 配置Web服务器

#### Nginx配置:

1. 创建配置文件:

```bash
sudo nano /etc/nginx/sites-available/bridge-monitoring
```

2. 添加以下内容:

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;  # 替换为您的域名或服务器IP
    
    root /var/www/bridge-monitoring;
    index bridge-structure-detection-fix.html index.html;
    
    # 添加字符编码
    charset utf-8;
    
    # 启用Gzip压缩
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
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

3. 启用配置:

```bash
# 创建符号链接到启用的站点
sudo ln -s /etc/nginx/sites-available/bridge-monitoring /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### Apache配置:

1. 创建配置文件:

```bash
sudo nano /etc/apache2/sites-available/bridge-monitoring.conf
```

2. 添加以下内容:

```apache
<VirtualHost *:80>
    ServerName your_domain_or_ip  # 替换为您的域名或服务器IP
    
    DocumentRoot /var/www/bridge-monitoring
    DirectoryIndex bridge-structure-detection-fix.html index.html
    
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

3. 启用配置:

```bash
# Ubuntu系统
sudo a2ensite bridge-monitoring.conf
sudo a2enmod headers
sudo systemctl restart apache2

# CentOS系统
sudo systemctl restart httpd
```

### 2.4 修改主HTML文件

如需修改原始HTML文件而不使用兼容版HTML，请添加兼容性脚本引用:

1. 编辑主HTML文件:

```bash
nano /var/www/bridge-monitoring/bridge-structure-detection.html
```

2. 在`<head>`标签开始处添加:

```html
<!-- Linux服务器兼容性脚本 - 必须最先加载 -->
<script src="js/server-compatibility.js"></script>

<!-- 补丁脚本 - 在其他脚本前加载 -->
<script src="js/bridge-patch.js"></script>
```

3. 在`</body>`标签前添加:

```html
<!-- Chart.js修复和紧急修复脚本 -->
<script src="js/chart-fix.js"></script>
<script src="js/emergency-fix.js"></script>
```

## 3. 常见问题排查

### 3.1 资源加载失败

**症状**: 控制台显示 `Failed to load resource: net::ERR_CONNECTION_TIMED_OUT`

**解决方案**:
1. 检查服务器是否可以访问外部网络:
   ```bash
   ping fonts.googleapis.com
   ping cdnjs.cloudflare.com
   ```

2. 如果无法访问，使用本地字体文件:
   ```bash
   # 确保字体文件存在
   ls -la /var/www/bridge-monitoring/fonts/
   ```

3. 修改CSS文件中的字体引用，使用本地路径:
   ```css
   @font-face {
     font-family: 'Material Icons';
     src: url('/fonts/MaterialIcons-Regular.woff2') format('woff2'),
          url('/fonts/MaterialIcons-Regular.woff') format('woff'),
          url('/fonts/MaterialIcons-Regular.ttf') format('truetype');
   }
   ```

### 3.2 Chart.js未加载

**症状**: 控制台显示 `Chart.js 未加载` 或 `ReferenceError: Chart is not defined`

**解决方案**:
1. 检查本地Chart.js文件是否存在:
   ```bash
   ls -la /var/www/bridge-monitoring/js/chart.min.js
   ```

2. 尝试从其他CDN下载:
   ```bash
   wget -O /var/www/bridge-monitoring/js/chart.min.js https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js
   ```

3. 确保chart-fix.js已经加载:
   ```bash
   # 检查文件是否存在
   ls -la /var/www/bridge-monitoring/js/chart-fix.js
   ```

### 3.3 文件权限问题

**症状**: 无法加载文件，显示403错误

**解决方案**:
```bash
# 设置正确的所有权
sudo chown -R www-data:www-data /var/www/bridge-monitoring  # 对于Nginx/Apache

# 设置正确的权限
sudo find /var/www/bridge-monitoring -type d -exec chmod 755 {} \;
sudo find /var/www/bridge-monitoring -type f -exec chmod 644 {} \;
```

### 3.4 handleFileUpload未定义

**症状**: 控制台显示 `ReferenceError: handleFileUpload is not defined`

**解决方案**:
1. 确保bridge-patch.js已经加载
2. 可以在控制台临时修复:
   ```javascript
   // 直接在浏览器控制台执行
   window.handleFileUpload = function(event) {
     console.log('使用临时handleFileUpload函数');
     const fileInput = event.target;
     if (fileInput && fileInput.files && fileInput.files.length > 0) {
       const file = fileInput.files[0];
       document.getElementById('fileInfo').textContent = `已选择文件: ${file.name}`;
     }
   };
   ```

### 3.5 bindEvents未定义

**症状**: 控制台显示 `ReferenceError: bindEvents is not defined`

**解决方案**:
1. 确保emergency-fix.js已经加载
2. 可以在控制台临时修复:
   ```javascript
   // 直接在浏览器控制台执行
   window.bindEvents = function() {
     console.log('使用临时bindEvents函数');
     const uploadBtn = document.getElementById('uploadBtn');
     if (uploadBtn) {
       uploadBtn.addEventListener('click', function() {
         document.getElementById('fileInput').click();
       });
     }
     
     const fileInput = document.getElementById('fileInput');
     if (fileInput) {
       fileInput.addEventListener('change', function(e) {
         if (typeof window.handleFileUpload === 'function') {
           window.handleFileUpload(e);
         }
       });
     }
   };
   
   // 立即调用
   window.bindEvents();
   ```

### 3.6 中文乱码问题

**症状**: 页面上的中文显示为乱码或方块

**解决方案**:
1. 检查HTML文件编码:
   ```bash
   file -i /var/www/bridge-monitoring/bridge-structure-detection.html
   ```

2. 转换文件编码:
   ```bash
   # 如果不是UTF-8，转换编码
   iconv -f GBK -t UTF-8 bridge-structure-detection.html > bridge-structure-detection.utf8.html
   mv bridge-structure-detection.utf8.html bridge-structure-detection.html
   ```

3. 确保服务器配置中设置了正确的字符集:
   - Nginx: `charset utf-8;`
   - Apache: `AddDefaultCharset UTF-8`

## 4. 性能优化

### 4.1 增加服务器交换空间

如果服务器内存较小，可以添加swap文件:
```bash
# 创建2GB的swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4.2 优化Nginx配置

```nginx
# 在http块中添加或修改以下内容
http {
    # 根据CPU核心数设置
    worker_processes auto;
    
    # 调整工作连接数
    events {
        worker_connections 1024;
    }
    
    # 启用压缩
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types application/javascript application/json text/css text/plain;
    
    # 其他优化设置
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    proxy_buffer_size 4k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
}
```

### 4.3 启用浏览器缓存

在Web服务器配置中添加以下设置:

```nginx
# Nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
```

```apache
# Apache
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$">
    Header set Cache-Control "max-age=2592000, public"
</FilesMatch>
```

## 5. 安全配置

### 5.1 启用HTTPS

使用Let's Encrypt获取免费SSL证书:

```bash
# Ubuntu系统
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# CentOS系统
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 5.2 添加基本访问验证

1. 创建密码文件:
```bash
sudo apt install -y apache2-utils  # Ubuntu
sudo yum install -y httpd-tools    # CentOS

# 创建用户
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

2. 配置Nginx:
```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ =404;
}
```

### 5.3 配置防火墙

```bash
# Ubuntu系统
sudo ufw allow 22        # SSH
sudo ufw allow 80        # HTTP
sudo ufw allow 443       # HTTPS
sudo ufw enable

# CentOS系统
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 6. 系统维护

### 6.1 自动备份

创建备份脚本:
```bash
cat > /usr/local/bin/backup-bridge.sh << 'EOL'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# 备份网站文件
tar -czf $BACKUP_DIR/bridge-monitoring-$DATE.tar.gz /var/www/bridge-monitoring

# 保留最近10个备份
ls -t $BACKUP_DIR/bridge-monitoring-*.tar.gz | tail -n +11 | xargs rm -f
EOL

chmod +x /usr/local/bin/backup-bridge.sh

# 添加到crontab，每天凌晨2点运行
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-bridge.sh") | crontab -
```

### 6.2 日志分析

```bash
# 查看最近的Nginx错误
sudo tail -50 /var/log/nginx/error.log

# 查看访问日志
sudo tail -50 /var/log/nginx/access.log
```

### 6.3 系统监控

安装监控工具:
```bash
# 安装Htop
sudo apt install -y htop  # Ubuntu
sudo yum install -y htop  # CentOS

# 运行Htop
htop
```

## 7. 故障排除与FAQ

### Q: 系统加载很慢，如何提高加载速度？
A: 检查网络连接，优化图片大小，启用压缩和缓存，使用本地资源代替CDN资源。

### Q: 上传文件后系统无响应？
A: 可能是内存不足，增加swap空间，优化数据处理逻辑，限制上传文件大小。

### Q: Chart.js图表不显示？
A: 确保Chart.js正确加载，检查console是否有错误，使用chart-fix.js提供的备用方案。

### Q: 系统中的中文字体显示不正确？
A: 确保所有HTML和CSS文件使用UTF-8编码，确保服务器配置了正确的字符集。

### Q: 如何更新系统？
A: 备份当前文件，上传新版本文件，确保兼容性脚本保留并正确引用。

## 8. 联系与支持

如需进一步的协助，请联系：

- 技术支持: support@example.com
- 系统文档: https://example.com/docs
- 问题报告: https://github.com/your-repo/issues