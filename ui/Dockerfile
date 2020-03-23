# Stage 1 - the build process
FROM node:10 as build-deps
ARG API_URL
ENV REACT_APP_API_URL=${API_URL}
ARG API_PORT
ENV REACT_APP_API_URL=${API_PORT}
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn install
COPY . ./
RUN yarn build

# Stage 2 - the production environment
FROM nginx:stable-alpine
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
