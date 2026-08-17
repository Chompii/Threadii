FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/index.js"]
