# Sử dụng node.js image
FROM node:18

# Cài đặt các dependencies cần thiết
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libjpeg-dev \
    libcairo2-dev \
    libgif-dev \
    libpango1.0-dev \
    libtool \
    autoconf \
    automake \
    pkg-config \
    libpixman-1-dev \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cấu hình yarn
RUN yarn config set network-timeout 600000 -g

# Cài đặt NestJS CLI globally
RUN yarn global add @nestjs/cli

# Cài đặt dependencies sử dụng yarn
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copy toàn bộ source code vào container
COPY . .

# Build ứng dụng
RUN yarn build

# Expose port
EXPOSE 3000

# Command để chạy ứng dụng
CMD ["yarn", "start:prod"]