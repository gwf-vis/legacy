# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node as build-stage
WORKDIR /app
RUN mkdir front-end
RUN mkdir vis-host
COPY package*.json /app/front-end/
COPY ../vis-host/ /app/vis-host/
WORKDIR /app/front-end
RUN npm ci
COPY . /app
RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.15
COPY --from=build-stage /app/www/ /usr/share/nginx/html