function makeTHEAD(columns) {
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    columns.forEach(function (column) {
        var th = document.createElement("th");
        if (column.label) {
            th.textContent = column.label;
        } else {
            th.textContent = capitalizeFirstLetter(column);
        }

        tr.appendChild(th);
    });
    thead.appendChild(tr);
    return thead;
}

function makeTBODY(rows, columns) {
    var tbody = document.createElement("tbody");
    var cells = [];

    function increaseRowspanThenReturnValue(i, j) {
        var cell = cells[i][j];
        if (cell && cell.visible) {
            cell.rowspan += 1;
            return cell.value;
        }

        increaseRowspanThenReturnValue(i - 1, j);
    }

    function increaseColspanThenReturnValue(i, j) {
        var cell = cells[i][j];
        if (cell && cell.visible) {
            cell.colspan += 1;
            return cell.value;
        }

        increaseColspanThenReturnValue(i, j - 1);
    }

    rows.forEach(function (row, i) {
        cells.push([]);
        columns.forEach(function (column, j) {
            var visible = true;
            var rowspan = 1;
            var colspan = 1;
            var value = row[column.key || column] || column.default;

            if (value === "^^") {
                visible = false;
                value = increaseRowspanThenReturnValue(i - 1, j);
            } else if (value === "<<") {
                visible = false;
                value = increaseColspanThenReturnValue(i, j - 1);
            }

            cells[i].push({
                visible,
                rowspan,
                colspan,
                value,
            });
        });

        columns.forEach(function (column, j) {
            if (column.source) {
                const sourceJ = columns.findIndex(c => (c.key || c) === column.source);
                const value = cells[i][sourceJ].value;
                if ((value || "").includes("/")) {
                    const match = value.match(/^[$]*([\d.]+)\/([\d.]*)(.+)$/);
                    if (match) {
                        const dollar = parseFloat(match[1]);
                        const amount = parseFloat(match[2] || "1");
                        const unit = match[3];
                        const normalizerMatch = column.normalizer.match(/([\d.]*)(.+)/);
                        const normalizedAmount = convert.convert(amount, unit.trim()).to(normalizerMatch[2]);
                        cells[i][j].value = (dollar * parseFloat(normalizerMatch[1] || "1") / normalizedAmount).toFixed(1);
                    }
                }
            }

            // TODO: variable referencing, etc
        })
    });

    cells.forEach(function (row) {
        let tr = document.createElement("tr");
        row.forEach(function (cell) {
            if (cell.visible) {
                var td = document.createElement("td");
                if (cell.value?.url) {
                    var a = document.createElement("a");
                    a.setAttribute("href", cell.value.url);
                    a.setAttribute("target", "_blank");
                    a.textContent = cell.value.label;
                    a.className = "is-external-link"
                    td.appendChild(a);
                } else {
                    td.textContent = cell.value;
                }
                td.setAttribute("colspan", cell.colspan);
                td.setAttribute("rowspan", cell.rowspan);
                tr.appendChild(td);
            }
        });
        tbody.appendChild(tr);
    });

    return tbody;
}

function makeTable(data) {
    var table = document.createElement("table");
    table.appendChild(makeTHEAD(data.columns));
    table.appendChild(makeTBODY(data.rows, data.columns));
    return table;
}

if (typeof exports != "undefined") {
    exports.jsonTable = { makeTable };
}
