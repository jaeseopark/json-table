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

function makeTBODY(data) {
    const matrix = [];

    function increaseRowspanThenReturnValue(i, j) {
        var cell = matrix[i][j];
        if (cell && cell.visible) {
            cell.rowspan += 1;
            return cell.value;
        }

        return increaseRowspanThenReturnValue(i - 1, j);
    }

    function increaseColspanThenReturnValue(i, j) {
        var cell = matrix[i][j];
        if (cell && cell.visible) {
            cell.colspan += 1;
            return cell.value;
        }

        return increaseColspanThenReturnValue(i, j - 1);
    }

    const addToMatrix = (rows, parentProps = {}) => {
        const inheritedMap = Object.keys(parentProps).reduce((acc, key) => {
            acc[key] = "^^";
            return acc;
        }, {});

        rows.forEach((row, localRowIndex) => {
            let { children, ...rest } = { ...parentProps, ...row };
            if (children) {
                const relatedColumnNames = data.columns.filter(col => col.source && col.source in rest).map(col => col.key || col);
                const blankProperties = relatedColumnNames.reduce((acc,key) => {
                    acc[key] = "";
                    return acc;
                }, {});
                return addToMatrix(children, {...blankProperties, ...rest});
            }

            if (localRowIndex > 0) {
                rest = {...rest, ...inheritedMap};
            }

            const i = matrix.push([]) - 1; // current row index
            data.columns.forEach(function (column, j) {
                let value = rest[column.key || column] || column.default;
                let visible = true;

                if (value === "^^") {
                    value = increaseRowspanThenReturnValue(i, j);
                    visible = false;
                }

                if (value === "<<") {
                    value = increaseColspanThenReturnValue(i, j);
                    visible = false;
                }

                if (visible) {
                    if (column.source) {
                        const sourceColumnIndex = data.columns.findIndex(c => (c.key || c) === column.source);
                        let sourceValue = matrix[i][sourceColumnIndex].value;
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
                                value = (dollar * parseFloat(normalizerMatch[1] || "1") / normalizedQty).toFixed(1);
                            }
                        }
                    }
    
                    if (value && column.eval) {
                        const expr = column.eval.replaceAll("\$\{value\}", value);
                        value = eval(expr);
                    }
                }

                matrix[i].push({
                    value,
                    column,
                    rowspan: 1,
                    colspan: 1,
                    visible,
                });
            });
        })
    }

    addToMatrix(data.rows);

    var tbody = document.createElement("tbody");
    matrix.forEach(function (row) {
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

function makeTable(data) {
    var table = document.createElement("table");
    table.appendChild(makeTHEAD(data.columns));
    table.appendChild(makeTBODY(data));
    return table;
}

if (typeof exports != "undefined") {
    exports.jsonTable = { makeTable };
}
