# 部署到 Kubernetes（使用 Helm）

## 构建镜像

```bash
# 在项目根目录
# 建议使用你自己的镜像仓库（修改 values.yaml 中 image.repository）
IMAGE=ghcr.io/your-org/simple-shopping:latest

# 构建
docker build -t $IMAGE .

# 推送
docker push $IMAGE
```

## 安装到 K8s

```bash
# 创建命名空间（可选）
kubectl create ns shopping || true

# 安装/升级
helm upgrade --install shopping ./helm/simple-shopping \
  --namespace shopping \
  --set image.repository=ghcr.io/your-org/simple-shopping \
  --set image.tag=latest
```

## 访问应用

- 使用 NodePort/LoadBalancer：修改 values.yaml 中 service.type
- 使用 Ingress：将 values.yaml 中 ingress.enabled 设为 true，并配置域名

```bash
helm upgrade --install shopping ./helm/simple-shopping \
  --namespace shopping \
  --set image.repository=ghcr.io/your-org/simple-shopping \
  --set image.tag=latest \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=your.domain.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

## 多分支部署建议

- 各分支使用同一套 Chart；通过镜像 tag 区分，如 :feature-pr-123。
- CI/CD 在构建步骤将 APP_URL 指向对应预览域名，Playwright 测试复用。
- 例：
  - 分支 feature/pr-123 构建镜像 ghcr.io/your-org/simple-shopping:feature-pr-123
  - 部署时：--set image.tag=feature-pr-123

## 备注

- 本项目为纯静态站点，使用 Nginx 容器直接托管 src/index.html。
- 如需更多 Nginx 配置，可在镜像内覆盖 /etc/nginx/conf.d/default.conf。

