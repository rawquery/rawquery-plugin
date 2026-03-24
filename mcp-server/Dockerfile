FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY index.mjs .
EXPOSE 3100
CMD ["node", "index.mjs", "--sse"]
