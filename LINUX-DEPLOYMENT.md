# 黑龙江大桥监测系统 - Linux云服务器部署指南

本文档提供在Linux云服务器上部署和运行黑龙江大桥监测系统的详细步骤和注意事项。

## 系统要求

- Linux 服务器（推荐Ubuntu 18.04+或CentOS 7+）
- Nginx, Apache或其他Web服务器
- 至少1GB可用内存
- 至少10GB磁盘空间
- 可访问互联网（用于加载CDN资源）

## 部署步骤

### 1. 准备环境

#### 安装Web服务器（以Nginx为例）

```bash
# Ubuntu系统
sudo apt update
sudo apt install nginx

# CentOS系统
sudo yum install epel-release
sudo yum install nginx
```

启动并设置自动启动：

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 上传系统文件

使用SFTP, SCP或其他文件传输工具，将黑龙江大桥监测系统文件上传至服务器。

推荐目录结构：

```
/var/www/bridge-monitoring/
├── bridge-structure-detection.html
├── data/
├── images/
├── js/
│   ├── bridge-patch.js
│   ├── server-compatibility.js
│   └── ...
└── ...
```

上传命令示例：

```bash
# 本地执行
scp -r /path/to/local/bridge-monitoring/* user@server-ip:/var/www/bridge-monitoring/
```

### 3. 配置Web服务器

#### Nginx配置示例

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/bridge-monitoring
```

输入以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或IP

    root /var/www/bridge-monitoring;
    index bridge-structure-detection.html;

    location / {
        try_files $uri $uri/ =404;
    }
    
    # 处理中文文件名
    charset utf-8;
    
    # 提高安全性
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # 针对静态资源启用压缩
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

创建符号链接并重启Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/bridge-monitoring /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### Apache配置示例

创建Apache配置文件：

```bash
sudo nano /etc/apache2/sites-available/bridge-monitoring.conf
```

输入以下内容：

```apache
<VirtualHost *:80>
    ServerName your-domain.com  # 替换为您的域名或IP
    DocumentRoot /var/www/bridge-monitoring
    
    <Directory /var/www/bridge-monitoring>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # 处理中文文件名
    AddDefaultCharset UTF-8
    
    # 日志配置
    ErrorLog ${APACHE_LOG_DIR}/bridge-error.log
    CustomLog ${APACHE_LOG_DIR}/bridge-access.log combined
</VirtualHost>
```

启用站点并重启Apache：

```bash
sudo a2ensite bridge-monitoring.conf
sudo systemctl restart apache2
```

### 4. 设置文件权限

确保Web服务器可以访问所有文件：

```bash
sudo chown -R www-data:www-data /var/www/bridge-monitoring
sudo chmod -R 755 /var/www/bridge-monitoring
```

### 5. 测试访问

通过浏览器访问您的域名或IP地址，例如：

```
http://your-domain.com/
```

或者

```
http://your-ip-address/bridge-structure-detection.html
```

## 注意事项

1. **中文文件名**：确保服务器配置了正确的字符集（UTF-8），以正确处理中文文件名。

2. **路径问题**：系统已增加了兼容性脚本，会自动转换Windows路径为Linux路径，但如有异常，请检查文件路径。

3. **文件编码**：所有HTML、JS和CSS文件应使用UTF-8编码，避免中文显示乱码。

4. **文件权限**：确保web服务器用户（如www-data）对所有文件有读取权限。

5. **HTTPS支持**：为提高安全性，建议配置HTTPS。可使用Let's Encrypt获取免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 故障排除

### 常见问题

1. **页面空白或JS错误**
   - 检查浏览器控制台（F12）中是否有错误
   - 确认所有JS文件路径正确
   - 验证server-compatibility.js是否正确加载

2. **文件上传功能失效**
   - 确保临时目录有写入权限
   - 验证文件大小未超过服务器限制
   - 检查服务器日志获取详细错误信息

3. **中文显示乱码**
   - 检查HTML文件的<meta charset="UTF-8">标签
   - 确认服务器配置了正确的字符集
   - 验证文件是以UTF-8编码保存的

### 日志查看

- Nginx错误日志：`/var/log/nginx/error.log`
- Apache错误日志：`/var/log/apache2/error.log`

## 性能优化

1. **启用缓存**：配置浏览器缓存静态资源

```nginx
# Nginx示例
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
```

2. **压缩文件**：启用gzip压缩减少传输大小

```nginx
# Nginx示例
gzip on;
gzip_comp_level 5;
gzip_min_length 256;
gzip_proxied any;
gzip_types application/javascript application/json text/css text/plain;
```

## 联系与支持

如有任何部署问题，请联系系统管理员或发送邮件至support@example.com。 

<script src="js/chart.min.js"></script> 