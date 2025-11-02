"use strict";

const expect = require("chai").expect;
const fc = require("fast-check");
const kbd = require("../dist/index");

describe("deserialization", function () {
  it("should fail on non-array", function () {
    var result = () => kbd.Serial.deserialize("test");
    expect(result).to.throw();
  });

  it("should fail on non array/object data", function () {
    var result = () => kbd.Serial.deserialize(["test"]);
    expect(result).to.throw();
  });

  it("should return empty keyboard on empty array", function () {
    var input = [];
    var result = kbd.Serial.deserialize(input);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.be.empty;
    var serialized = kbd.Serial.serialize(result);
    expect(serialized).to.deep.equal(input);
  });

  describe("of metadata", function () {
    it("should parse from first object if it exists", function () {
      var input = [{ name: "test" }];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.meta.name).to.equal("test");
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should throw an exception if found anywhere other than the start", function () {
      var result = () => kbd.Serial.deserialize([[], { name: "test" }]);
      expect(result).to.throw();
    });
  });

  describe("of key positions", function () {
    it("should default to (0,0)", function () {
      var input = [["1"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.equal(0);
      expect(result.keys[0].y).to.equal(0);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should increment x position by the width of the previous key", function () {
      var input = [[{ x: 1 }, "1", "2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].x).to.equal(1);
      expect(result.keys[1].x).to.equal(
        result.keys[0].x + result.keys[0].width,
      );
      expect(result.keys[1].y).to.equal(result.keys[0].y);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should increment y position whenever a new row starts, and reset x to zero", function () {
      var input = [[{ y: 1 }, "1"], ["2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].y).to.equal(1);
      expect(result.keys[1].x).to.equal(0);
      expect(result.keys[1].y).to.equal(result.keys[0].y + 1);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should add x and y to current position", function () {
      var input1 = [["1", { x: 1 }, "2"]];
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1).to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys).to.have.length(2);
      expect(result1.keys[0].x).to.equal(0);
      expect(result1.keys[1].x).to.equal(2);
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [["1"], [{ y: 1 }, "2"]];
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2).to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys).to.have.length(2);
      expect(result2.keys[0].y).to.equal(0);
      expect(result2.keys[1].y).to.equal(2);
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);
    });

    it("should leave x2,y2 at (0,0) if not specified", function () {
      var input1 = [[{ x: 1, y: 1 }, "1"]];
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1).to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys).to.have.length(1);
      expect(result1.keys[0].x).to.not.equal(0);
      expect(result1.keys[0].y).to.not.equal(0);
      expect(result1.keys[0].x2).to.equal(0);
      expect(result1.keys[0].y2).to.equal(0);
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [[{ x: 1, y: 1, x2: 2, y2: 2 }, "1"]];
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2).to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys).to.have.length(1);
      expect(result2.keys[0].x).to.not.equal(0);
      expect(result2.keys[0].y).to.not.equal(0);
      expect(result2.keys[0].x2).to.not.equal(0);
      expect(result2.keys[0].y2).to.not.equal(0);
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);
    });

    it("should add x and y to center of rotation", function () {
      var input = [[{ r: 10, rx: 1, ry: 1, y: -1.1, x: 2 }, "E"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.equal(3);
      expect(result.keys[0].y).to.be.closeTo(-0.1, 0.0001);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });
  });

  describe("of key sizes", function () {
    it("should reset width and height to 1", function () {
      var input1 = [[{ w: 5 }, "1", "2"]];
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1).to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys).to.have.length(2);
      expect(result1.keys[0].width).to.equal(5);
      expect(result1.keys[1].width).to.equal(1);
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [[{ h: 5 }, "1", "2"]];
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2).to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys).to.have.length(2);
      expect(result2.keys[0].height).to.equal(5);
      expect(result2.keys[1].height).to.equal(1);
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);
    });

    it("should default width2/height2 if not specified", function () {
      var input = [[{ w: 2, h: 2 }, "1", { w: 2, h: 2, w2: 4, h2: 4 }, "2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].width2).to.equal(result.keys[0].width);
      expect(result.keys[0].height2).to.equal(result.keys[0].height);
      expect(result.keys[1].width2).to.not.equal(result.keys[1].width);
      expect(result.keys[1].height2).to.not.equal(result.keys[1].width);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });
  });

  describe("of other properties", function () {
    it("should reset stepped, homing, and decal flags to false", function () {
      var input = [[{ l: true, n: true, d: true }, "1", "2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].stepped).to.be.true;
      expect(result.keys[0].nub).to.be.true;
      expect(result.keys[0].decal).to.be.true;
      expect(result.keys[1].stepped).to.be.false;
      expect(result.keys[1].nub).to.be.false;
      expect(result.keys[1].decal).to.be.false;
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should propagate and reset the ghost flag", function () {
      var input = [["0", { g: true }, "1", "2", { g: false }, "3"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(4);
      expect(result.keys[0].ghost).to.be.false;
      expect(result.keys[1].ghost).to.be.true;
      expect(result.keys[2].ghost).to.be.true;
      expect(result.keys[3].ghost).to.be.false;
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should propagate and reset the profile flag", function () {
      var input = [["0", { p: "DSA" }, "1", "2", { p: "" }, "3"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(4);
      expect(result.keys[0].profile).to.be.empty;
      expect(result.keys[1].profile).to.equal("DSA");
      expect(result.keys[2].profile).to.equal("DSA");
      expect(result.keys[3].profile).to.be.empty;
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should propagate and reset switch properties", function () {
      var input1 = [["1", { sm: "cherry" }, "2", "3", { sm: "" }, "4"]];
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1, "sm").to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys, "sm").to.have.length(4);
      expect(result1.keys[0].sm, "sm_0").to.equal("");
      expect(result1.keys[1].sm, "sm_1").to.equal("cherry");
      expect(result1.keys[2].sm, "sm_2").to.equal("cherry");
      expect(result1.keys[3].sm, "sm_3").to.equal("");
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [["1", { sb: "cherry" }, "2", "3", { sb: "" }, "4"]];
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2, "sb").to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys, "sb").to.have.length(4);
      expect(result2.keys[0].sb, "sb_0").to.equal("");
      expect(result2.keys[1].sb, "sb_1").to.equal("cherry");
      expect(result2.keys[2].sb, "sb_2").to.equal("cherry");
      expect(result2.keys[3].sb, "sb_3").to.equal("");
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);

      var input3 = [["1", { st: "MX1A-11Nx" }, "2", "3", { st: "" }, "4"]];
      var result3 = kbd.Serial.deserialize(input3);
      expect(result3, "st").to.be.an.instanceOf(kbd.Keyboard);
      expect(result3.keys, "st").to.have.length(4);
      expect(result3.keys[0].st, "st_0").to.equal("");
      expect(result3.keys[1].st, "st_1").to.equal("MX1A-11Nx");
      expect(result3.keys[2].st, "st_2").to.equal("MX1A-11Nx");
      expect(result3.keys[3].st, "st_3").to.equal("");
      var serialized3 = kbd.Serial.serialize(result3);
      expect(serialized3).to.deep.equal(input3);
    });
  });

  describe("of text color", function () {
    it("should apply colors to all subsequent keys", function () {
      var input = [[{ c: "#ff0000", t: "#00ff00" }, "1", "2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].color).to.equal("#ff0000");
      expect(result.keys[1].color).to.equal("#ff0000");
      expect(result.keys[0].default.textColor).to.equal("#00ff00");
      expect(result.keys[1].default.textColor).to.equal("#00ff00");
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should apply `t` to all legends", function () {
      var input = [
        [{ a: 0, t: "#444444" }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#444444");
      for (var i = 0; i < 12; ++i) {
        expect(result.keys[0].textColor[i], `[${i}]`).to.equal("");
      }
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle generic case", function () {
      var labels =
        "#111111\n#222222\n#333333\n#444444\n" +
        "#555555\n#666666\n#777777\n#888888\n" +
        "#999999\n#aaaaaa\n#bbbbbb\n#cccccc";
      var input = [[{ a: 0, t: labels }, labels]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#111111");
      for (var i = 0; i < 12; ++i) {
        expect(
          result.keys[0].textColor[i] || result.keys[0].default.textColor,
          `i=${i}`,
        ).to.equal(result.keys[0].labels[i]);
      }
      // Serialization now uses separate 't' and 'ta' properties
      var serialized = kbd.Serial.serialize(result);
      var expected = [
        [
          {
            a: 0,
            t: "#111111",
            ta: "\n#222222\n#333333\n#444444\n#555555\n#666666\n#777777\n#888888\n#999999\n#aaaaaa\n#bbbbbb\n#cccccc",
          },
          labels,
        ],
      ];
      expect(serialized).to.deep.equal(expected);
    });

    it("should handle blanks", function () {
      var labels =
        "#111111\nXX\n#333333\n#444444\n" +
        "XX\n#666666\nXX\n#888888\n" +
        "#999999\n#aaaaaa\n#bbbbbb\n#cccccc";
      var input = [[{ a: 0, t: labels.replace(/XX/g, "") }, labels]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#111111");
      for (var i = 0; i < 12; ++i) {
        // if blank, should be same as color[0] / default
        var color =
          result.keys[0].textColor[i] || result.keys[0].default.textColor;
        if (result.keys[0].labels[i] === "XX")
          expect(color, `i=${i}`).to.equal("#111111");
        else expect(color, `i=${i}`).to.equal(result.keys[0].labels[i]);
      }
      // Serialization now uses separate 't' and 'ta' properties
      var serialized = kbd.Serial.serialize(result);
      var expected = [
        [
          {
            a: 0,
            t: "#111111",
            ta: "\n\n#333333\n#444444\n\n#666666\n\n#888888\n#999999\n#aaaaaa\n#bbbbbb\n#cccccc",
          },
          labels,
        ],
      ];
      expect(serialized).to.deep.equal(expected);
    });

    it("should not reset default color if blank", function () {
      var input = [[{ t: "#ff0000" }, "1", { t: "\n#00ff00" }, "2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].default.textColor, "[0]").to.equal("#ff0000");
      expect(result.keys[1].default.textColor, "[1]").to.equal("#ff0000");
      // Note: Perfect roundtrip not expected due to KLE spec cleanup behavior
      // The color at position 1 gets removed because there's no corresponding label
      var serialized = kbd.Serial.serialize(result);
      var expected = [[{ t: "#ff0000" }, "1", "2"]];
      expect(serialized).to.deep.equal(expected);
    });

    it("should not fail if undefined in deserialized", function () {
      var input = [[{ t: "#ff0000" }, "1", { t: "\n#00ff00" }, "2"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      result.keys[0].default.textColor = "#000000";
      result.keys[1].default.textColor = "#000000";
      result.keys[0].textColor[1] = undefined;
      result.keys[1].textColor[2] = undefined;
      var serialized = kbd.Serial.serialize(result);
      var expected = [["1", "2"]];
      expect(serialized).to.deep.equal(expected);
    });

    it("should delete values equal to the default", function () {
      var input = [
        [
          { t: "#ff0000" },
          "1",
          { t: "\n#ff0000" },
          "\n2",
          { t: "\n#00ff00" },
          "\n3",
        ],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[1].labels[6]).to.equal("2");
      expect(result.keys[1].textColor[6]).to.equal("");
      expect(result.keys[2].labels[6]).to.equal("3");
      expect(result.keys[2].textColor[6]).to.equal("#00ff00");
      // Serialization now uses separate 't' and 'ta' properties
      var serialized = kbd.Serial.serialize(result);
      var expected = [
        [{ t: "#ff0000" }, "1", "\n2", { ta: "\n#00ff00" }, "\n3"],
      ];
      expect(serialized).to.deep.equal(expected);
    });

    describe("new 'ta' format", function () {
      it("should deserialize 't' as default only", function () {
        var input = [[{ t: "#ff0000" }, "A"]];
        var result = kbd.Serial.deserialize(input);
        expect(result).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys).to.have.length(1);
        expect(result.keys[0].default.textColor).to.equal("#ff0000");
        // All textColor positions should be undefined (using default)
        for (var i = 0; i < 12; ++i) {
          expect(result.keys[0].textColor[i]).to.equal("");
        }
        var serialized = kbd.Serial.serialize(result);
        expect(serialized).to.deep.equal(input);
      });

      it("should deserialize 'ta' as per-label colors without changing default", function () {
        var input = [[{ t: "#ff0000" }, "A", { ta: "\n#00ff00" }, "\nB"]];
        var result = kbd.Serial.deserialize(input);
        expect(result).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys).to.have.length(2);
        // Default should remain #ff0000 for both keys
        expect(result.keys[0].default.textColor).to.equal("#ff0000");
        expect(result.keys[1].default.textColor).to.equal("#ff0000");
        // Second key should have per-label color at position 6
        expect(result.keys[1].textColor[6]).to.equal("#00ff00");
        var serialized = kbd.Serial.serialize(result);
        expect(serialized).to.deep.equal(input);
      });

      it("should serialize with both 't' and 'ta' when needed", function () {
        var keyboard = new kbd.Keyboard();
        var key = new kbd.Key();
        key.labels = ["A", "", "", "", "", "", "B", "", "", "", "", ""];
        key.default.textColor = "#ff0000";
        key.textColor[6] = "#00ff00"; // Position 6 has different color
        keyboard.keys.push(key);

        var serialized = kbd.Serial.serialize(keyboard);
        // Labels get optimized to remove trailing empty positions
        expect(serialized).to.deep.equal([
          [{ t: "#ff0000", ta: "\n#00ff00" }, "A\nB"],
        ]);
      });

      it("should handle roundtrip for new format", function () {
        var input = [
          [{ t: "#ff0000", ta: "\n#00ff00\n\n#0000ff" }, "A\nB\n\nD"],
        ];
        var result = kbd.Serial.deserialize(input);
        expect(result).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys).to.have.length(1);
        expect(result.keys[0].default.textColor).to.equal("#ff0000");
        // With default alignment (4): KLE pos 1→internal 6, KLE pos 3→internal 8
        expect(result.keys[0].textColor[6]).to.equal("#00ff00"); // B at internal position 6
        expect(result.keys[0].textColor[8]).to.equal("#0000ff"); // D at internal position 8
        var serialized = kbd.Serial.serialize(result);
        expect(serialized).to.deep.equal(input);
      });

      it("should handle propagation for new format", function () {
        var input = [[{ ta: "\n#ff0000" }, "1\n1", "1\n1"]];
        var result = kbd.Serial.deserialize(input);
        expect(result).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys).to.have.length(2);
        expect(result.keys[0].default.textColor).to.equal("#000000");
        expect(result.keys[1].default.textColor).to.equal("#000000");
        expect(result.keys[0].textColor[0]).to.equal("");
        expect(result.keys[1].textColor[0]).to.equal("");
        // With default alignment (4): KLE pos 1→internal 6
        expect(result.keys[0].textColor[6]).to.equal("#ff0000");
        expect(result.keys[1].textColor[6]).to.equal("#ff0000");
        var serialized = kbd.Serial.serialize(result);
        expect(serialized).to.deep.equal(input);
      });

      it("should handle legacy format with most common color", function () {
        // Legacy: all positions have different colors, #222222 appears twice
        var input = [
          [{ a: 0, t: "#111111\n#222222\n#222222\n#444444" }, "A\nB\nC\nD"],
        ];
        var result = kbd.Serial.deserialize(input);
        expect(result).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys).to.have.length(1);
        // #222222 is most common, should become default
        expect(result.keys[0].default.textColor).to.equal("#222222");
        // With alignment 0: KLE positions → internal: 0→0, 1→6, 2→2, 3→8
        // Positions with #222222 should be undefined (cleaned up)
        expect(result.keys[0].textColor[6]).to.equal(""); // B at internal position 6
        expect(result.keys[0].textColor[2]).to.equal(""); // C at internal position 2
        // Other positions should have their colors
        expect(result.keys[0].textColor[0]).to.equal("#111111"); // A at internal position 0
        expect(result.keys[0].textColor[8]).to.equal("#444444"); // D at internal position 8
        // Serialization uses new format (alignment may be re-optimized by serializer)
        var serialized = kbd.Serial.serialize(result);
        expect(serialized[0][0]).to.have.property("t", "#222222");
        expect(serialized[0][0]).to.have.property("ta");
        expect(serialized[0][1]).to.equal("A\nB\nC\nD");
      });

      it("should handle 'ta' with all alignments", function () {
        // Test with alignments that support position 0 (all alignments support this)
        for (var a = 0; a <= 7; ++a) {
          var name = `a=${a}`;
          var input = [[{ a: a, t: "#ff0000", ta: "#00ff00" }, "A"]];
          var result = kbd.Serial.deserialize(input);
          expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
          expect(result.keys, name).to.have.length(1);
          expect(result.keys[0].default.textColor, name).to.equal("#ff0000");
          // Verify that 'ta' was correctly applied at position 0
          // Position 0 in KLE maps to different internal positions based on alignment
          var hasPerLabelColor = result.keys[0].textColor.some(
            (c) => c === "#00ff00",
          );
          expect(hasPerLabelColor, name).to.be.true;
        }
      });
    });
  });

  describe("of rotation", function () {
    it("should not be allowed on anything but the first key in a row", function () {
      var r1 = () => kbd.Serial.deserialize([[{ r: 45 }, "1", "2"]]);
      expect(r1).to.not.throw();
      var rx1 = () => kbd.Serial.deserialize([[{ rx: 45 }, "1", "2"]]);
      expect(rx1).to.not.throw();
      var ry1 = () => kbd.Serial.deserialize([[{ ry: 45 }, "1", "2"]]);
      expect(ry1).to.not.throw();

      var r2 = () => kbd.Serial.deserialize([["1", { r: 45 }, "2"]]);
      expect(r2).to.throw();
      var rx2 = () => kbd.Serial.deserialize([["1", { rx: 45 }, "2"]]);
      expect(rx2).to.throw();
      var ry2 = () => kbd.Serial.deserialize([["1", { ry: 45 }, "2"]]);
      expect(ry2).to.throw();
    });
  });

  describe("of legends", function () {
    it("should align legend positions correctly", function () {
      // Some history, to make sense of this:
      // 1. Originally, you could only have top & botton legends, and they were
      //    left-aligned. (top:0 & bottom:1)
      // 2. Next, we added right-aligned labels (top:2 & bottom:3).
      // 3. Next, we added front text (left:4, right:5).
      // 4. Next, we added the alignment flags that allowed you to move the
      //    labels (0-5) to the centered positions (via checkboxes).
      // 5. Nobody understood the checkboxes.  They were removed in favor of
      //    twelve separate label editors, allowing text to be placed anywhere.
      //    This introduced labels 6 through 11.
      // 6. The internal rendering is now Top->Bottom, Left->Right, but to keep
      //    the file-format unchanged, the serialization code now translates
      //    the array from the old layout to the new internal one.

      // prettier-ignore
      var expected = [
        // top row   /**/ middle row /**/ bottom row  /**/   front
        ["0","8","2",/**/"6","9","7",/**/"1","10","3",/**/"4","11","5"], // a=0
        [   ,"0",   ,/**/   ,"6",   ,/**/   , "1",   ,/**/"4","11","5"], // a=1 (center horz)
        [   ,   ,   ,/**/"0","8","2",/**/   ,    ,   ,/**/"4","11","5"], // a=2 (center vert)
        [   ,   ,   ,/**/   ,"0",   ,/**/   ,    ,   ,/**/"4","11","5"], // a=3 (center both)

        ["0","8","2",/**/"6","9","7",/**/"1","10","3",/**/   , "4",   ], // a=4 (center front)
        [   ,"0",   ,/**/   ,"6",   ,/**/   , "1",   ,/**/   , "4",   ], // a=5 (center front+horz)
        [   ,   ,   ,/**/"0","8","2",/**/   ,    ,   ,/**/   , "4",   ], // a=6 (center front+vert)
        [   ,   ,   ,/**/   ,"0",   ,/**/   ,    ,   ,/**/   , "4",   ], // a=7 (center front+both)
      ];

      for (var a = 0; a <= 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"],
        ]);
        expect(expected[a], name).to.not.be.undefined;
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        // Labels are now always 12-element arrays with empty strings for undefined positions
        expect(result.keys[0].labels, name).to.have.length(12);
        // Convert sparse expected array to 12-element array with empty strings
        var expectedFull = Array(12)
          .fill("")
          .map((_, i) => expected[a][i] || "");
        expect(result.keys[0].labels, name).to.deep.equal(expectedFull);
      }
    });
  });

  describe("of font sizes", function () {
    it("should handle `f` at all alignments", function () {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ f: 1, a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"],
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        expect(result.keys[0].default.textSize, name).to.equal(1);
        // textSize is now always a 12-element array, all elements should be undefined when using default
        expect(result.keys[0].textSize, name).to.have.length(12);
        for (var i = 0; i < 12; ++i) {
          expect(result.keys[0].textSize[i], `${name} [${i}]`).to.equal(0);
        }
      }
    });

    it("should handle `f2` at all alignments", function () {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ f: 1, f2: 2, a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"],
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        // Validation: textSize should only have numeric array indices (0-11), no string keys
        var textSizeKeys = Object.keys(result.keys[0].textSize);
        expect(textSizeKeys, `${name} textSize keys length`).to.have.length(12);
        for (var k = 0; k < textSizeKeys.length; k++) {
          var key = textSizeKeys[k];
          var keyInt = parseInt(key);
          expect(keyInt, `${name} key ${key} is integer`).to.equal(keyInt);
          expect(keyInt, `${name} key ${key} >= 0`).to.be.at.least(0);
          expect(keyInt, `${name} key ${key} <= 11`).to.be.at.most(11);
        }

        // All labels should be 2, except the first one ('0')
        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          // Validation: all textSize values should be numbers
          expect(typeof result.keys[0].textSize[i], name_i).to.equal("number");

          if (result.keys[0].labels[i]) {
            var expected = result.keys[0].labels[i] === "0" ? 1 : 2;
            if (result.keys[0].labels[i] === "0") {
              expect(result.keys[0].textSize[i], name_i).to.equal(0);
            } else {
              expect(result.keys[0].textSize[i], name_i).to.equal(2);
            }
          } else {
            // no text at [i]; textSize should be undefined
            expect(result.keys[0].textSize[i], name_i).to.equal(0);
          }
        }
      }
    });

    it("should handle `fa` at all alignments", function () {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [
            { f: 1, fa: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], a: a },
            "2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13",
          ],
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        // Validation: textSize should only have numeric array indices (0-11), no string keys
        var textSizeKeys = Object.keys(result.keys[0].textSize);
        expect(textSizeKeys, `${name} textSize keys length`).to.have.length(12);
        for (var k = 0; k < textSizeKeys.length; k++) {
          var key = textSizeKeys[k];
          var keyInt = parseInt(key);
          expect(keyInt, `${name} key ${key} is integer`).to.equal(keyInt);
          expect(keyInt, `${name} key ${key} >= 0`).to.be.at.least(0);
          expect(keyInt, `${name} key ${key} <= 11`).to.be.at.most(11);
        }

        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          // Validation: all textSize values should be numbers
          expect(typeof result.keys[0].textSize[i], name_i).to.equal("number");

          if (result.keys[0].labels[i]) {
            expect(result.keys[0].textSize[i], name_i).to.equal(
              parseInt(result.keys[0].labels[i]),
            );
          }
        }
      }
    });

    it("should handle blanks in `fa`", function () {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [
            { f: 1, fa: [, 2, , 4, , 6, , 8, 9, 10, , 12], a: a },
            "x\n2\nx\n4\nx\n6\nx\n8\n9\n10\nx\n12",
          ],
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i] === "x") {
            expect(result.keys[0].textSize[i], name_i).to.equal(0);
          }
        }
      }
    });

    it("should not reset default size if blank", function () {
      var result = kbd.Serial.deserialize([
        [{ f: 1 }, "1", { fa: [, 2] }, "2"],
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].default.textSize, "[0]").to.equal(1);
      expect(result.keys[1].default.textSize, "[1]").to.equal(1);
    });

    it("should delete values equal to the default", function () {
      var result = kbd.Serial.deserialize([
        [{ f: 1 }, "1", { fa: [, 1] }, "\n2", { fa: [, 2] }, "\n3"],
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[1].labels[6]).to.equal("2");
      expect(result.keys[1].textSize[6]).to.equal(0);
      expect(result.keys[2].labels[6]).to.equal("3");
      expect(result.keys[2].textSize[6]).to.equal(2);
    });

    it("should use `fa` when both `f2` and `fa` are defined (fa takes precedence)", function () {
      var result = kbd.Serial.deserialize([
        [
          { f: 1, f2: 5, fa: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
          "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11",
        ],
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);

      // Validation: textSize should only have numeric array indices (0-11), no string keys
      var textSizeKeys = Object.keys(result.keys[0].textSize);
      expect(textSizeKeys).to.have.length(12);
      for (var k = 0; k < textSizeKeys.length; k++) {
        var key = textSizeKeys[k];
        var keyInt = parseInt(key);
        expect(keyInt).to.equal(keyInt);
        expect(keyInt).to.be.at.least(0);
        expect(keyInt).to.be.at.most(11);
      }

      // fa should be used, not f2
      // fa values are in serialized format and will be reordered by alignment (default is 4)
      for (var i = 0; i < 12; ++i) {
        expect(typeof result.keys[0].textSize[i]).to.equal("number");
        if (result.keys[0].labels[i]) {
          // Each label position should have the font size from fa, not f2 (5)
          var labelIndex = parseInt(result.keys[0].labels[i]);
          expect(result.keys[0].textSize[i]).to.equal(labelIndex + 2);
        } else {
          expect(result.keys[0].textSize[i]).to.equal(0);
        }
      }
    });

    it("should remove trailing empty values in `fa`", function () {
      var keyboard = new kbd.Keyboard();
      var key = new kbd.Key();
      key.labels[1] = "X";
      key.labels[4] = "X";
      key.labels[7] = "X";
      key.textSize[1] = 4;
      keyboard.keys.push(key);
      var serialized = kbd.Serial.serialize(keyboard);
      var expected = [[{ a: 5, fa: [4] }, "X\nX\n\n\n\n\nX"]];
      expect(serialized).to.deep.equal(expected);
    });
  });

  describe("edge cases and advanced scenarios", function () {
    it("should handle complex rotation with positioning", function () {
      var input = [[{ r: 45, rx: 5, ry: 3, x: 1, y: 2 }, "A", { x: 0.5 }, "B"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].rotation_angle).to.equal(45);
      expect(result.keys[0].rotation_x).to.equal(5);
      expect(result.keys[0].rotation_y).to.equal(3);
      // Rotation values should propagate to subsequent keys
      expect(result.keys[1].rotation_angle).to.equal(45);
      expect(result.keys[1].rotation_x).to.equal(5);
      expect(result.keys[1].rotation_y).to.equal(3);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle stepped keys with complex sizing", function () {
      var input = [
        [
          { w: 2.25, h: 2, w2: 1.25, h2: 1, x2: -0.75, y2: 1, l: true },
          "Enter",
        ],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].stepped).to.be.true;
      expect(result.keys[0].width2).to.equal(1.25);
      expect(result.keys[0].x2).to.equal(-0.75);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle decal and ghost keys", function () {
      var input = [[{ d: true }, "Decal", { g: true }, "Ghost"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].decal).to.be.true;
      expect(result.keys[1].ghost).to.be.true;
      expect(result.keys[1].decal).to.be.false; // resets to false
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle complex switch properties", function () {
      var input = [
        [{ sm: "cherry", sb: "gateron", st: "red" }, "A", { st: "blue" }, "B"],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].sm).to.equal("cherry");
      expect(result.keys[0].sb).to.equal("gateron");
      expect(result.keys[0].st).to.equal("red");
      // Switch mount and brand should propagate, switch type gets overridden
      expect(result.keys[1].sm).to.equal("cherry");
      expect(result.keys[1].sb).to.equal("gateron");
      expect(result.keys[1].st).to.equal("blue");
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle keyboard metadata", function () {
      var input = [
        {
          name: "Test Keyboard",
          author: "Test Author",
          backcolor: "#123456",
          notes: "Test notes",
        },
        ["A", "B"],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.meta.name).to.equal("Test Keyboard");
      expect(result.meta.author).to.equal("Test Author");
      expect(result.meta.backcolor).to.equal("#123456");
      expect(result.meta.notes).to.equal("Test notes");
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle mixed font sizes with f2 and fa", function () {
      var input = [
        [{ f: 2, f2: 4 }, "A\nB\nC", { fa: [3, , 5, 6] }, "D\nE\nF\nG"],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].default.textSize).to.equal(2);
      // Default font size should propagate to second key
      expect(result.keys[1].default.textSize).to.equal(2);
      // Verify f2 and fa text sizes are applied correctly
      // f2 should apply size 4 to all non-default positions (1-11)
      // With default alignment (a=4), labels A\nB\nC map to positions [0,6,2]
      // Position 0 uses default size (2), positions 6,2 get f2 size (4)
      expect(result.keys[0].textSize[2]).to.equal(4); // C at position 2
      expect(result.keys[0].textSize[6]).to.equal(4); // B at position 6
      expect(result.keys[1].textSize[0]).to.equal(3); // fa overrides
      expect(result.keys[1].textSize[2]).to.equal(5);
      // kle-serial2: we do not serialize with f2, unnecessary optimization
      var serialized = kbd.Serial.serialize(result);
      var expected = [
        [
          { f: 2, fa: [0, 4, 4] },
          "A\nB\nC",
          { fa: [3, 0, 5, 6] },
          "D\nE\nF\nG",
        ],
      ];
      expect(serialized).to.deep.equal(expected);
    });

    it("should handle mixed f and f2", function () {
      var input = [[{ f: 1, f2: 2 }, "\nA"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textSize).to.equal(1);
      expect(result.keys[0].textSize[6]).to.equal(2);

      // Validation: all textSize values should be numbers
      for (var i = 0; i < 12; i++) {
        expect(typeof result.keys[0].textSize[i]).to.equal("number");
        if (i != 6) {
          // no text at [i]; textSize should be 0
          expect(result.keys[0].textSize[i]).to.equal(0);
        }
      }
    });

    it("should handle profile and nub combinations", function () {
      var input = [
        [{ p: "DSA", n: true }, "F", { p: "SA R1", n: true }, "J", "K"],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[0].profile).to.equal("DSA");
      expect(result.keys[0].nub).to.be.true;
      expect(result.keys[1].profile).to.equal("SA R1");
      expect(result.keys[1].nub).to.be.true; // nub doesn't propagate, set explicitly
      // Profile should propagate, nub should reset to false
      expect(result.keys[2].profile).to.equal("SA R1");
      expect(result.keys[2].nub).to.be.false;
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle multiple rows with different alignments", function () {
      var input = [["A"], [{ a: 7 }, "B"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle complex mixed properties with inheritance", function () {
      var input = [
        [
          {
            r: 30,
            rx: 2,
            ry: 1,
            w: 1.5,
            h: 2,
            c: "#ff0000",
            p: "Cherry",
            l: true,
            n: true,
          },
          "Key1",
          "Key2",
        ],
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      // First key has all properties
      expect(result.keys[0].rotation_angle).to.equal(30);
      expect(result.keys[0].color).to.equal("#ff0000");
      expect(result.keys[0].profile).to.equal("Cherry");
      expect(result.keys[0].stepped).to.be.true;
      expect(result.keys[0].nub).to.be.true;
      // Second key inherits some properties, resets others
      expect(result.keys[1].rotation_angle).to.equal(30); // propagates
      expect(result.keys[1].color).to.equal("#ff0000"); // propagates
      expect(result.keys[1].profile).to.equal("Cherry"); // propagates
      expect(result.keys[1].stepped).to.be.false; // resets
      expect(result.keys[1].nub).to.be.false; // resets
      expect(result.keys[1].width).to.equal(1); // resets
      expect(result.keys[1].height).to.equal(1); // resets
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });
  });
});

describe("serialization", function () {
  it("should not care so much about matching elements", function () {
    var keyboard = new kbd.Keyboard();
    var key = new kbd.Key();
    key.labels = [
      undefined,
      undefined,
      undefined,
      undefined,
      "x",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ];
    // all these variants should yield same result
    var textColors = [
      [undefined, undefined, undefined, undefined, "#ff0000"],
      [
        undefined,
        undefined,
        undefined,
        undefined,
        "#ff0000",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ],
      [
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#ff0000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
      ],
      [
        undefined,
        undefined,
        undefined,
        undefined,
        "#ff0000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
        "#000000",
      ],
    ];
    var expected = [[{ t: "#ff0000", a: 7 }, "x"]];

    for (var i = 0; i < textColors.length; ++i) {
      key.textColor = textColors[i];
      keyboard.keys = [key];
      var serialized = kbd.Serial.serialize(keyboard);
      expect(serialized).to.deep.equal(expected);
    }
  });

  it("should properly handle first key at y=-1", function () {
    var keyboard = new kbd.Keyboard();
    var key = new kbd.Key();
    key.labels = "A";
    key.y = -1;
    keyboard.keys.push(key);
    var serialized = kbd.Serial.serialize(keyboard);
    var expected = [[{ y: -1 }, "A"]];
    expect(serialized).to.deep.equal(expected);
  });

  it("should handle nulls and undefined", function () {
    var keyboard = new kbd.Keyboard();
    var key = new kbd.Key();
    key.labels[0] = "A";
    key.labels[1] = null;
    key.labels[5] = undefined;
    key.textColor[1] = null;
    key.textColor[5] = undefined;
    key.textColor[6] = "";
    key.textSize[5] = null;
    key.textSize[9] = undefined;
    key.textSize[1] = 0;
    keyboard.keys.push(key);
    var serialized = kbd.Serial.serialize(keyboard);
    var expected = [["A"]];
    expect(serialized).to.deep.equal(expected);
  });
});

// Properties
describe("properties", () => {
  // Serialize/Deserialize roundtrip property test
  describe("serialize/deserialize roundtrip", () => {
    // Arbitrary for valid color strings (hex colors)
    // Only 6-char hex codes to ensure perfect roundtrips without normalization
    const colorArb = fc.oneof(
      fc.constant("#000000"),
      fc.constant("#ffffff"),
      fc.constant("#ff0000"),
      fc.constant("#00ff00"),
      fc.constant("#0000ff"),
      fc.constant("#cccccc"),
    );

    // Arbitrary for labels (strings or empty)
    const labelArb = fc.oneof(
      fc.constant(""),
      fc.string({ minLength: 1, maxLength: 20 }),
    );

    // Arbitrary for text sizes (positive numbers, reasonable range)
    const textSizeArb = fc.integer({ min: 1, max: 9 });

    // Arbitrary for positions and dimensions (reasonable numeric ranges)
    const positionArb = fc.integer({ min: -100, max: 100 });
    const dimensionArb = fc.integer({ min: 1, max: 10 });

    // Arbitrary for rotation angles (degrees)
    const rotationArb = fc.integer({ min: -360, max: 360 });

    // Arbitrary for boolean flags
    const booleanArb = fc.boolean();

    // Arbitrary for profile and switch strings
    const profileArb = fc.oneof(
      fc.constant(""),
      fc.constant("DSA"),
      fc.constant("SA"),
      fc.constant("Cherry"),
      fc.constant("OEM"),
      fc.string({ minLength: 1, maxLength: 20 }),
    );

    const numberOfLabels = 12;
    // Dense arrays: always exactly 12 elements with no holes
    const cleanLabelsArb = fc.array(labelArb, {
      minLength: numberOfLabels,
      maxLength: numberOfLabels,
    });

    const cleanTextColorsArb = fc.array(colorArb, {
      minLength: numberOfLabels,
      maxLength: numberOfLabels,
    });
    // to see if allowed optimization works:
    const repeatedTextColorArb = colorArb.chain((color) =>
      fc.array(fc.constant(color), {
        minLength: numberOfLabels,
        maxLength: numberOfLabels,
      }),
    );

    const cleanTextSizesArb = fc.array(textSizeArb, {
      minLength: numberOfLabels,
      maxLength: numberOfLabels,
    });
    // to see if allowed optimization works:
    const repeatedTextSizeArb = textSizeArb.chain((size) =>
      fc.array(fc.constant(size), {
        minLength: numberOfLabels,
        maxLength: numberOfLabels,
      }),
    );

    // Arbitrary for a single key with CLEAN initial state
    // Clean state means:
    // 1. textColor/textSize only defined (non-default) for positions with non-empty labels
    // 2. textColor/textSize don't equal the default values (otherwise they get cleaned up)
    // 3. Use Key class defaults: textColor="#000000", textSize=3
    const DEFAULT_TEXT_COLOR = "#000000";
    const DEFAULT_TEXT_SIZE = 3;

    const cleanKeyArb = cleanLabelsArb.chain((labels) => {
      // For each label position, determine if it's non-empty
      // Match deserialization logic: !label means empty (falsy: null, undefined, "")
      // Single space " " is considered a valid label!
      const hasLabel = labels.map((l) => !!l);

      // Generate key color first
      return colorArb.chain((keyColor) => {
        // Generate textColor:
        // - For positions with labels: use a color different from default and key color
        // - For positions without labels: use ""
        const keyTextColorArb = fc.tuple(
          ...hasLabel.map((has) =>
            has
              ? colorArb.filter(
                  (c) => c !== DEFAULT_TEXT_COLOR && c !== keyColor,
                )
              : fc.constant(""),
          ),
        );

        // Generate textSize:
        // - For positions with labels: use a size different from default
        // - For positions without labels: use 0
        const keyTextSizeArb = fc.tuple(
          ...hasLabel.map((has) =>
            has
              ? textSizeArb.filter((s) => s !== DEFAULT_TEXT_SIZE)
              : fc.constant(0),
          ),
        );

        return fc.record({
          color: fc.constant(keyColor),
          labels: fc.constant(labels),
          textColor: keyTextColorArb,
          textSize: keyTextSizeArb,
          x: positionArb,
          y: positionArb,
          width: dimensionArb,
          height: dimensionArb,
          x2: positionArb,
          y2: positionArb,
          width2: dimensionArb,
          height2: dimensionArb,
          rotation_x: positionArb,
          rotation_y: positionArb,
          rotation_angle: rotationArb,
          decal: booleanArb,
          ghost: booleanArb,
          stepped: booleanArb,
          nub: booleanArb,
          profile: profileArb,
          sm: profileArb,
          sb: profileArb,
          st: profileArb,
        });
      });
    });

    const setKeyData = (key, keyData) => {
      // Manual assignment to avoid Object.assign issues
      key.color = keyData.color;
      // Ensure arrays are proper Array12 type, not tuples
      key.labels = Array.from(keyData.labels);
      key.textColor = Array.from(keyData.textColor);
      key.textSize = Array.from(keyData.textSize);
      key.x = keyData.x;
      key.y = keyData.y;
      key.width = keyData.width;
      key.height = keyData.height;
      key.x2 = keyData.x2;
      key.y2 = keyData.y2;
      key.width2 = keyData.width2;
      key.height2 = keyData.height2;
      key.rotation_x = keyData.rotation_x;
      key.rotation_y = keyData.rotation_y;
      key.rotation_angle = keyData.rotation_angle;
      key.decal = keyData.decal;
      key.ghost = keyData.ghost;
      key.stepped = keyData.stepped;
      key.nub = keyData.nub;
      key.profile = keyData.profile;
      key.sm = keyData.sm;
      key.sb = keyData.sb;
      key.st = keyData.st;
    };

    it("should perfectly roundtrip single key with clean properties", function () {
      this.timeout(10000);

      fc.assert(
        fc.property(cleanKeyArb, (keyData) => {
          // Create a keyboard with just one key
          const keyboard = new kbd.Keyboard();
          const key = new kbd.Key();

          setKeyData(key, keyData);

          keyboard.keys.push(key);

          // Perform roundtrip
          const serialized = kbd.Serial.serialize(keyboard);
          const deserialized = kbd.Serial.deserialize(serialized);

          expect(deserialized.keys).to.have.lengthOf(1);

          const result = deserialized.keys[0];

          // Direct equality checks for most properties
          expect(result.color, "color").to.equal(key.color);
          expect(result.labels, "labels").to.deep.equal(key.labels);

          // For textColor and textSize, verify semantic equivalence only for positions with labels
          // (effective color/size considering defaults) rather than exact array equality
          // This accounts for serialization optimizations where single colors become defaults
          // We only check positions with labels since colors/sizes at empty positions don't matter
          for (let i = 0; i < 12; i++) {
            if (key.labels[i]) {
              // Only check positions with labels
              const expectedColor = key.textColor[i] || key.default.textColor;
              const actualColor =
                result.textColor[i] || result.default.textColor;
              expect(actualColor, `textColor[${i}]`).to.equal(expectedColor);

              const expectedSize = key.textSize[i] || key.default.textSize;
              const actualSize = result.textSize[i] || result.default.textSize;
              expect(actualSize, `textSize[${i}]`).to.equal(expectedSize);
            }
          }
          expect(result.x, "x").to.equal(key.x);
          expect(result.y, "y").to.equal(key.y);
          expect(result.width, "width").to.equal(key.width);
          expect(result.height, "height").to.equal(key.height);
          expect(result.x2, "x2").to.equal(key.x2);
          expect(result.y2, "y2").to.equal(key.y2);
          expect(result.width2, "width2").to.equal(key.width2);
          expect(result.height2, "height2").to.equal(key.height2);
          expect(result.rotation_x, "rotation_x").to.equal(key.rotation_x);
          expect(result.rotation_y, "rotation_y").to.equal(key.rotation_y);
          expect(result.rotation_angle, "rotation_angle").to.equal(
            key.rotation_angle,
          );
          expect(result.decal, "decal").to.equal(key.decal);
          expect(result.ghost, "ghost").to.equal(key.ghost);
          expect(result.stepped, "stepped").to.equal(key.stepped);
          expect(result.nub, "nub").to.equal(key.nub);
          expect(result.profile, "profile").to.equal(key.profile);
          expect(result.sm, "sm").to.equal(key.sm);
          expect(result.sb, "sb").to.equal(key.sb);
          expect(result.st, "st").to.equal(key.st);

          return true;
        }),
        {
          numRuns: 5000,
        },
      );
    });

    it("should handle null/undefined values in textColor/textSize arrays", function () {
      this.timeout(10000);

      // Arbitrary for "very dirty" keys with null/undefined in arrays
      const veryDirtyKeyArb = cleanLabelsArb.chain((labels) => {
        return colorArb.chain((keyColor) => {
          // Generate textColor with possible null/undefined values
          const nullableColorArb = fc.oneof(
            colorArb,
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(""),
          );
          const veryDirtyTextColorArb = fc.array(nullableColorArb, {
            minLength: numberOfLabels,
            maxLength: numberOfLabels,
          });

          // Generate textSize with possible null/undefined values
          const nullableTextSizeArb = fc.oneof(
            textSizeArb,
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(0),
          );
          const veryDirtyTextSizeArb = fc.array(nullableTextSizeArb, {
            minLength: numberOfLabels,
            maxLength: numberOfLabels,
          });

          return fc.record({
            color: fc.constant(keyColor),
            labels: fc.constant(labels),
            textColor: veryDirtyTextColorArb,
            textSize: veryDirtyTextSizeArb,
            x: positionArb,
            y: positionArb,
            width: dimensionArb,
            height: dimensionArb,
            x2: positionArb,
            y2: positionArb,
            width2: dimensionArb,
            height2: dimensionArb,
            rotation_x: positionArb,
            rotation_y: positionArb,
            rotation_angle: rotationArb,
            decal: booleanArb,
            ghost: booleanArb,
            stepped: booleanArb,
            nub: booleanArb,
            profile: profileArb,
            sm: profileArb,
            sb: profileArb,
            st: profileArb,
          });
        });
      });

      fc.assert(
        fc.property(veryDirtyKeyArb, (keyData) => {
          // Create a keyboard with a "very dirty" key (containing null/undefined)
          const keyboard = new kbd.Keyboard();
          const key = new kbd.Key();

          setKeyData(key, keyData);

          keyboard.keys.push(key);

          // Perform double roundtrip to ensure stability even with null/undefined
          const serialized1 = kbd.Serial.serialize(keyboard);
          const deserialized1 = kbd.Serial.deserialize(serialized1);

          const serialized2 = kbd.Serial.serialize(deserialized1);
          const deserialized2 = kbd.Serial.deserialize(serialized2);

          expect(deserialized2.keys).to.have.lengthOf(1);

          const result1 = deserialized1.keys[0];
          const result2 = deserialized2.keys[0];

          // Verify stability despite null/undefined input
          expect(result2.labels, "labels should be stable").to.deep.equal(
            result1.labels,
          );

          for (let i = 0; i < 12; i++) {
            const color1 = result1.textColor[i] || result1.default.textColor;
            const color2 = result2.textColor[i] || result2.default.textColor;
            expect(color2, `textColor[${i}] should be stable`).to.equal(color1);

            const size1 = result1.textSize[i] || result1.default.textSize;
            const size2 = result2.textSize[i] || result2.default.textSize;
            expect(size2, `textSize[${i}] should be stable`).to.equal(size1);

            // Verify cleanup: positions without labels should have empty textColor/size
            if (!result1.labels[i]) {
              expect(
                result1.textColor[i],
                `textColor[${i}] should be empty for empty label`,
              ).to.equal("");
              expect(
                result1.textSize[i],
                `textSize[${i}] should be 0 for empty label`,
              ).to.equal(0);
            }
          }

          // Verify textColor/textSize arrays are properly typed (no null/undefined)
          for (let i = 0; i < 12; i++) {
            expect(result1.textColor[i]).to.not.equal(
              null,
              `textColor[${i}] should not be null`,
            );
            expect(result1.textColor[i]).to.not.equal(
              undefined,
              `textColor[${i}] should not be undefined`,
            );
            expect(result1.textSize[i]).to.not.equal(
              null,
              `textSize[${i}] should not be null`,
            );
            expect(result1.textSize[i]).to.not.equal(
              undefined,
              `textSize[${i}] should not be undefined`,
            );
          }

          return true;
        }),
        {
          numRuns: 3000,
        },
      );
    });

    it("should optimize away redundant textColor/textSize values and produce stable output", function () {
      this.timeout(10000);

      // Arbitrary for "dirty" keys where textColor/textSize may be:
      // 1. Set even for positions without labels
      // 2. Equal to the default value
      // 3. Shorter than 12 elements
      // These should be handled and optimized away during serialization
      const dirtyKeyArb = cleanLabelsArb.chain((labels) => {
        const hasLabel = labels.map((l) => !!l);

        return colorArb.chain((keyColor) => {
          // Generate "dirty" textColor:
          // - May include colors at empty positions
          // - May include colors equal to DEFAULT_TEXT_COLOR
          const dirtyTextColorArb = fc.array(colorArb, {
            minLength: 0,
            maxLength: numberOfLabels,
          });

          // Generate "dirty" textSize:
          // - May include sizes at empty positions
          // - May include sizes equal to DEFAULT_TEXT_SIZE
          const dirtyTextSizeArb = fc.array(textSizeArb, {
            minLength: 0,
            maxLength: numberOfLabels,
          });

          return fc.record({
            color: fc.constant(keyColor),
            labels: fc.constant(labels),
            textColor: dirtyTextColorArb,
            textSize: dirtyTextSizeArb,
            x: positionArb,
            y: positionArb,
            width: dimensionArb,
            height: dimensionArb,
            x2: positionArb,
            y2: positionArb,
            width2: dimensionArb,
            height2: dimensionArb,
            rotation_x: positionArb,
            rotation_y: positionArb,
            rotation_angle: rotationArb,
            decal: booleanArb,
            ghost: booleanArb,
            stepped: booleanArb,
            nub: booleanArb,
            profile: profileArb,
            sm: profileArb,
            sb: profileArb,
            st: profileArb,
          });
        });
      });

      fc.assert(
        fc.property(dirtyKeyArb, (keyData) => {
          // Create a keyboard with a "dirty" key
          const keyboard = new kbd.Keyboard();
          const key = new kbd.Key();

          setKeyData(key, keyData);

          keyboard.keys.push(key);

          // Perform double roundtrip to ensure stability
          // First roundtrip cleans up the dirty data
          const serialized1 = kbd.Serial.serialize(keyboard);
          const deserialized1 = kbd.Serial.deserialize(serialized1);

          // Second roundtrip should produce identical results (stable state)
          const serialized2 = kbd.Serial.serialize(deserialized1);
          const deserialized2 = kbd.Serial.deserialize(serialized2);

          expect(deserialized2.keys).to.have.lengthOf(1);

          const result1 = deserialized1.keys[0];
          const result2 = deserialized2.keys[0];

          // Verify that the result is stable (doesn't change on second roundtrip)
          expect(result2.labels, "labels should be stable").to.deep.equal(
            result1.labels,
          );

          for (let i = 0; i < 12; i++) {
            const color1 = result1.textColor[i] || result1.default.textColor;
            const color2 = result2.textColor[i] || result2.default.textColor;
            expect(color2, `textColor[${i}] should be stable`).to.equal(color1);

            const size1 = result1.textSize[i] || result1.default.textSize;
            const size2 = result2.textSize[i] || result2.default.textSize;
            expect(size2, `textSize[${i}] should be stable`).to.equal(size1);

            // Also verify cleanup: positions without labels should have empty textColor/size
            if (!result1.labels[i]) {
              expect(
                result1.textColor[i],
                `textColor[${i}] should be empty for empty label`,
              ).to.equal("");
              expect(
                result1.textSize[i],
                `textSize[${i}] should be 0 for empty label`,
              ).to.equal(0);
            }
          }

          // All other properties should match
          expect(result2.color, "color").to.equal(result1.color);
          expect(result2.x, "x").to.equal(result1.x);
          expect(result2.y, "y").to.equal(result1.y);
          expect(result2.width, "width").to.equal(result1.width);
          expect(result2.height, "height").to.equal(result1.height);

          return true;
        }),
        {
          numRuns: 5000,
        },
      );
    });

    it("should perfectly roundtrip keyboards with multiple keys and produce stable output", function () {
      this.timeout(10000);

      // Arbitrary for a keyboard with multiple keys
      const multiKeyKeyboardArb = fc.array(cleanKeyArb, {
        minLength: 1,
        maxLength: 20,
      });

      fc.assert(
        fc.property(multiKeyKeyboardArb, (keysData) => {
          // Create a keyboard with multiple keys
          const keyboard = new kbd.Keyboard();

          for (const keyData of keysData) {
            const key = new kbd.Key();
            setKeyData(key, keyData);
            keyboard.keys.push(key);
          }

          // Perform double roundtrip to ensure stability
          const serialized1 = kbd.Serial.serialize(keyboard);
          const deserialized1 = kbd.Serial.deserialize(serialized1);

          const serialized2 = kbd.Serial.serialize(deserialized1);
          const deserialized2 = kbd.Serial.deserialize(serialized2);

          expect(deserialized2.keys).to.have.lengthOf(keysData.length);

          // Verify stability: second roundtrip should produce same result as first
          for (let keyIndex = 0; keyIndex < keysData.length; keyIndex++) {
            const result1 = deserialized1.keys[keyIndex];
            const result2 = deserialized2.keys[keyIndex];

            // Verify labels are stable
            expect(
              result2.labels,
              `key[${keyIndex}].labels should be stable`,
            ).to.deep.equal(result1.labels);

            // Verify effective colors and sizes are stable for positions with labels
            for (let i = 0; i < 12; i++) {
              if (result1.labels[i]) {
                // Only check positions with labels - empty positions don't need stable colors
                const color1 =
                  result1.textColor[i] || result1.default.textColor;
                const color2 =
                  result2.textColor[i] || result2.default.textColor;
                expect(
                  color2,
                  `key[${keyIndex}].textColor[${i}] should be stable`,
                ).to.equal(color1);

                const size1 = result1.textSize[i] || result1.default.textSize;
                const size2 = result2.textSize[i] || result2.default.textSize;
                expect(
                  size2,
                  `key[${keyIndex}].textSize[${i}] should be stable`,
                ).to.equal(size1);
              } else {
                // Empty positions should have clean textColor/textSize
                expect(
                  result1.textColor[i],
                  `key[${keyIndex}].textColor[${i}] should be empty`,
                ).to.equal("");
                expect(
                  result1.textSize[i],
                  `key[${keyIndex}].textSize[${i}] should be 0`,
                ).to.equal(0);
              }
            }

            // Verify other properties are stable
            expect(result2.color, `key[${keyIndex}].color`).to.equal(
              result1.color,
            );
            expect(result2.x, `key[${keyIndex}].x`).to.equal(result1.x);
            expect(result2.y, `key[${keyIndex}].y`).to.equal(result1.y);
            expect(result2.width, `key[${keyIndex}].width`).to.equal(
              result1.width,
            );
            expect(result2.height, `key[${keyIndex}].height`).to.equal(
              result1.height,
            );
            expect(result2.x2, `key[${keyIndex}].x2`).to.equal(result1.x2);
            expect(result2.y2, `key[${keyIndex}].y2`).to.equal(result1.y2);
            expect(result2.width2, `key[${keyIndex}].width2`).to.equal(
              result1.width2,
            );
            expect(result2.height2, `key[${keyIndex}].height2`).to.equal(
              result1.height2,
            );
            expect(result2.rotation_x, `key[${keyIndex}].rotation_x`).to.equal(
              result1.rotation_x,
            );
            expect(result2.rotation_y, `key[${keyIndex}].rotation_y`).to.equal(
              result1.rotation_y,
            );
            expect(
              result2.rotation_angle,
              `key[${keyIndex}].rotation_angle`,
            ).to.equal(result1.rotation_angle);
            expect(result2.decal, `key[${keyIndex}].decal`).to.equal(
              result1.decal,
            );
            expect(result2.ghost, `key[${keyIndex}].ghost`).to.equal(
              result1.ghost,
            );
            expect(result2.stepped, `key[${keyIndex}].stepped`).to.equal(
              result1.stepped,
            );
            expect(result2.nub, `key[${keyIndex}].nub`).to.equal(result1.nub);
            expect(result2.profile, `key[${keyIndex}].profile`).to.equal(
              result1.profile,
            );
            expect(result2.sm, `key[${keyIndex}].sm`).to.equal(result1.sm);
            expect(result2.sb, `key[${keyIndex}].sb`).to.equal(result1.sb);
            expect(result2.st, `key[${keyIndex}].st`).to.equal(result1.st);
          }

          return true;
        }),
        {
          numRuns: 1000,
        },
      );
    });
  });
});
