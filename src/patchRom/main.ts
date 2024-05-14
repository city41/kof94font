import path from "node:path";
import fsp from "node:fs/promises";
import * as mkdirp from "mkdirp";
import { execSync } from "node:child_process";
import { asmTmpDir, romTmpDir, tmpDir } from "./dirs";
import { RomFileBuffer } from "./types";
import { injectCharTiles } from "./injectCharTiles";
import { getRom } from "./getRom";

async function writePatchedZip(
  cromBuffers: RomFileBuffer[],
  outputPath: string
): Promise<void> {
  for (const cromBuffer of cromBuffers) {
    await fsp.writeFile(
      path.resolve(romTmpDir, cromBuffer.fileName),
      new Uint8Array(cromBuffer.data)
    );
  }

  const cmd = "zip kof94.zip *";
  console.log("about to execute", cmd, "in", romTmpDir);
  const output = execSync(cmd, { cwd: romTmpDir });
  console.log(output.toString());

  const cpCmd = `cp kof94.zip ${outputPath}`;
  console.log("about to execute", cpCmd, "in", romTmpDir);
  const output2 = execSync(cpCmd, { cwd: romTmpDir });
  console.log(output2.toString());
}

async function getC1C2Buffers() {
  const c1 = await getRom(path.resolve("./kof94.zip"), "055-c1.c1");
  const c2 = await getRom(path.resolve("./kof94.zip"), "055-c2.c2");

  return [c1, c2];
}

async function main() {
  await fsp.rm(tmpDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 1000,
  });
  mkdirp.sync(romTmpDir);
  mkdirp.sync(asmTmpDir);

  const mameDir = process.env.MAME_ROM_DIR;

  if (!mameDir?.trim()) {
    throw new Error("MAME_ROM_DIR env variable is not set");
  }

  try {
    const [c1Buffer, c2Buffer] = await getC1C2Buffers();
    const finalCromBuffers = await injectCharTiles(c1Buffer, c2Buffer);

    const writePath = path.resolve(mameDir, "kof94.zip");
    await writePatchedZip(finalCromBuffers, writePath);

    console.log("wrote patched rom to", writePath);
  } catch (e) {
    console.error(e);
  }
}

main().catch((e) => console.error);
