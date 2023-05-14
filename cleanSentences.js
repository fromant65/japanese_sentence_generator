const fs = require("fs");
const kuromoji = require("kuromoji");
const wanakana = require("wanakana");
const jsonDict = fs.readFileSync("filteredDict.json");
const dict = JSON.parse(jsonDict);
// Lee el archivo JSON con las oraciones en kanji
const oraciones = require("./sentences.json");

// Carga el diccionario Kuromoji
kuromoji
  .builder({ dicPath: "node_modules/kuromoji/dict" })
  .build((err, tokenizer) => {
    if (err) {
      console.error("Error al cargar el diccionario Kuromoji:", err);
      return;
    }

    // Itera sobre las oraciones y reemplaza los kanjis por hiragana en el campo "kana"
    const oracionesHiragana = oraciones.map((oracion) => {
      const kanji = oracion.kanji;
      const kana = oracion.kana;

      // Tokeniza la oración en kanji utilizando Kuromoji y busca el significado de cada token
      const tokens = tokenizer.tokenize(kanji);
      const meanings = tokens.map((token) => {
        const tokenReading = token.surface_form;
        const meaning = getMeaning(tokenReading);
        //console.log(meaning, token.surface_form);
        if (!meaning?.length) return;
        return { word: tokenReading, meaning };
      });
      // Reemplaza los kanjis por hiragana en el campo "kana"
      let kanaReemplazada = kana;
      tokens.forEach((token) => {
        const hiraganaToken = wanakana.toHiragana(token.reading); // Convierte el katakana a hiragana
        kanaReemplazada = kanaReemplazada.replace(
          token.surface_form,
          hiraganaToken
        );
      });
      console.log(`"${oracion.kanji}" sentence done.`);
      // Retorna un nuevo objeto con el campo "kana" actualizado
      return { ...oracion, kana: kanaReemplazada, meanings };
    });
    // Guarda el resultado en un nuevo archivo JSON
    const outputData = JSON.stringify(oracionesHiragana, null, 2);
    fs.writeFileSync("cleanSentences.json", outputData, "utf8");
    console.log("Reescritura completada.");
  });

/*
Función que se encarga de obtener los significados de cada palabra desde el diccionario jmdict
*/
function getMeaning(query) {
  return dict
    .filter((item) => {
      const hasMatchInKana = item.kana.some((kana) => kana.includes(query));
      const hasMatchInKanji = item.kanji.some((kanji) => kanji.includes(query));
      return hasMatchInKana || hasMatchInKanji;
    })
    .map((item) => item.meaning)[0];
}
