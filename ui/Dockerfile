# Stage 1 - the build process
FROM node:14 as build-deps
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn install
COPY . ./
RUN yarn build

# Stage 2 - the production environment
FROM nginx:stable-alpine
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
COPY ./entrypoint.sh  /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 80
ENTRYPOINT ["entrypoint.sh"]