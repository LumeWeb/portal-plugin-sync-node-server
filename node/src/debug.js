import Hyperswarm from "hyperswarm";
import hypercoreCrypto from "hypercore-crypto";
import Protomux from "protomux";
import c from "compact-encoding";
import Hyperbee from "hyperbee";
import Corestore from "corestore";
import b4a from "b4a";
import fs from "fs/promises";
import path from "path";

const SYNC_PROTOCOL = "lumeweb.portal.sync5";
const DISCOVERED_BEES = new Map();
const toHex = (str) => Buffer.from(str).toString("hex");

// Get the ID argument from the command line
const id = process.argv[2];

// Generate the data and key file paths based on the ID
const dataDir = path.join("./data", id);
const keyPairFile = path.join(dataDir, "keyPair.json");

let keyPair;

try {
  await fs.mkdir(dataDir, { recursive: true });
  const keyPairData = await fs.readFile(keyPairFile, "utf8");
  const { publicKey, secretKey } = JSON.parse(keyPairData);
  keyPair = {
    publicKey: Buffer.from(publicKey, "hex"),
    secretKey: Buffer.from(secretKey, "hex"),
  };
} catch (error) {
  keyPair = hypercoreCrypto.keyPair();
  await fs.writeFile(
    keyPairFile,
    JSON.stringify({
      publicKey: keyPair.publicKey.toString("hex"),
      secretKey: keyPair.secretKey.toString("hex"),
    }),
  );
}

const swarm = new Hyperswarm({ keyPair });
const store = new Corestore(dataDir);
const bee = new Hyperbee(store.get({ keyPair }));
await bee.ready();
await store.ready();
swarm.join(hypercoreCrypto.hash(Buffer.from(SYNC_PROTOCOL)));
swarm.on("connection", (conn) => store.replicate(conn));
swarm.on("connection", (conn) => {
  const mux = Protomux.from(conn);
  if (b4a.equals(swarm.keyPair.publicKey, mux.stream.remotePublicKey)) {
    debugger;
  }
  if (mux.stream.isInitiator) {
    peerHandler(conn);
  } else {
    mux.pair({ protocol: SYNC_PROTOCOL }, peerHandler.bind(null, conn));
  }
});

function peerHandler(conn) {
  const sync = Protomux.from(conn).createChannel({
    protocol: SYNC_PROTOCOL,
  });

  const sendKey = sync.addMessage({
    encoding: c.raw,
    onmessage(m) {
      if (m.length === 32) {
        const dKey = toHex(m);
        if (!DISCOVERED_BEES.has(dKey)) {
          DISCOVERED_BEES.set(
            dKey,
            new Hyperbee(store.get({ key: m, sparse: true })),
          );
          swarm.emit("discovered");
        }
      }
    },
  });

  sync.open();
  sendKey.send(bee.key);
}

process.on("exit", async () => {
  await swarm.destroy();
});

await bee.put("hello", id);

swarm.on("discovered", async () => {
  for (const bee of DISCOVERED_BEES.values()) {
    //   await bee.createReadStream();
    console.log(await bee.get("hello"));
  }
});
