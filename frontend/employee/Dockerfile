# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build with Vite
RUN npm run build && ls -la /app/dist  # Debug output

# Production stage
FROM nginx:alpine
# Create directory first to ensure proper permissions
RUN mkdir -p /usr/share/nginx/html
# Copy from Vite's dist directory
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]