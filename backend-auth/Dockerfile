FROM php:8.2-cli

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /app

# Command to start the server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
