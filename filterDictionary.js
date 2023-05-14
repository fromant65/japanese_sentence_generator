const fs = require("fs");
const jsonDict = fs.readFileSync("jmdict.json");
const objectDict = JSON.parse(jsonDict);
const dict = objectDict.words;
console.log(typeof dict, typeof objectDict);

function removeNotCommonReadings(dict) {
  return dict.map((word) => {
    const kanji = word.kanji;
    const kana = word.kana;
    //console.log(kanji[0].common, kana[0].common);
    const newKanji = kanji
      .filter((field) => field?.common)
      .map((obj) => obj.text);
    const newKana = kana
      .filter((field) => field?.common)
      .map((obj) => obj.text);
    return {
      ...word,
      kanji: newKanji,
      kana: newKana,
    };
  });
}

function filterDictionary(dict) {
  return dict.map((word) => {
    return {
      kanji: word.kanji,
      kana: word.kana,
      meaning: word.sense
        .map((meaning) => {
          return meaning.gloss.map((field) => {
            return field.text;
          });
        })
        .flat(),
    };
  });
}

const commonDict = removeNotCommonReadings(dict);
console.log("Filtered not common words: ", commonDict[0].kanji[0].text);
const filteredDict = filterDictionary(commonDict);
console.log("Filtered only important data: ", typeof filteredDict);
fs.writeFileSync(
  "filteredDict.json",
  JSON.stringify(filteredDict, null, 2),
  "utf8"
);
console.log("Dictionary filtered succesfully.");
