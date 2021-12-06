# Wormhole dev setup

## Prerequisites
```bash
sudo apt update && sudo apt upgrade -y && \
sudo apt install libatomic1 -y && \
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && \
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

NOTE:
- Restart the terminal before the next step

## Install Node.js v16

```bash
nvm install --lts && \
npm i -g yarn
```

## Prepare safecoin-web3.js

```bash
git clone https://github.com/Fair-Exchange/safecoin-web3.js.git && \
cd safecoin-web3.js && \
npm install && \
npm run build
```

NOTE:
- At the previous step `npm run build` finishes with non-zero exit code. That's a something we can deal with later. 
- Make sure you are out of the `safecoin-web3.js` folder - just execute `cd ..`

## Prepare safecoin-program-library

```bash
git clone https://github.com/Fair-Exchange/safecoin-program-library.git && \
pushd safecoin-program-library/token/js && \
rm package-lock.json && \
npm install && \
npm run build && \
popd
```

## Prepare wallet-adapter

```bash
git clone https://github.com/victorshevtsov/wallet-adapter.git && \
pushd wallet-adapter && \
yarn install && \
yarn build && \
popd
```

## Prepare wormhole

```bash
git clone https://github.com/victorshevtsov/wormhole.git && \
pushd wormhole && \
DOCKER_BUILDKIT=1 docker build --target node-export -f Dockerfile.proto -o type=local,dest=. . && \
DOCKER_BUILDKIT=1 docker build -f solana/Dockerfile.wasm -o type=local,dest=. solana && \
npm ci --prefix ethereum && \
npm ci --prefix sdk/js && \
npm run build --prefix sdk/js && \
popd
```
## Install dependencies for wormhole 

```bash
cd wormhole/bridge_ui && \
yarn install
```

## Finally start the dev server
```bash
yarn start
```

Happy hacking!
