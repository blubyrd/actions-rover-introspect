FROM node:14
RUN curl -sSL https://rover.apollo.dev/nix/latest | sh
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN ls -al -R
CMD ["npm", "run", "start"]