FROM node:20-alpine
WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/extraction/package.json ./packages/extraction/package.json
COPY packages/queue/package.json ./packages/queue/package.json
RUN npm install

COPY . .
RUN npm run prisma:generate -w @recruitmail/db
RUN npm run build -w @recruitmail/worker

CMD ["sh", "-c", "npm run prisma:push -w @recruitmail/db && npm run start -w @recruitmail/worker"]
