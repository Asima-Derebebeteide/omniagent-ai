FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY database ./database
RUN npm run build
EXPOSE 4000
CMD ["npm","start"]
