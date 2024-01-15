# json-table

A JS library to convert a JSON Array to an HTML table. Features:
* Supports the "^^" rowspan syntax like [`markdown-it-multimd-table`](https://www.npmjs.com/package/markdown-it-multimd-table) does.
* Supports the "<<" colspan syntax.

## Usage

```html
<div class="json-table">
    <div class="data invisible">
        {
            "columns": [
                "name",
                "price",
                {
                    "key": "tested-on",
                    "label": "Tested On"
                },
                "temp",
                {
                    "key": "temp-layer1",
                    "label": "Temp - Layer 1",
                    "default": "<<"
                },
                {
                    "key": "flow-rate",
                    "label": "Flow Rate"
                },
                "notes"
            ],
            "rows": [ ... ]
        }
    </div>
</div>
```

Script:

```html
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src=".../json-table.js"></script>
    <script>
    function renderJsonTables() {
        $(".json-table").each(function () {
            const data = JSON.parse($(this).find(".data").text());
            const table = makeTable(data);
            $(this).append(table);
        });
    }
    </script>
</head>
```

CSS:

```css
.invisible {
    display: none;
}
```
