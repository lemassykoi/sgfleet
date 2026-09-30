import { describe, expect, it } from "vitest";
import {
  canonicalEnvText,
  envObjToPairs,
  envPairsToObj,
  envTextToPairs,
  flagsText,
  flagsTextToPairs,
  flagsValText,
  parseFlags,
  serializeFlags,
} from "./flags";

describe("env pairs <-> object round trip", () => {
  it("converts pairs to object skipping empty keys", () => {
    expect(
      envPairsToObj([
        { key: "A", value: "1" },
        { key: " ", value: "x" },
      ]),
    ).toEqual({ A: "1" });
  });

  it("converts object back to pairs", () => {
    expect(envObjToPairs({ A: "1", B: "2" })).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
    ]);
  });

  it("returns an empty row for empty or missing objects", () => {
    expect(envObjToPairs({})).toEqual([{ key: "", value: "" }]);
    expect(envObjToPairs(null)).toEqual([{ key: "", value: "" }]);
  });
});

describe("canonicalEnvText", () => {
  it("sorts keys so order does not affect equality", () => {
    expect(canonicalEnvText({ B: "2", A: "1" })).toBe(canonicalEnvText({ A: "1", B: "2" }));
  });

  it("handles null and primitives", () => {
    expect(canonicalEnvText(null)).toBe("(null)");
    expect(canonicalEnvText(undefined)).toBe("(null)");
    expect(canonicalEnvText("x")).toBe("x");
  });

  it("round trips through envTextToPairs", () => {
    const pairs = [{ key: "K", value: "v" }];
    expect(envTextToPairs(canonicalEnvText(envPairsToObj(pairs)))).toEqual(pairs);
  });

  it("falls back to an empty row for invalid text", () => {
    expect(envTextToPairs("not json")).toEqual([{ key: "", value: "" }]);
    expect(envTextToPairs("[1,2]")).toEqual([{ key: "", value: "" }]);
  });
});

describe("flags text round trip", () => {
  it("serializes form pairs to argv-style JSON", () => {
    expect(
      flagsText([
        { key: "--port", value: "8080" },
        { key: "--flag", value: "" },
      ]),
    ).toBe(JSON.stringify(["--port", "8080", "--flag"]));
  });

  it("restores form pairs from snapshot JSON", () => {
    expect(flagsTextToPairs(JSON.stringify(["--port", "8080", "--flag"]))).toEqual([
      { key: "--port", value: "8080" },
      { key: "--flag", value: "" },
    ]);
  });

  it("matches legacy joined-flag snapshots via parseFlags normalization", () => {
    expect(flagsTextToPairs(JSON.stringify(["--chunked-prefill-size 4096"]))).toEqual([
      { key: "--chunked-prefill-size", value: "4096" },
    ]);
  });

  it("falls back to an empty row for invalid text", () => {
    expect(flagsTextToPairs("nope")).toEqual([{ key: "", value: "" }]);
    expect(flagsTextToPairs('{"a":1}')).toEqual([{ key: "", value: "" }]);
  });

  it("normalizes legacy joined tokens in flagsValText display", () => {
    expect(flagsValText(["--chunked-prefill-size 4096"])).toBe(JSON.stringify(["--chunked-prefill-size", "4096"]));
    expect(flagsValText(null)).toBe("(null)");
  });

  it("round trips through serializeFlags", () => {
    const pairs = [{ key: "--tp", value: "2" }];
    expect(parseFlags(JSON.parse(flagsText(pairs)))).toEqual(pairs);
    expect(serializeFlags(flagsTextToPairs(flagsText(pairs)))).toEqual(["--tp", "2"]);
  });
});
