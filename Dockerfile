# syntax=docker/dockerfile:1

# ---- build ----
FROM node:22-alpine AS build

WORKDIR /build

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime

WORKDIR /srv

RUN npm install -g serve@14

COPY --from=build /build/dist ./dist

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]