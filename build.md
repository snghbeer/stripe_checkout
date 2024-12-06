BUILD image:


npm run tsc
cp package.json, .env and all non-js files into dist folder (because npm run tsc only transpiles ts into js)
cd dist

docker buildx build -t stripe_checkout:slim .

PUSH image to repo:
docker login

docker tag 501587fa0ff3 snghbeer/nivon:stripe_checkout

docker push snghbeer/nivon:stripe_checkout

"docker run -p 8001:80 stripe_checkout:local"