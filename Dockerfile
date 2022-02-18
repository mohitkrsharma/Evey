FROM node:14.15.5 as build
RUN  mkdir -p /home/node
WORKDIR /home/node
COPY . .
RUN npm install
RUN npm run build-prod

FROM nginx as frontend
RUN rm /etc/nginx/conf.d/default.conf
RUN rm /usr/share/nginx/html/index.html
COPY --from=build /home/node/dist /usr/share/nginx/html
#COPY robots.txt /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
