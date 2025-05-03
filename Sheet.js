const getValue = function (col, row) {
    if (
      col < 0 ||
      row < 0 ||
      col >= this.cols.length ||
      row >= this.cols[col].length
    )
      return "";
  
    return this.cols[col][row] != null ? this.cols[col][row] : "";
  };
  
  const showWindow = function(msg) {
    var outputDIV = document.createElement('div');
    var position = height + 40;
    outputDIV.style = 'font-size: 80%; font-family: sans; max-width: 500px; max-height: 300px; overflow: overlay; position: absolute; top: ' + position + 'px';
    outputDIV.innerHTML = `${msg}`;
    document.body.appendChild(outputDIV)
    
  };
  
  const printTable = function () {
    var output = `<table>`;
  
    for (let y = 0; y < this.rows.length; y++) {
      output += `<tr>`
      for (let x = 0; x < this.cols.length; x++) {
        output += `<td>${this.get(x, y)}</td>`;
      }
      output += `</tr>`
    }
  
    output += `</table>`;
    showWindow(output);
  };


window.loadSheet = (link, callback) => {
    //  https://developers.google.com/chart/interactive/docs/querylanguage#language-clauses
    
    const query = "select *";
    var matches = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(link);
    
    const encodedQuery = encodeURIComponent(query);
    var sheetId;
    if (matches) {
        sheetId = matches[1];
    } else {
        printError(`<span class="icon">❌</span>Invalid Google Sheets link`);
        return;
    }

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?&sheet=user-data&tq=${encodedQuery}`;
    const result = {};

    result.rows = [];
    result.cols = [];
    fetch(url)
        .then((res) => res.text())
        .then((rep) => {
            //Remove additional text and extract only JSON:
            const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
            for (let row of jsonData.table.rows) {
                const rowArray = [];
                for (let i = 0; i < row.c.length; i++) {
                    //print(row.c[i])

                    let value = row.c[i] != null ? row.c[i].v : null;
                    rowArray.push(value);
                    if (!result.cols[i]) result.cols[i] = [];

                    result.cols[i].push(value);
                }

                result.rows.push(rowArray);
            }
            var lastColumnWithData = 0;
            for (let col = 0; col < result.cols.length; col++) {
                let hasData = false;

                for (let cell of result.cols[col]) {
                    if (cell != null) {
                        hasData = true;
                    }
                }
                if (hasData) lastColumnWithData = col;
            }
            result.cols = result.cols.slice(0, lastColumnWithData + 1);
            for (let row = 0; row < result.rows.length; row++) {
                result.rows[row] = result.rows[row].slice(0, lastColumnWithData + 1);
            }

            result.get = getValue;
            result.print = printTable;
            result.labels = []
      
            for (let col of jsonData.table.cols) {
              result.labels.push(col.label)
            }

            self._decrementPreload();
            if (typeof callback == "function") {
                callback(result); // do the callback.
            }
        })
        .catch((error) => {
            if (error.message.indexOf("Failed to fetch") > -1) {
              printError(`<span class="icon">🔒</span> Foglio di calcolo non raggiungibile. Controlla la URL ed i permessi di accesso.`)
            }
        });

    return result;
};