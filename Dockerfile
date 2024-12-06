FROM node:18.16.0-slim

WORKDIR /app

COPY package*.json ./
#COPY .env ./

RUN npm install

COPY . .

#npm run tsc compiles ts to js so no need to that
#when building a docker image from dist folder
#RUN npm run tsc

EXPOSE 80

# Start the server
CMD [ "npm", "start" ]


