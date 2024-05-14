import path from "node:path";
import { RomFileBuffer } from "./types";
import { createCromBytes } from "./createCromBytes";

const destQuestionTile = {
  index: 0x76,
  count: 2,
  src: "question_exclamation.png",
};
const destATile = { index: 0x498d, count: 26, src: "a_z.png" };
const destAccentTile = {
  index: 0x49d7,
  count: 10,
  src: "accented_characters.png",
};

const destinations = [destQuestionTile, destATile, destAccentTile];

function replaceTile(
  srcC1: number[],
  srcC2: number[],
  destC1: number[],
  destC2: number[],
  srcIndex: number,
  destIndex: number
) {
  for (let i = 0; i < 64; ++i) {
    const si = srcIndex * 64 + i;
    const di = destIndex * 64 + i;

    destC1[di] = srcC1[si];
    destC2[di] = srcC2[si];
  }
}

async function injectCharTiles(
  c1Buffer: RomFileBuffer,
  c2Buffer: RomFileBuffer
) {
  for (const dest of destinations) {
    console.log("injecting", dest.src);

    const srcCromResult = await createCromBytes(
      path.resolve("./resources", dest.src),
      path.resolve("./resources/font.palette.png")
    );
    const srcAlphaC1Buffer = srcCromResult.oddCromBytes;
    const srcAlphaC2Buffer = srcCromResult.evenCromBytes;

    for (let i = 0; i < dest.count; ++i) {
      replaceTile(
        srcAlphaC1Buffer,
        srcAlphaC2Buffer,
        c1Buffer.data,
        c2Buffer.data,
        i,
        i + dest.index
      );
    }
  }

  return [c1Buffer, c2Buffer];
}

export { injectCharTiles };
