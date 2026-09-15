# Use official lightweight Nginx Alpine base image
FROM nginx:alpine

# Copy static frontend assets into Nginx html directory
COPY ./app /usr/share/nginx/html

# Expose container HTTP port 80
EXPOSE 80

# Start Nginx web server in foreground
CMD ["nginx", "-g", "daemon off;"]
