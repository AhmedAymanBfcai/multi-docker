FROM node:alpine as builder
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# To copy all the production build assets from the builder phase. /app/build  is the default place.
COPY --from=builder /app/build /usr/share/nginx/html