# json-table

A JS library to convert a JSON Array to an HTML table. Features:
* Supports the "^^" rowspan syntax like [`markdown-it-multimd-table`](https://www.npmjs.com/package/markdown-it-multimd-table) does.
* Supports the "<<" colspan syntax.
* Supports parent-child rows to automatically apply rowspan values of > 1
* Supports normalization of units

## Dependencies

* [convert](https://www.npmjs.com/package/convert)

## Usage

```html
<div class="json-table">
    <div class="data invisible">
        {
            "columns": [
                {
                    "key": "name",
                    "label": "Name",
                    "urlSource": "url"
                },
                {
                    "key": "width",
                    "label": "Width (in)"
                },
                {
                    "key": "length",
                    "label": "Length (in)"
                },
                {
                    "key": "power",
                    "label": "Power (W)"
                },
                "price",
                {
                    "key": "area",
                    "label": "Price per temp ($⋅in²/W)",
                    "eval": "${price}*${width}*${length}/${power}"
                },
                "notes"
            ],
            "rows": [
                {
                    "name": "BEAUTIKEN",
                    "width": 17,
                    "length": 33,
                    "power": 75,
                    "price": 38,
                    "url": "https://a.co/d/hnuguj8"
                },
                {
                    "name": "VANKADA",
                    "width": 17,
                    "length": 33,
                    "power": 75,
                    "price": 39,
                    "notes": "Lots of colour options; power spikes to 125 W",
                    "url": "https://a.co/d/f8DVSb2"
                },
                {
                    "name": "Snailax",
                    "width": 17,
                    "length": 33,
                    "power": 100,
                    "price": 50,
                    "url": "https://a.co/d/2haLmk1"
                },
                {
                    "width": 20,
                    "length": 40,
                    "power": 100,
                    "notes": "Intuitive user interface, good manual",
                    "children": [
                        {
                            "name": "Mefine",
                            "price": 49,
                            "url": "https://a.co/d/iVYCEwf"
                        },
                        {
                            "name": "Qfun",
                            "url": "https://a.co/d/j0AE2CI",
                            "price": 56
                        }
                    ]
                }
            ]
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
