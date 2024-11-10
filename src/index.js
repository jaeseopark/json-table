const DEFAULT_DECIMALS = 0;

const round = (num, decimals) => parseFloat(num.toFixed(decimals !== undefined ? decimals : DEFAULT_DECIMALS));

const getColumnKeyFromLabel = (label) => {
    const withoutParenthesis = label.split("(")[0].trim();
    const withHyphens = withoutParenthesis.replaceAll(/[^a-zA-Z0-9]+/g, "-")
    return withHyphens.toLowerCase();
}

function getColumnLabelFromKey(key) {
    // TODO more advanced logic like splitting
    return key.charAt(0).toUpperCase() + key.slice(1);
}

const normalizeColumns = (data) => {
    for (let i = 0; i < data.columns.length; i++) {
        if (typeof data.columns[i] === "string") {
            data.columns[i] = {
                key: data.columns[i]
            };
        }

        const column = data.columns[i];
        if (!column.key) {
            column.key = getColumnKeyFromLabel(column.label);
        } else if (!column.label) {
            column.label = getColumnLabelFromKey(column.key);
        }
    }
}

function makeTHEAD(columns) {
    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    columns.forEach(function (column) {
        var th = document.createElement("th");
        th.textContent = column.label;
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

        rows.forEach((row) => {
            let { children, ...rest } = { ...inheritedMap, ...row };
            if (children) {
                const [firstChild] = children;
                Object.keys(rest)
                    .forEach(key => {
                        firstChild[key] = rest[key];
                        if (key in parentProps) {
                            rest[key] = "^^";
                        }
                    });
                data.columns
                    .filter(col => col.source in row)
                    .map(col => col.key)
                    .forEach((key) => {
                        firstChild[key] = "";
                        rest[key] = "";
                    });
                addToMatrix(children, rest);
                return;
            }

            const i = matrix.push([]) - 1; // current row index
            data.columns.forEach(function (column, j) {
                let value = rest[column.key] || column.default;
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
                        const sourceColumnIndex = data.columns.findIndex(c => (c.key) === column.source);
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
                                value = round(dollar * parseFloat(normalizerMatch[1] || "1") / normalizedQty, column.decimals);
                            }
                        }
                    }

                    if (column.eval) {
                        const isSelfReferencing = column.eval.includes("${value}");

                        if (!isSelfReferencing || value) {
                            let expr = column.eval.replaceAll("\$\{value\}", value);
                            expr = data.columns.reduce((innerExpr, c, cIndex) => {
                                // TODO: add support for nested computed fields.
                                // Also -- cIndex >= j has not been computed yet. no point iterating.
                                if (cIndex < j) {
                                    const substr = `\$\{${c.key}\}`
                                    const sourceValue = matrix[i][cIndex].value;
                                    return innerExpr.replaceAll(substr, sourceValue)
                                }
                                return innerExpr;
                            }, expr);
                            value = round(eval(expr), column.decimals);
                        }
                    }
                }

                matrix[i].push({
                    value,
                    column,
                    row: rest,
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
                } else if (cell.column.urlSource && cell.row[cell.column.urlSource]) {
                    const url = cell.row[cell.column.urlSource];
                    var a = document.createElement("a");
                    a.setAttribute("href", url);
                    a.setAttribute("target", "_blank");
                    a.textContent = cell.value;
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
    normalizeColumns(data);

    var table = document.createElement("table");
    table.appendChild(makeTHEAD(data.columns));
    table.appendChild(makeTBODY(data));
    return table;
}

if (typeof exports != "undefined") {
    exports.jsonTable = { makeTable };
}
