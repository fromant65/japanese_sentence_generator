const kanjiData = require("./kanji.json");
const fs = require("fs");
const JishoAPI = require("unofficial-jisho-api");
const jisho = new JishoAPI();
/*
fetchJisho : kanji -> words[]
pide un Kanji y devuelve un array de palabras que lo utilizan, con el formato de jisho.org
*/
async function fetchJisho(kanji) {
  const response = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(kanji)}`
  );
  const words = await response.json();
  return words.data;
}

/*
createWordDB : kanjiData -> wordData
Recibe una lista de kanjis y devuelve un json de palabras con el siguiente formato:
    -word: la palabra en cuestión
    -reading: lectura en hiragana de la palabra
    -meaning: significado de la palabra
    -JLPT: Nivel JLPT
    -wanikani: Nivel Wanikani
*/
async function createWordDB(kanjiData) {
  const wordData = [];
  for (kanji in kanjiData) {
    const newWords = await fetchKanji(kanji);
    wordData.push(...newWords);
    await delay(1000);
    //if (kanji === "人") break;
    //if (kanji === "千") break;
  }
  const wordDataFiltered = cleanWordData(wordData);
  const wordDataSorted = sortWordData(wordDataFiltered);
  return wordDataSorted;
}

/*
delay: n -> promesa
Hace un delay en la ejecución del programa de n milisegundos
*/
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
fetchKanji: kanji -> words[]
Toma un kanji y devuelve una lista de palabras con el mismo
*/
async function fetchKanji(kanji) {
  const words = await fetchJisho(kanji);
  const newWords = [];
  for (key in words) {
    const word = words[key];
    const item = {
      baseKanji: kanji,
      slug: word.slug,
      tags: word.tags,
      jlpt: word.jlpt,
      japanese: word.japanese,
      senses: word.senses.map((sense) => {
        return sense.english_definitions;
      }),
    };
    newWords.push(item);
  }
  console.log(`Kanji ${kanji} created`);
  return newWords;
}

/*
cleanWordData : wordDB -> wordDB
Obtiene una base de datos de palabras y la limpia, eliminando las palabras sin tags o JLPT
Además, limpia las palabras repetidas
*/
function cleanWordData(wordData) {
  console.log("Filtering untagged words");
  const filteredWordData = [];
  for (i in wordData) {
    const word = wordData[i];
    if (word?.tags?.length === 0 || word?.jlpt?.length === 0) continue;
    filteredWordData.push(word);
  }
  console.log("Filtered. Deleting repeated words");
  const uniqueWords = [...new Set(filteredWordData)];
  console.log("Repeated words deleted");
  return uniqueWords;
}

/*
sortWordData : wordDB -> wordDB
Obtiene una base de datos de palabras y la ordena en base a su nivel wanikani
El nivel wanikani se obtiene de la tag de cada palabra.
El objeto tags tiene el siguiente formato:
  tags: ["wanikani<nivel>"]
Por lo que al hacer un substring en 8, obtenemos el string del nivel específico
*/
function sortWordData(wordData) {
  const sortedData = wordData.sort((a, b) => {
    const aTagNumber = parseInt(a.tags[0].substring(8));
    const bTagNumber = parseInt(b.tags[0].substring(8));
    return aTagNumber < bTagNumber ? -1 : 1;
  });
  return sortedData;
}

/*
createSentenceDB : wordDB -> sentenceDB
Toma una base de datos de palabras y devuelve una lista de oraciones con cada una  
*/
async function createSentenceDB(wordData) {
  const sentenceData = [];
  for (key in wordData) {
    const query = wordData[key].slug;
    const wanikaniLevel = parseInt(wordData[key].tags[0].substring(8));
    const jlptLevel = parseInt(wordData[key].jlpt[0].substring(5));
    //console.log(wordData[key]);
    const response = await jisho.searchForExamples(query);
    const example = response.results[0];
    if (!example) continue;
    const newSentence = {
      kanji: example.kanji,
      kana: example.kana,
      english: example.english,
      keyWord: query,
      wordLevel: { wanikani: wanikaniLevel, jlpt: jlptLevel },
    };

    sentenceData.push(newSentence);
    console.log(`Word done: ${wordData[key].slug}`);
    //await delay(1000);
  }
  const orderedSentences = orderByLevel(sentenceData);
  return orderedSentences;
}

/*
orderByLevel : sentenceDB -> sentenceDB
Toma una base de datos de oraciones y la ordena por nivel
*/

function orderByLevel(sentenceDB) {
  const sortedData = sentenceDB.sort((a, b) => {
    const aLevel = a.wordLevel.wanikani;
    const bLevel = b.wordLevel.wanikani;
    return aLevel < bLevel ? -1 : 1;
  });
  return sortedData;
}

/*
Creamos la wordDatabase y la guardamos en words.json. 
Posteriormente utilizamos esa data para crear una SentenceDB y la guardamos en sentences.json
*/
createWordDB(kanjiData)
  .then((res) => JSON.stringify(res))
  .then((data) => {
    console.log("createWordDB Terminated");
    fs.writeFileSync("words.json", data);
    const wordData = JSON.parse(fs.readFileSync("words.json", "utf8"));
    createSentenceDB(wordData)
      .then((res) => JSON.stringify(res))
      .then((data) => fs.writeFileSync("sentences.json", data));
  })
  .catch((err) => console.error(err));
