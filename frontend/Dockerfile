FROM nginx:alpine

COPY views/*.html /usr/share/nginx/html

COPY public /usr/share/nginx/html/public

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]