# 構建階段
FROM node:14 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -la
RUN echo "Running npm run build..."
RUN npm run build
RUN echo "npm run build completed"
RUN ls -la
RUN ls -la dist || echo "dist directory not found"

# 生產階段
FROM nginx:stable-alpine as production-stage
WORKDIR /app
COPY --from=build-stage /app/dist .
RUN ls -la
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]