FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173 3001

CMD ["sh", "-c", "node server.js & npm run preview -- --host"]
