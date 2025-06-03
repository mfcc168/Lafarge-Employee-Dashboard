# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && ls -la /app/dist

# Production stage
FROM nginx:alpine
RUN mkdir -p /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Install certbot dependencies
RUN apk add --no-cache certbot
EXPOSE 80 443
CMD ["sh", "-c", "nginx -g 'daemon off;'"]