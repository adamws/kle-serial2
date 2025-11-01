"use strict";

var expect = require("chai").expect;
var kbd = require("../dist/index");

describe("deserialization", function() {
  it("should fail on non-array", function() {
    var result = () => kbd.Serial.deserialize("test");
    expect(result).to.throw();
  });

  it("should fail on non array/object data", function() {
    var result = () => kbd.Serial.deserialize(["test"]);
    expect(result).to.throw();
  });

  it("should return empty keyboard on empty array", function() {
    var input = []
    var result = kbd.Serial.deserialize(input);
    expect(result).to.be.an.instanceOf(kbd.Keyboard);
    expect(result.keys).to.be.empty;
    var serialized = kbd.Serial.serialize(result);
    expect(serialized).to.deep.equal(input);
  });

  describe("of metadata", function() {
    it("should parse from first object if it exists", function() {
      var input = [{ name: "test" }]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.meta.name).to.equal("test");
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should throw an exception if found anywhere other than the start", function() {
      var result = () => kbd.Serial.deserialize([[], { name: "test" }]);
      expect(result).to.throw();
    });
  });

  describe("of key positions", function() {
    it("should default to (0,0)", function() {
      var input = [["1"]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.equal(0);
      expect(result.keys[0].y).to.equal(0);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should increment x position by the width of the previous key", function() {
      var input = [[{ x: 1 }, "1", "2"]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].x).to.equal(1);
      expect(result.keys[1].x).to.equal(
        result.keys[0].x + result.keys[0].width
      );
      expect(result.keys[1].y).to.equal(result.keys[0].y);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should increment y position whenever a new row starts, and reset x to zero", function() {
      var input = [[{ y: 1 }, "1"], ["2"]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].y).to.equal(1);
      expect(result.keys[1].x).to.equal(0);
      expect(result.keys[1].y).to.equal(result.keys[0].y + 1);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should add x and y to current position", function() {
      var input1 = [["1", { x: 1 }, "2"]]
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1).to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys).to.have.length(2);
      expect(result1.keys[0].x).to.equal(0);
      expect(result1.keys[1].x).to.equal(2);
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [["1"], [{ y: 1 }, "2"]]
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2).to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys).to.have.length(2);
      expect(result2.keys[0].y).to.equal(0);
      expect(result2.keys[1].y).to.equal(2);
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);
    });

    it("should leave x2,y2 at (0,0) if not specified", function() {
      var input1 = [[{ x: 1, y: 1 }, "1"]]
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1).to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys).to.have.length(1);
      expect(result1.keys[0].x).to.not.equal(0);
      expect(result1.keys[0].y).to.not.equal(0);
      expect(result1.keys[0].x2).to.equal(0);
      expect(result1.keys[0].y2).to.equal(0);
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [[{ x: 1, y: 1, x2: 2, y2: 2 }, "1"]]
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

    it("should add x and y to center of rotation", function() {
      var input = [[{r:10,rx:1,ry:1,y:-1.1,x:2},"E"]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].x).to.equal(3);
      expect(result.keys[0].y).to.be.closeTo(-0.1, 0.0001);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });
  });

  describe("of key sizes", function() {
    it("should reset width and height to 1", function() {
      var input1 = [[{ w: 5 }, "1", "2"]]
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1).to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys).to.have.length(2);
      expect(result1.keys[0].width).to.equal(5);
      expect(result1.keys[1].width).to.equal(1);
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [[{ h: 5 }, "1", "2"]]
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2).to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys).to.have.length(2);
      expect(result2.keys[0].height).to.equal(5);
      expect(result2.keys[1].height).to.equal(1);
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);
    });

    it("should default width2/height2 if not specified", function() {
      var input = [[{ w: 2, h: 2 }, "1", { w: 2, h: 2, w2: 4, h2: 4 }, "2"]]
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

  describe("of other properties", function() {
    it("should reset stepped, homing, and decal flags to false", function() {
      var input = [[{ l: true, n: true, d: true }, "1", "2"]]
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

    it("should propagate and reset the ghost flag", function() {
      var input = [["0", { g: true }, "1", "2", { g: false }, "3"]]
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

    it("should propagate and reset the profile flag", function() {
      var input = [["0", { p: "DSA" }, "1", "2", { p: "" }, "3"]]
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

    it("should propagate and reset switch properties", function() {
      console.log("test")
      var input1 = [["1", { sm: "cherry" }, "2", "3", { sm: "" }, "4"]]
      var result1 = kbd.Serial.deserialize(input1);
      expect(result1, "sm").to.be.an.instanceOf(kbd.Keyboard);
      expect(result1.keys, "sm").to.have.length(4);
      expect(result1.keys[0].sm, "sm_0").to.equal("");
      expect(result1.keys[1].sm, "sm_1").to.equal("cherry");
      expect(result1.keys[2].sm, "sm_2").to.equal("cherry");
      expect(result1.keys[3].sm, "sm_3").to.equal("");
      var serialized1 = kbd.Serial.serialize(result1);
      expect(serialized1).to.deep.equal(input1);

      var input2 = [["1", { sb: "cherry" }, "2", "3", { sb: "" }, "4"]]
      var result2 = kbd.Serial.deserialize(input2);
      expect(result2, "sb").to.be.an.instanceOf(kbd.Keyboard);
      expect(result2.keys, "sb").to.have.length(4);
      expect(result2.keys[0].sb, "sb_0").to.equal("");
      expect(result2.keys[1].sb, "sb_1").to.equal("cherry");
      expect(result2.keys[2].sb, "sb_2").to.equal("cherry");
      expect(result2.keys[3].sb, "sb_3").to.equal("");
      var serialized2 = kbd.Serial.serialize(result2);
      expect(serialized2).to.deep.equal(input2);

      var input3 = [["1", { st: "MX1A-11Nx" }, "2", "3", { st: "" }, "4"]]
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

  describe("of text color", function() {
    it("should apply colors to all subsequent keys", function() {
      var input = [[{ c: "#ff0000", t: "#00ff00" }, "1", "2"]]
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

    it("should apply `t` to all legends", function() {
      var input = [[{ a: 0, t: "#444444" }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#444444");
      for (var i = 0; i < 12; ++i) {
        expect(result.keys[0].textColor[i], `[${i}]`).to.be.undefined;
      }
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle generic case", function() {
      var labels =
        "#111111\n#222222\n#333333\n#444444\n" +
        "#555555\n#666666\n#777777\n#888888\n" +
        "#999999\n#aaaaaa\n#bbbbbb\n#cccccc";
      var input = [[{ a: 0, t: labels }, labels]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].default.textColor).to.equal("#111111");
      for (var i = 0; i < 12; ++i) {
        expect(
          result.keys[0].textColor[i] || result.keys[0].default.textColor,
          `i=${i}`
        ).to.equal(result.keys[0].labels[i]);
      }
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle blanks", function() {
      var labels =
        "#111111\nXX\n#333333\n#444444\n" +
        "XX\n#666666\nXX\n#888888\n" +
        "#999999\n#aaaaaa\n#bbbbbb\n#cccccc";
      var input = [[{ a: 0, t: labels.replace(/XX/g, "") }, labels]]
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
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should not reset default color if blank", function() {
      var input = [[{ t: "#ff0000" }, "1", { t: "\n#00ff00" }, "2"]]
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

    it("should delete values equal to the default", function() {
      var input = [[{ t: "#ff0000" }, "1", { t: "\n#ff0000" }, "\n2", { t: "\n#00ff00" }, "\n3"]]
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[1].labels[6]).to.equal("2");
      expect(result.keys[1].textColor[6]).to.be.undefined;
      expect(result.keys[2].labels[6]).to.equal("3");
      expect(result.keys[2].textColor[6]).to.equal("#00ff00");
      // Note: Perfect roundtrip not expected due to KLE spec cleanup behavior
      // Colors equal to default get removed when there's no corresponding label
      var serialized = kbd.Serial.serialize(result);
      var expected = [[{ t: "#ff0000" }, "1", "\n2", { t: "\n#00ff00" }, "\n3"]];
      expect(serialized).to.deep.equal(expected);
    });
  });

  describe("of rotation", function() {
    it("should not be allowed on anything but the first key in a row", function() {
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

  describe("of legends", function() {
    it("should align legend positions correctly", function() {
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
          [{ a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
        ]);
        expect(expected[a], name).to.not.be.undefined;
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        // Labels are now always 12-element arrays with empty strings for undefined positions
        expect(result.keys[0].labels, name).to.have.length(12);
        // Convert sparse expected array to 12-element array with empty strings
        var expectedFull = Array(12).fill("").map((_, i) => expected[a][i] || "");
        expect(result.keys[0].labels, name).to.deep.equal(expectedFull);
      }
    });
  });

  describe("of font sizes", function() {
    it("should handle `f` at all alignments", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ f: 1, a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        expect(result.keys[0].default.textSize, name).to.equal(1);
        // textSize is now always a 12-element array, all elements should be undefined when using default
        expect(result.keys[0].textSize, name).to.have.length(12);
        for (var i = 0; i < 12; ++i) {
          expect(result.keys[0].textSize[i], `${name} [${i}]`).to.be.undefined;
        }
      }
    });

    it("should handle `f2` at all alignments", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [{ f: 1, f2: 2, a: a }, "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11"]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);
        // All labels should be 2, except the first one ('0')
        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i]) {
            var expected = result.keys[0].labels[i] === "0" ? 1 : 2;
            if (result.keys[0].labels[i] === "0") {
              expect(result.keys[0].textSize[i], name_i).to.be.undefined;
            } else {
              expect(result.keys[0].textSize[i], name_i).to.equal(2);
            }
          } else {
            // no text at [i]; textSize should be undefined
            expect(result.keys[0].textSize[i], name_i).to.be.undefined;
          }
        }
      }
    });

    it("should handle `fa` at all alignments", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [
            { f: 1, fa: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], a: a },
            "2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13"
          ]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i]) {
            expect(result.keys[0].textSize[i], name_i).to.equal(
              parseInt(result.keys[0].labels[i])
            );
          }
        }
      }
    });

    it("should handle blanks in `fa`", function() {
      for (var a = 0; a < 7; ++a) {
        var name = `a=${a}`;
        var result = kbd.Serial.deserialize([
          [
            { f: 1, fa: [, 2, , 4, , 6, , 8, 9, 10, , 12], a: a },
            "x\n2\nx\n4\nx\n6\nx\n8\n9\n10\nx\n12"
          ]
        ]);
        expect(result, name).to.be.an.instanceOf(kbd.Keyboard);
        expect(result.keys, name).to.have.length(1);

        for (var i = 0; i < 12; ++i) {
          var name_i = `${name} [${i}]`;
          if (result.keys[0].labels[i] === "x") {
            expect(result.keys[0].textSize[i], name_i).to.be.undefined;
          }
        }
      }
    });

    it("should not reset default size if blank", function() {
      var result = kbd.Serial.deserialize([
        [{ f: 1 }, "1", { fa: [, 2] }, "2"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].default.textSize, "[0]").to.equal(1);
      expect(result.keys[1].default.textSize, "[1]").to.equal(1);
    });

    it("should delete values equal to the default", function() {
      var result = kbd.Serial.deserialize([
        [{ f: 1 }, "1", { fa: [, 1] }, "\n2", { fa: [, 2] }, "\n3"]
      ]);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(3);
      expect(result.keys[1].labels[6]).to.equal("2");
      expect(result.keys[1].textSize[6]).to.be.undefined;
      expect(result.keys[2].labels[6]).to.equal("3");
      expect(result.keys[2].textSize[6]).to.equal(2);
    });
  });

  describe("edge cases and advanced scenarios", function() {
    it("should handle complex rotation with positioning", function() {
      var input = [[{r:45,rx:5,ry:3,x:1,y:2}, "A", {x:0.5}, "B"]];
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

    it("should handle stepped keys with complex sizing", function() {
      var input = [[{w:2.25,h:2,w2:1.25,h2:1,x2:-0.75,y2:1,l:true}, "Enter"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(1);
      expect(result.keys[0].stepped).to.be.true;
      expect(result.keys[0].width2).to.equal(1.25);
      expect(result.keys[0].x2).to.equal(-0.75);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle decal and ghost keys", function() {
      var input = [[{d:true}, "Decal", {g:true}, "Ghost"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      expect(result.keys[0].decal).to.be.true;
      expect(result.keys[1].ghost).to.be.true;
      expect(result.keys[1].decal).to.be.false; // resets to false
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle complex switch properties", function() {
      var input = [[{sm:"cherry",sb:"gateron",st:"red"}, "A", {st:"blue"}, "B"]];
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

    it("should handle keyboard metadata", function() {
      var input = [{name:"Test Keyboard",author:"Test Author",backcolor:"#123456",notes:"Test notes"}, ["A","B"]];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.meta.name).to.equal("Test Keyboard");
      expect(result.meta.author).to.equal("Test Author");
      expect(result.meta.backcolor).to.equal("#123456");
      expect(result.meta.notes).to.equal("Test notes");
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle mixed font sizes with f2 and fa", function() {
      var input = [[{f:2,f2:4}, "A\nB\nC", {fa:[3,,5,6]}, "D\nE\nF\nG"]];
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
      var expected = [[{f:2,fa:[,4,4]}, "A\nB\nC", {fa:[3,,5,6]}, "D\nE\nF\nG"]];
      expect(serialized).to.deep.equal(expected);
    });

    it("should handle profile and nub combinations", function() {
      var input = [[{p:"DSA",n:true}, "F", {p:"SA R1",n:true}, "J", "K"]];
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

    it("should handle multiple rows with different alignments", function() {
      var input = [
        ["A"],
        [{a:7}, "B"]
      ];
      var result = kbd.Serial.deserialize(input);
      expect(result).to.be.an.instanceOf(kbd.Keyboard);
      expect(result.keys).to.have.length(2);
      var serialized = kbd.Serial.serialize(result);
      expect(serialized).to.deep.equal(input);
    });

    it("should handle complex mixed properties with inheritance", function() {
      var input = [[{
        r:30,rx:2,ry:1,
        w:1.5,h:2,
        c:"#ff0000",
        p:"Cherry",l:true,n:true
      }, "Key1", "Key2"]];
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

describe("serialization", function() {
  it("should not care so much about matching elements", function() {
    var keyboard = new kbd.Keyboard()
    var key = new kbd.Key()
    key.labels = [undefined,undefined,undefined,undefined,"x",undefined,undefined,undefined,undefined,undefined,undefined,undefined]
    // all these variants should yield same result
    var textColors = [
      [undefined,undefined,undefined,undefined,"#ff0000"],
      [undefined,undefined,undefined,undefined,"#ff0000",undefined,undefined,undefined,undefined,undefined,undefined,undefined],
      ["#000000","#000000","#000000","#000000","#ff0000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"],
      [undefined,undefined,undefined,undefined,"#ff0000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"],
    ]
    var expected = [[{ t: '#ff0000', a: 7 }, 'x']]

    for (var i = 0; i < textColors.length; ++i) {
      key.textColor = textColors[i]
      keyboard.keys = [key]
      var serialized = kbd.Serial.serialize(keyboard)
      expect(serialized).to.deep.equal(expected)
    }
  });

  it("should properly handle first key at y=-1", function() {
    var keyboard = new kbd.Keyboard()
    var key = new kbd.Key()
    key.labels = "A"
    key.y = -1
    keyboard.keys.push(key);
    var serialized = kbd.Serial.serialize(keyboard)
    var expected = [[{y:-1}, "A"]];
    expect(serialized).to.deep.equal(expected)
  });
});
