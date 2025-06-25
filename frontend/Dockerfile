# --- 1. Fázis: Build (Építő környezet) ---
# Egy teljes Node.js környezettel kezdünk
FROM node:20-alpine AS builder

# Beállítjuk a munkakönyvtárat
WORKDIR /app

# Bemásoljuk a package.json és package-lock.json fájlokat
COPY package*.json ./

# Telepítjük a függőségeket
RUN npm install

# Bemásoljuk a teljes forráskódot
COPY . .

# Lefordítjuk az alkalmazást éles verzióra
# Ez létrehozza a /app/dist mappát
RUN npm run build


# --- 2. Fázis: Production (Éles környezet) ---
# Egy pehelykönnyű Nginx szerverrel folytatjuk
FROM nginx:1.27-alpine

# Bemásoljuk a korábban létrehozott Nginx konfigurációs fájlt
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bemásoljuk a lefordított alkalmazást az "builder" fázisból
# az Nginx webszerver alapértelmezett mappájába
COPY --from=builder /app/dist /usr/share/nginx/html

# Megmondjuk a Dockernek, hogy a 80-as portot használjuk
EXPOSE 80

# Az Nginx szerver elindítása
CMD ["nginx", "-g", "daemon off;"]