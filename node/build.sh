#!/usr/bin/env bash
mkdir -p app/proto
cp -r ./node_modules/@grpc/reflection/build/proto/grpc ./app/proto
cp -r ./node_modules/grpc-health-check/proto/health ./app/proto
mkdir -p app/app/app/build/Release
cp ./node_modules/sodium-native/prebuilds/linux-x64/sodium-native.node app/app/app/build/Release
cp ./node_modules/fs-native-extensions/prebuilds/linux-x64/fs-native-extensions.node app/app/app/build/Release
cp ./node_modules/udx-native/prebuilds/linux-x64/udx-native.node app/app/app/build/Release
cp ./node_modules/crc-native/prebuilds/linux-x64/crc-native.node app/app/app/build/Release
cp ./node_modules/quickbit-native/prebuilds/linux-x64/quickbit-native.node app/app/app/build/Release

mkdir -p src/generated
./node_modules/protobufjs-cli/bin/pbjs -t json ../proto/protocol.proto > src/generated/protobuf.json
./node_modules/protobufjs-cli/bin/pbjs -t json ../grpc/grpc_stdio.proto > src/generated/grpc_stdio.json


./node_modules/.bin/rollup -c rollup.config.js --silent
zip -r ../bundle.zip app
