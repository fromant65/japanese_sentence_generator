const axios = require("axios");
const data = require("./cleanSentences.json");
// Función para generar una tarjeta de Anki
async function generateAnkiCard(cardData) {
  const deckName = "Japanese Sentences"; // Nombre del mazo en Anki

  // Crear el objeto de la tarjeta en el formato esperado por AnkiConnect
  const ankiCard = {
    deckName,
    modelName: "Basic Card",
    fields: {
      Front: cardData.kanji,
      Back: `
        Kana: ${cardData.kana}<br>
        English: ${cardData.english}<br>
        Meanings:<br>${formatMeanings(cardData.meanings)}
      `,
    },
    options: {
      allowDuplicate: false,
    },
  };

  // Enviar la tarjeta a Anki utilizando AnkiConnect
  try {
    const response = await axios.post("http://127.0.0.1:8765", {
      action: "addNote",
      version: 6,
      params: {
        note: ankiCard,
      },
    });
    console.log("Tarjeta agregada a Anki:", response.data);
  } catch (error) {
    console.error("Error al agregar la tarjeta a Anki:", error.message);
  }
}

// Función para formatear las significados en la parte trasera de la tarjeta
function formatMeanings(meanings) {
  if (!meanings || !Array.isArray(meanings)) {
    return "";
  }

  let formattedMeanings = "";
  meanings.forEach((meaning) => {
    if (meaning && meaning.word && meaning.meaning) {
      formattedMeanings += `- ${meaning.word}: ${meaning.meaning.join(
        ", "
      )}<br>`;
    }
  });

  return formattedMeanings;
}

async function createDeckIfNotExists(deckName) {
  try {
    const response = await axios.post("http://127.0.0.1:8765", {
      action: "createDeck",
      version: 6,
      params: {
        deck: deckName,
      },
    });
    console.log("Mazo creado:", response.data);
  } catch (error) {
    console.error("Error al crear el mazo:", error.message);
  }
}

// Llamar a la función para crear el mazo "Japanese Sentences" si no existe
createDeckIfNotExists("Japanese Sentences");

//Delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processData(data) {
  for (key in data) {
    item = data[key];
    await delay(100);
    generateAnkiCard(item);
  }
}

processData(data);
