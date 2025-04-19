# Stage 1: Сборка приложения
FROM node:18-alpine AS builder

# Создание рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install --production

# Копирование исходного кода
COPY . .

# Stage 2: Финальный образ
FROM node:18-alpine

# Установка OpenSSH для использования ssh-keygen
RUN apk add --no-cache openssh

# Создание рабочей директории
WORKDIR /app

# Копирование только необходимых файлов из первого этапа
COPY --from=builder /app /app

# Установка прав доступа
RUN chmod +x /app/index.js

# Порт, на котором будет работать SSH-сервер
EXPOSE ${PORT:-22}

# Команда для запуска приложения
CMD ["node", "index.js"]