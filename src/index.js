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
                column,
                value,
            });
        });

        columns.forEach(function (column, j) {
            const cell = cells[i][j];
            const value = cell.value;
            if (column.source) {
                if (!cell.visible) return;

                const sourceColumn = columns.findIndex(c => (c.key || c) === column.source);
                let sourceValue = cells[i][sourceColumn].value;
                const isUnitless = ["ea", "each", "pc", "pcs", "pk", "cnt"].includes(column.normalizer.replace(/[0-9]/g, ''));

                if (sourceValue.label) {
                    sourceValue = sourceValue.label;
                }

                if ((sourceValue || "").includes("/")) {
                    const match = sourceValue.match(/^[$]*([\d.]+)\/([\d.]*)(.+)$/);
                    if (match) {
                        const dollar = parseFloat(match[1]);
                        const qty = parseFloat(match[2] || "1");
                        const unit = match[3];
                        const normalizerMatch = column.normalizer.match(/([\d.]*)(.+)/);
                        const normalizedQty = isUnitless ? qty : convert.convert(qty, unit.trim()).to(normalizerMatch[2]);
                        cell.value = (dollar * parseFloat(normalizerMatch[1] || "1") / normalizedQty).toFixed(1);
                    }
                }
            }

            if (column.eval && cell.value) {
                const expr = column.eval.replaceAll("\$\{value\}", value);
                cell.value = eval(expr);
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
                } else if (cell.value && cell.column.swatchSize) {
                    var swatchSize = cell.column.swatchSize;
                    var delimiter = cell.column.delimiter || ",";
                    cell.value.split(delimiter).forEach(function (colour) {
                        var div = document.createElement("div");
                        div.setAttribute("style", `background-color: #${colour.trim()}; width: ${swatchSize}px; height: ${swatchSize}px; border: 1px solid black;`);
                        td.appendChild(div);
                    });
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

const expand = (rows, inheritedKeys = []) => {
    const inheritedMap = inheritedKeys.reduce((acc, key) => {
        acc[key] = "^^";
        return acc;
    }, {});
    const expandedRows = [];
    rows.forEach(row => {
        const { children, ...rest } = { ...inheritedMap, ...row };
        if (children) {
            const [firstChild, ...restOfChildren] = expand(children, Object.keys(rest));
            expandedRows.push({ ...firstChild, ...rest });
            expandedRows.push(...restOfChildren);
        } else {
            expandedRows.push(rest);
        }
    });
    return expandedRows;
}

function makeTable(data) {
    var table = document.createElement("table");
    table.appendChild(makeTHEAD(data.columns));
    table.appendChild(makeTBODY(expand(data.rows), data.columns));
    return table;
}

if (typeof exports != "undefined") {
    exports.jsonTable = { makeTable };
}
