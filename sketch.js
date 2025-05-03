console.log("ml5 version:", ml5.version);

var nn;
var finalLoss;

var loadedData;
var taskType;

function getLossFeedback(loss, epochs, numEntries) {
  let emoji = "";
  let description = "";

  if (loss < 0.005) {
    emoji = "🤩";
    description =
      "La qualità è ottima! Dovresti ottenere predizioni affidabili.";
  } else if (loss < 0.05) {
    emoji = "😀";
    description = "La qualità è buona.";
    if (epochs < 50) {
      description +=
        " Potresti considerare di aumentare il numero di iterazioni (epoch) per avere una migliore convergenza del modello.";
    }
  } else if (loss < 0.1) {
    emoji = "😐";
    description = "La qualità è accettabile.";
    if (epochs < 100) {
      description +=
        " Potresti considerare di aumentare il numero di iterazioni (epoch) per avere una migliore convergenza del modello.";
    }
    if (numEntries < 500) {
      description +=
        " Potresti considerare di aumentare il numero di dati di training per avere un modello più affidabile.";
    }
  } else if (loss < 0.5) {
    emoji = "😕";
    description =
      "La qualità è bassa, potresti provare a modificare la tua architettura di rete neurale.";
    if (epochs < 200) {
      description +=
        " Considera di aumentare il numero di iterazioni (epoch) per avere una migliore convergenza del modello.";
    }
    if (numEntries < 1000) {
      description +=
        " Potresti considerare di aumentare il numero di dati di training per avere un modello più affidabile.";
    }
  } else {
    emoji = "😩";
    description =
      "La qualità è troppo bassa. Potresti aver bisogno di ripensare la tua architettura di rete neurale o ottenere più dati di training.";
    if (epochs < 500) {
      description +=
        " Inoltre, considera di aumentare il numero di epoche (epochs) per avere una migliore convergenza del modello.";
    }
  }

  return emoji + " " + description;
}

function printError(msg) {
  const predictionDiv = document.querySelector("#model-stats");
  predictionDiv.innerHTML = msg;
}

function dataLoaded(data) {
  const predictionDiv = document.querySelector("#prediction-form");
  predictionDiv.innerHTML = "";

  const outputColumn = data.cols.length - 1;

  print(data.labels[outputColumn], data.rows[0][outputColumn]);
  loadedData = data;

  finalLoss = null;

  taskType = isNaN(data.rows[0][outputColumn])
    ? "classification"
    : "regression";
  const options = {
    task: taskType,
  };

  // Step 3: initialize your neural network
  nn = ml5.neuralNetwork(options);

  for (let row of data.rows) {
    const inputs = {};

    for (
      let labelIndex = 0;
      labelIndex < data.labels.length - 1;
      labelIndex++
    ) {
      inputs[data.labels[labelIndex]] = row[labelIndex];
    }

    const output = {};
    output[data.labels[data.labels.length - 1]] = row[data.labels.length - 1];
    nn.addData(inputs, output);
  }
  nn.normalizeData();

  const numberOfEpochs = document.querySelector("#epochs").value;
  const trainingOptions = {
    epochs: numberOfEpochs,
    batchSize: 12,
  };

  function updateTrainingProgress(epoch, loss) {
    const predictionDiv = document.querySelector("#model-stats");
    predictionDiv.innerHTML = `<span class="icon">🧠</span> Allenamento del modello AI in corso... ${Math.floor(
      ((epoch + 1) / numberOfEpochs) * 100
    )}%`;
    finalLoss = loss.loss;
  }

  nn.train(trainingOptions, updateTrainingProgress, finishedTraining);

  function finishedTraining() {
    if (finalLoss == null) {
      printError(`<span class="icon">🤖</span> Errore nel dataset`);
      return;
    }

    const modelStatsDiv = document.querySelector("#model-stats");
    modelStatsDiv.innerHTML = `<span class="icon">🤖</span> Modello di Rete Neurale allenato! ${getLossFeedback(
      finalLoss,
      numberOfEpochs,
      data.rows.length
    )} (loss: ${finalLoss.toFixed(4)})`;
    const downloadLinks = document.createElement("button");
    downloadLinks.classList.add("mini");
    downloadLinks.innerinnerHTMLHTML = "💾 salva questo modello";
    modelStatsDiv.appendChild(downloadLinks);

    downloadLinks.addEventListener("click", () => {
      nn.save();
    });

    createPredictionForm(data.labels);
  }
}

function createPredictionForm(labels) {
  const predictionDiv = document.querySelector("#prediction-form");
  predictionDiv.innerHTML = "";
  predictionDiv.style = "";

  const predictionForm = document.createElement("form");
  predictionForm.innerHTML = "<h2>AI</h2>";
  predictionForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  //pick a random entry as example to fill the form
  const randomSample = random(loadedData.rows);

  for (let labelIndex = 0; labelIndex < labels.length - 1; labelIndex++) {
    const label = labels[labelIndex];

    const inputDivElement = document.createElement("div");
    inputDivElement.classList.add("prediction-value");

    const inputElement = document.createElement("input");
    inputElement.type = "number";
    inputElement.step = "any";
    inputElement.required = true;
    inputElement.name = `${label}`;
    inputElement.value = randomSample[labelIndex];
    const labelElement = document.createElement("label");
    labelElement.htmlFor = inputElement.id;
    labelElement.innerText = label;

    inputDivElement.appendChild(labelElement);
    inputDivElement.appendChild(inputElement);
    predictionForm.appendChild(inputDivElement);
    predictionDiv.appendChild(predictionForm);
  }

  const classifyButton = document.createElement("button");
  classifyButton.type = "submit";
  classifyButton.innerText = labels[labels.length - 1];
  classifyButton.addEventListener("click", classify);
  const classifyButtonDiv = document.createElement("div");

  classifyButtonDiv.appendChild(classifyButton);
  predictionForm.appendChild(classifyButtonDiv);
}

function classify() {
  const inputToClassify = {};
  var errors = false;
  const inputsLabels = document.querySelectorAll("#prediction-form input");
  inputsLabels.forEach((inputLabel) => {
    const currentValue = parseFloat(inputLabel.value);

    inputToClassify[inputLabel.name] = currentValue;
    if (isNaN(currentValue)) errors = true;
  });

  if (!errors) {
    if (taskType == "classification")
      nn.classify(inputToClassify, handleResults);
    else nn.predict(inputToClassify, handleResults);
  }
}

// Step 9: define a function to handle the results of your classification
function handleResults(error, result) {
  const resultDiv = document.querySelector("#prediction-result");
  resultDiv.style.display = "flex";
  resultDiv.innerHTML = `<h2>${taskType == 'classification' ? 'Classificazione' : 'Predizione'}</h2>`;

  if (error) {
    console.error(error);
    return;
  }
  console.log(result); // {label: 'red', confidence: 0.8};

  if (taskType == "classification") {
    for (let index = 0; index < result.length; index++) {
      const entry = result[index];

      resultDiv.innerHTML += `<div class="prediction-entry ${
        index == 0 ? "best" : ""
      }"><div>${entry.label}</div>
<div class="confidence" style="width:${floor(
              entry.confidence * 100
            )}px;"></div>`;
    }
  } else {
    const entry = result[0];
    resultDiv.innerHTML += `<div class="prediction-entry regression">
<div>${entry.label}</div>
<div class="regression-result">${entry.value.toFixed(4)}</div>
</div>
`;
  }
}

function setup() {
  noCanvas();
  
  const form = document.querySelector("form");

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevents the default form submission behavior
    const modelElement = document.querySelector("#model-stats");
    modelElement.innerHTML = `<span class="icon">📡</span> Caricamento Dataset...`;
    const predictionResultElement = document.querySelector(
      "#prediction-result"
    );
    predictionResultElement.innerHTML = "";
    predictionResultElement.style = "display: none";

    const predictionFormElement = document.querySelector("#prediction-form");
    predictionFormElement.innerHTML = "";
    predictionFormElement.style = "display: none";
    const googleSheetsUrlInput = document.getElementById("google-sheets-url")
      .value;
    loadSheet(googleSheetsUrlInput, dataLoaded);
  });
}
