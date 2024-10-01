# 构建阶段
FROM node:18 as build-stage
WORKDIR /app

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製專案文件
COPY . .

# 設置環境變量
ARG VUE_APP_API_URL
ENV VUE_APP_API_URL=$VUE_APP_API_URL

# 顯示環境變量
RUN echo "VUE_APP_API_URL is set to: $VUE_APP_API_URL"

# 運行構建
RUN npm run build

# 檢查構建輸出
RUN echo "Build completed. Checking directory contents:"
RUN ls -la /app
RUN echo "Checking dist directory:"
RUN ls -la /app/dist || echo "dist directory does not exist"

# 生产阶段
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]