
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

    function increaseRowspan(i, j) {
        var cell = cells[i][j];
        if (cell && cell.visible) {
            cell.rowspan += 1;
            return;
        }

        increaseRowspan(i - 1, j);
    }

    function increaseColspan(i, j) {
        var cell = cells[i][j];
        if (cell && cell.visible) {
            cell.colspan += 1;
            return;
        }

        increaseColspan(i, j - 1);
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
                increaseRowspan(i - 1, j);
            } else if (value === "<<") {
                visible = false;
                increaseColspan(i, j - 1);
            }

            cells[i].push({
                visible,
                rowspan,
                colspan,
                value,
            });
        });
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
