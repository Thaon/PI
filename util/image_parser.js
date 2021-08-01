function imageToCanvas(img) {
    if(img.tagName === "CANVAS")return img;
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
}
function imageToCanvasCtx(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx;
}
function imageToImageData(img) {
    const canvas = imageToCanvas(img);
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
function analyzeImageData(imageData) {//alias
    return analyzeImageDataColors(imageData);
}
function analyzeImageDataColors(imageData) {
    const ret = {
        colors: ["transparent"],
        // colors: [],
        transparents: {},
        colorMap: {},
        byDarkness: [],
        grid: [],
        categories: {},
        islands: {},
        colorIndexMap: {},
        edgeMap: {},
        edges: {
            top: [],
            right: [],
            bottom: [],
            left: [],
        }
    };
    ret.grid = [...Array(imageData.height)].map(n=>[...Array(imageData.width)].map(n=>0));
    for (let x = 0; x < imageData.width; x++) {
        for (let y = 0; y < imageData.height; y++) {
            const i = (x + y * imageData.width) * 4;
            if (imageData.data[i + 3] !== 0) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const color = `rgb(${r},${g},${b})`;
                let colorIdx = ret.colors.indexOf(color);
                if (colorIdx === -1) {
                    colorIdx = ret.colors.length;
                    ret.colors.push(color);
                }
                ret.colorMap[`${x}_${y}`] = colorIdx;
                if(x===0&&y===0){
                    //console.log('colorIdx === ',colorIdx);
                }
                ret.grid[y][x] = colorIdx;
            } else {
                // const color = `transparent`;
                // let colorIdx = ret.colors.indexOf(color);
                // if (colorIdx === -1) {
                //     colorIdx = ret.colors.length;
                //     ret.colors.push(color);
                // }
                ret.transparents[`${x}_${y}`] = 1;
                ret.grid[y][x] = 0;
            }
        }
    }
    //console.log('ret.colors === ',ret.colors);
    //console.log('ret.grid === ',ret.grid);
    const grid = ret.grid;
    ret.colors.forEach((rgbStr,i) => {
        ret.colorIndexMap[rgbStr] = i;
        // //console.log(rgbStr,i);
        // const [r,g,b] = rgbStr.split("(")[1].split(")")[0].split(",").map(n=>Number(n));
        // if( rgbStr === "rgb(56,56,56)" )//console.log(JSON.stringify(_grid,null,4));
        const locs = [];
        const _grid = JSON.parse(JSON.stringify(ret.grid));
        //console.log('_grid === ',_grid);
        _grid.forEach((row, y)=>{
            row.forEach((v, x)=>{
                // if( rgbStr === "rgb(56,56,56)" )//console.log('v === ',v);
                if(v !== i){
                    _grid[y][x] = 0;
                } else {
                    const n = _grid[y-1] && _grid[y-1][x] === v;
                    const e = _grid[y][x+1] === v;
                    const s = _grid[y+1] && _grid[y+1][x] === v;
                    const w = _grid[y][x-1] === v;
                    const nw = _grid[y-1] && _grid[y-1][x-1] === v;
                    const ne = _grid[y-1] && _grid[y-1][x+1] === v;
                    const sw = _grid[y+1] && _grid[y+1][x-1] === v;
                    const se = _grid[y+1] && _grid[y+1][x+1] === v;
                    const neighbors = {n,e,s,w,nw,ne,sw,se};
                    const n2 = grid[y-1] && grid[y-1][x] === 0;
                    const e2 = grid[y][x+1] === 0;
                    const s2 = grid[y+1] && grid[y+1][x] === 0;
                    const w2 = grid[y][x-1] === 0;
                    const nw2 = grid[y-1] && grid[y-1][x-1] === 0;
                    const ne2 = grid[y-1] && grid[y-1][x+1] === 0;
                    const sw2 = grid[y+1] && grid[y+1][x-1] === 0;
                    const se2 = grid[y+1] && grid[y+1][x+1] === 0;
                    const trans = {n:n2,e:e2,s:s2,w:w2,nw:nw2,ne:ne2,sw:sw2,se:se2};
                    const tileIdx = getTileIdx(neighbors);
                    const neighborMap = {};
                    ret.colors.forEach((_rgbStr,_i) => {
                        const n = grid[y-1] && grid[y-1][x] === _i;
                        const e = grid[y][x+1] === _i;
                        const s = grid[y+1] && grid[y+1][x] === _i;
                        const w = grid[y][x-1] === _i;
                        const nw = grid[y-1] && grid[y-1][x-1] === _i;
                        const ne = grid[y-1] && grid[y-1][x+1] === _i;
                        const sw = grid[y+1] && grid[y+1][x-1] === _i;
                        const se = grid[y+1] && grid[y+1][x+1] === _i;
                        neighborMap[_rgbStr] = {n,e,s,w,nw,ne,sw,se};
                    });
                    locs.push({x,y,neighbors,trans,neighborMap,tileIdx});
                }
            });
        });
        // //console.log('locs === ',locs);
        const islands = ipo.gridToIslandsMeta(_grid, 1);
        ret.islands[rgbStr] = islands;
        ret.categories[rgbStr] = locs;
    });

    Object.keys(ret.categories)
        .filter(k=>k!=="transparent")
        .forEach(k=>{
            ret.categories[k].forEach(n=>{
                let isEdge = false;
                if(n.trans.n) {
                    ret.edges.top.push({ x:n.x, y:n.y });
                    isEdge = true;
                }
                if(n.trans.e) {
                    ret.edges.right.push({ x:n.x, y:n.y });
                    isEdge = true;
                }
                if(n.trans.s) {
                    ret.edges.bottom.push({ x:n.x, y:n.y });
                    isEdge = true;
                }
                if(n.trans.w) {
                    ret.edges.left.push({ x:n.x, y:n.y });
                    isEdge = true;
                }
                if(isEdge) {
                    ret.edgeMap[`${n.x}_${n.y}`] = true;
                }
            });
        });
    ret.byDarkness = Object.keys(ret.colorIndexMap)
        .filter(n=>n!=="transparent")
        .sort((a,b) => {
            const [r1,g1,b1] = a.split("(")[1].replace(")","").split(",").map(n=>Number(n));
            const [r2,g2,b2] = b.split("(")[1].replace(")","").split(",").map(n=>Number(n));
            const _a = (r1 + g1 + b1);
            const _b = (r2 + g2 + b2);
            return _a - _b;
        });
    return ret;

    function getTileIdx(n) {

        if(!n.n && !n.e && !n.s && !n.w)return 0;
        if(!n.n && !n.e &&  n.s && !n.w)return 1;
        if(!n.n &&  n.e &&  n.s && !n.w)return 2;
        if(!n.n &&  n.e &&  n.s &&  n.w)return 3;
        if(!n.n && !n.e &&  n.s &&  n.w)return 4;

        if( n.n &&  n.e && !n.s && !n.w)return 5;
        if( n.n &&  n.e && !n.s &&  n.w)return 6;
        if( n.n && !n.e && !n.s &&  n.w)return 7;

        // if(!n.n &&  n.e &&  n.s && !n.w)return 8;
        // if(!n.n && !n.e &&  n.s &&  n.w)return 9;
        
        if( n.n && !n.e && !n.s && !n.w)return 10;
        if( n.n && !n.e &&  n.s && !n.w)return 11;

        if( n.n &&  n.e &&  n.s && !n.w)return 12;
        if( n.n &&  n.e &&  n.s &&  n.w)return 13;
        if( n.n && !n.e &&  n.s &&  n.w)return 14;

        if(!n.n &&  n.e && !n.s && !n.w)return 15;
        if(!n.n &&  n.e && !n.s &&  n.w)return 16;
        if(!n.n && !n.e && !n.s &&  n.w)return 17;

        if( n.n && !n.e && !n.s && !n.w)return 11;
    }
}
function getImageDataTilemap(imageData, colorArr) {
    if (!colorArr) {
        colorArr = Object.keys(countImageDataColors(imageData)).map(n => {
            return n.replace("rgba(", "").split(",").slice(0, -1).join(":");
        });
    }
    // //console.log('colorArr === ',colorArr);
    const ret = [];
    const w = imageData.width;
    const h = imageData.height;
    for (let y = 0; y < h; y++) {
        const row = [];
        for (let x = 0; x < w; x++) {
            const i = (x + y * w) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            let id = 0;
            if (a > 0) {
                const idx = colorArr.indexOf(`${r}:${g}:${b}`);
                // //console.log('idx === ', idx);
                id = idx + 1;
            }
            row.push(id);
        }
        ret.push(row);
    }
    return ret;
}
function getImageDataGrid(imgOrCanvas, cw = 32, ch = 32, xo = 0, yo = 0, accessor) {
    const ret = {};
    const canvas = imageToCanvas(imgOrCanvas);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, imgOrCanvas.width, imgOrCanvas.height);
    const w = imageData.width;
    const h = imageData.height;
    let _x = 0;
    let _y = 0;
    for (let x = xo; x < w; x += cw) {
        for (let y = yo; y < h; y += ch) {
            const _imageData = ctx.getImageData(x, y, cw, ch);
            if (accessor) {
                accessor(_imageData);
            }
            ret[`${_x}_${_y}`] = _imageData;
            _y++;
        }
        _x++;
        _y = 0;
    }
    return ret;
}
function getLinearImageDataGrid(imgOrCanvas, cw = 32, ch = 32, xo = 0, yo = 0, accessor) {
    const ret = [];
    const canvas = imageToCanvas(imgOrCanvas);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, imgOrCanvas.width, imgOrCanvas.height);
    const w = imageData.width;
    const h = imageData.height;
    for (let y = yo; y < h; y += ch) {
        for (let x = xo; x < w; x += cw) {
            const _imageData = ctx.getImageData(x, y, cw, ch);
            if (accessor) {
                accessor(_imageData);
            }
            ret.push(_imageData);
        }
    }
    return ret;
}
function imageDataGridToImageData(arr) {
    const ret = [];
    // const p = arr[0].width;
    const maxW = Math.max(...arr.map(n=>n.width));
    const maxH = Math.max(...arr.map(n=>n.height));
    const sqrt = Math.sqrt(arr.length);
    const canvas = document.createElement('canvas');
    const w = canvas.width = sqrt * maxW;
    const h = canvas.height = sqrt * maxH;
    const ctx = canvas.getContext('2d');
    //console.log('sqrt === ',sqrt);
    // const imageData = ctx.getImageData(0, 0, img.width, img.height);
    let i = 0;
    for(let x = 0; x < w; x += maxW) {
        for(let y = 0; y < h; y += maxH) {
            ctx.putImageData(arr[i], x, y);
            i++;
        }
    }
    return canvasToImageData(canvas);
}
function imageDataGridToCanvas(arr, cw = 1, ch = 1) {
    const ret = [];
    // const p = arr[0].width;
    cw = Math.max(...arr.map(n=>n.width));
    ch = Math.max(...arr.map(n=>n.height));
    const sqrt = Math.ceil(Math.sqrt(arr.length));
    const canvas = document.createElement('canvas');
    const w = canvas.width = sqrt * cw;
    const h = canvas.height = sqrt * ch;
    const ctx = canvas.getContext('2d');
    //console.log('sqrt === ',sqrt);
    // const imageData = ctx.getImageData(0, 0, img.width, img.height);
    let i = 0;
    for(let x = 0; x < w; x += cw) {
        for(let y = 0; y < h; y += ch) {
            if(arr[i]){
                ctx.putImageData(arr[i], x, y);
                i++;
            } else {
                break;
            }
        }
    }
    return canvas;
}
function getBoundedLinearImageDataGrid(img, cw = 32, ch = 32, xo = 0, yo = 0, accessor) {
    const ret = [];
    const canvas = imageToCanvas(img);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const w = imageData.width;
    const h = imageData.height;
    for (let y = yo; y < h; y += ch) {
        for (let x = xo; x < w; x += cw) {
            const _imageData = trimImageData(
                ctx.getImageData(x, y, cw, ch)
            );
            if (accessor) {
                accessor(_imageData);
            }
            ret.push(_imageData);
        }
    }
    return ret;
}
function flipImageData(imageData, horiz = false, vert = false) {
    const w = imageData.width;
    const h = imageData.height;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const flippedImageData = ctx.createImageData(w, h);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = _i(x, y);
            const i2 = _i(
                horiz ? w - x - 1 : x,
                vert ? h - y - 1 : y,
            );
            flippedImageData.data[i2] = imageData.data[i];
            flippedImageData.data[i2 + 1] = imageData.data[i + 1];
            flippedImageData.data[i2 + 2] = imageData.data[i + 2];
            flippedImageData.data[i2 + 3] = imageData.data[i + 3];
        }
    }
    return flippedImageData;

    function _i(x, y) {
        return (x + y * imageData.width) * 4;
    }
}
function flipCanvas(canvas, horiz = false, vert = false) {
    return imageDataToCanvas(
        flipImageData(
            canvasToImageData(canvas),
            horiz,
            vert
        )
    );
}
function rotateImageData(imageData, radians) {
    const w = imageData.width;
    const h = imageData.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    const flippedImageData = ctx.createImageData(w, h);

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = _i(x, y);
            const i2 = _i(
                (x * Math.cos(radians)) - (y * Math.sin(radians)),
                (x * Math.sin(radians)) - (y * Math.cos(radians)),
            );
            flippedImageData.data[i2] = imageData.data[i];
            flippedImageData.data[i2 + 1] = imageData.data[i + 1];
            flippedImageData.data[i2 + 2] = imageData.data[i + 2];
            flippedImageData.data[i2 + 3] = imageData.data[i + 3];
        }
    }
    return flippedImageData;

    function _i(x, y) {
        return (x + y * imageData.width) * 4;
    }
}
function countImageDataColors(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const colorCounts = {};
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            const key = `rgba(${r},${g},${b},${a})`;
            if (!colorCounts[key]) colorCounts[key] = 0;
            colorCounts[key]++;
        }
    }
    return colorCounts;
}
function hex2rgb(hex, opacity) {
    var h=hex.replace('#', '');
    h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));

    for(var i=0; i<h.length; i++)
        h[i] = parseInt(h[i].length==1? h[i]+h[i]:h[i], 16);

    if (typeof opacity != 'undefined') {
        h.push(opacity);
    }
    if(h[3] === undefined){
        return {
            r: h[0],
            g: h[1],
            b: h[2]
        };
    } else {
        return {
            r: h[0],
            g: h[1],
            b: h[2],
            a: h[3]
        };
    }
}
function getHexColor(colorStr) {
    if(!window.HEX_COLOR_CACHE)window.HEX_COLOR_CACHE = {};
    if(window.HEX_COLOR_CACHE[colorStr])return window.HEX_COLOR_CACHE[colorStr];
    var a = document.createElement('div');
    a.style.color = colorStr;
    var colors = window.getComputedStyle( document.body.appendChild(a) ).color.match(/\d+/g).map(function(a){ return parseInt(a,10); });
    document.body.removeChild(a);
    const ret = (colors.length >= 3) ? '#' + (((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2]).toString(16).substr(1)) : false;
    window.HEX_COLOR_CACHE[colorStr] = ret;
    return ret;
}
function color2rgb(color) {
    let colorStr = '';
    if(typeof color === "string"){
        colorStr = color;
    } else {
        colorStr = `rgba(${color.r},${color.g},${color.b},1)`;
    }
    const hex = getHexColor(colorStr);
    return hex2rgb(hex);
}
function replaceImageDataColor(imageData, rgba, rgba2, softAlpha = false) {
    if(typeof rgba === "string") {
        rgba = hex2rgb(rgba);
    }
    if(typeof rgba2 === "string") {
        rgba2 = hex2rgb(rgba2);
        // console.log('rgba2 === ',rgba2);
    }
    const w = imageData.width;
    const h = imageData.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            const r = rgba.r === imageData.data[i];
            const g = rgba.g === imageData.data[i + 1];
            const b = rgba.b === imageData.data[i + 2];
            const a = rgba.a === imageData.data[i + 3] || (imageData.data[i + 3] && softAlpha);
            if (r && g && b && a) {
                imageData.data[i] = rgba2.r;
                imageData.data[i + 1] = rgba2.g;
                imageData.data[i + 2] = rgba2.b;
                imageData.data[i + 3] = rgba2.a;
            }
        }
    }
    return imageData;
}
function replaceImageDataColors(imageData, colorMap, preserveAlpha = true) {
    const w = imageData.width;
    const h = imageData.height;
    Object.keys(colorMap).forEach(k=>{
        const c = colorMap[k];
        if(typeof c === "string"){
            colorMap[k] = hex2rgb(c);
        }
    });
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            const r0 = imageData.data[i];
            const g0 = imageData.data[i + 1];
            const b0 = imageData.data[i + 2];
            const a0 = imageData.data[i + 3];
            const colorKey = `rgb(${r0},${g0},${b0})`;
            if (colorMap[colorKey]) {
                const {r,g,b} = colorMap[colorKey];
                imageData.data[i] = r;
                imageData.data[i + 1] = g;
                imageData.data[i + 2] = b;
                imageData.data[i + 3] = preserveAlpha ? a0 : 255;
            }
        }
    }
    return imageData;
}
function removeImageDataColor(imageData, rgba) {
    replaceImageDataColor(imageData, rgba, {
        r: 0,
        g: 0,
        b: 0,
        a: 0
    });
}
function whiteListImageDataColors(imageData, rgbaArr) {
    const w = imageData.width;
    const h = imageData.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            let remove = true;
            rgbaArr.forEach(rgba => {
                const r = rgba.r === imageData.data[i];
                const g = rgba.g === imageData.data[i + 1];
                const b = rgba.b === imageData.data[i + 2];
                const a = rgba.a === imageData.data[i + 3];
                if (r && g && b && a) {
                    imageData.data[i] = rgba2.r;
                    imageData.data[i + 1] = rgba2.g;
                    imageData.data[i + 2] = rgba2.b;
                    imageData.data[i + 3] = rgba2.a;
                    remove = false;
                }
            });
            if (remove) {
                imageData.data[i] = 0;
                imageData.data[i + 1] = 0;
                imageData.data[i + 2] = 0;
                imageData.data[i + 3] = 0;
            }
        }
    }
}
function fullAlphaImageData(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            if (imageData.data[i + 3] > 0) {
                imageData.data[i + 3] = 255;
            }
        }
    }
    return imageData;
}
function filterAlphaImageData(imageData, filter) {
    const w = imageData.width;
    const h = imageData.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            if (filter(imageData.data[i + 3])) {
                imageData.data[i + 3] = 255;
            } else {
                imageData.data[i + 3] = 0;
            }
        }
    }
    return imageData;
}
function getPixelsFromImageData(imageData, rgba) {
    const w = imageData.width;
    const h = imageData.height;
    const points = [];
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            const r = rgba.r === imageData.data[i];
            const g = rgba.g === imageData.data[i + 1];
            const b = rgba.b === imageData.data[i + 2];
            const a = !rgba.a || rgba.a === imageData.data[i + 3];
            if (r && g && b && a) {
                points.push([x, y]);
            }
        }
    }
    return points;
}
function fillTransparentNeighbors(imageData, ignoreRGBAArr, fillRGBA) {
    const w = imageData.width;
    const h = imageData.height;
    const cache = {};
    const filledCache = {};
    for (let x = 0; x < w; x++) {
        if (!filledCache[x]) filledCache[x] = {};
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            // //console.log('ignore(i), x, y === ',ignore(i), x, y);
            if (imageData.data[i + 3] > 0 && !ignore(i) && !filledCache[x][y]) {
                maybeFillNeighbor(x, y - 1); //n
                maybeFillNeighbor(x, y + 1); //s
                maybeFillNeighbor(x + 1, y); //e
                maybeFillNeighbor(x - 1, y); //w
            }
        }
    }

    function maybeFillNeighbor(x, y) {
        const _i = (x + y * w) * 4;
        if (!cache[x]) cache[x] = {};
        if (!cache[x][y]) {
            cache[x][y] = {
                r: imageData.data[_i],
                g: imageData.data[_i + 1],
                b: imageData.data[_i + 2],
                a: imageData.data[_i + 3]
            }
        }
        if (cache[x][y].a === 0) {
            if (!filledCache[x]) filledCache[x] = {};
            filledCache[x][y] = 1;
            cache[x][y].r = imageData.data[_i] = fillRGBA.r;
            cache[x][y].g = imageData.data[_i + 1] = fillRGBA.g;
            cache[x][y].b = imageData.data[_i + 2] = fillRGBA.b;
            cache[x][y].a = imageData.data[_i + 3] = fillRGBA.a;
        }
    }

    function ignore(_i) {
        let count = 0;
        ignoreRGBAArr.forEach(rgba => {
            if (rgba.r === imageData.data[_i] &&
                rgba.g === imageData.data[_i + 1] &&
                rgba.b === imageData.data[_i + 2] &&
                rgba.a === imageData.data[_i + 3]) {
                // //console.log(`${rgba.r} === ${imageData.data[_i]}
                // || ${rgba.g} === ${imageData.data[_i + 1]}
                // || ${rgba.b} === ${imageData.data[_i + 2]}
                // || ${rgba.a} === ${imageData.data[_i + 3]}`);
                count++;
            }
        });
        return count > 0;
    }
}
function outlineImageData(imageData, ignoreRGBAArr, fillRGBA, sides = {n:true,s:true,e:true,w:true,nw:true,ne:true,sw:true,se:true}) {
    const w = imageData.width;
    const h = imageData.height;
    const cache = {};
    const filledCache = {};
    for (let x = 0; x < w; x++) {
        if (!filledCache[x]) filledCache[x] = {};
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            // //console.log('ignore(i), x, y === ',ignore(i), x, y);
            if (imageData.data[i + 3] > 0 && !ignore(i) && !filledCache[x][y]) {
                if(sides.n)maybeFillNeighbor(x, y - 1); //n
                if(sides.s)maybeFillNeighbor(x, y + 1); //s
                if(sides.e)maybeFillNeighbor(x + 1, y); //e
                if(sides.w)maybeFillNeighbor(x - 1, y); //w
                if(sides.nw)maybeFillNeighbor(x - 1, y - 1); //nw
                if(sides.ne)maybeFillNeighbor(x + 1, y - 1); //ne
                if(sides.sw)maybeFillNeighbor(x - 1, y + 1); //sw
                if(sides.se)maybeFillNeighbor(x + 1, y + 1); //se
            }
        }
    }

    function maybeFillNeighbor(x, y) {
        const _i = (x + y * w) * 4;
        if (!cache[x]) cache[x] = {};
        if (!cache[x][y]) {
            cache[x][y] = {
                r: imageData.data[_i],
                g: imageData.data[_i + 1],
                b: imageData.data[_i + 2],
                a: imageData.data[_i + 3]
            }
        }
        if (cache[x][y].a === 0) {
            if (!filledCache[x]) filledCache[x] = {};
            filledCache[x][y] = 1;
            cache[x][y].r = imageData.data[_i] = fillRGBA.r;
            cache[x][y].g = imageData.data[_i + 1] = fillRGBA.g;
            cache[x][y].b = imageData.data[_i + 2] = fillRGBA.b;
            cache[x][y].a = imageData.data[_i + 3] = fillRGBA.a;
        }
    }

    function ignore(_i) {
        let count = 0;
        ignoreRGBAArr.forEach(rgba => {
            if (rgba.r === imageData.data[_i] &&
                rgba.g === imageData.data[_i + 1] &&
                rgba.b === imageData.data[_i + 2] &&
                rgba.a === imageData.data[_i + 3]) {
                // //console.log(`${rgba.r} === ${imageData.data[_i]}
                // || ${rgba.g} === ${imageData.data[_i + 1]}
                // || ${rgba.b} === ${imageData.data[_i + 2]}
                // || ${rgba.a} === ${imageData.data[_i + 3]}`);
                count++;
            }
        });
        return count > 0;
    }
}
function gridToCollisionCanvas(grid, scale = 1, zeroColor = {r:0,g:0,b:0,a:255}, nonZeroColor = {r:255,g:255,b:255,a:255}) {
    // this assumes grid cell values are integers
    const canvas = document.createElement('canvas');
    const w = canvas.width = grid[0].length;
    const h = canvas.height = grid.length;
    const ctx = canvas.getContext("2d");
    const imageData = canvasToImageData(canvas);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            const rgba = grid[y][x] === 0 ? zeroColor : nonZeroColor;
            imageData.data[i] = rgba.r;
            imageData.data[i + 1] = rgba.g;
            imageData.data[i + 2] = rgba.b;
            imageData.data[i + 3] = rgba.a;
        }
    }
    if(scale === 1) {
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    } else {
        return imageDataToCanvas(scaleImageData(imageData, scale));
    }
}
function rotateImageDataCounterClockwise(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    const flippedImageData = ctx.createImageData(w, h);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = _i(x, y);
            const x2 = y;
            const y2 = h - x - 1;
            const i2 = _i(
                x2,
                y2
            );
            flippedImageData.data[i2] = imageData.data[i];
            flippedImageData.data[i2 + 1] = imageData.data[i + 1];
            flippedImageData.data[i2 + 2] = imageData.data[i + 2];
            flippedImageData.data[i2 + 3] = imageData.data[i + 3];
        }
    }
    return flippedImageData;
    // return flipImageData(flippedImageData, true);

    function _i(x, y) {
        return (x + y * imageData.width) * 4;
    }
}
function copyCanvas(canvas) {
    const id = canvasToImageData(canvas);
    return imageDataToCanvas(id);
}
function canvasToImageData(canvas) {
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
function cloneImageData(imageData, xo = 0, yo = 0, wo = 0, ho = 0) {
    return copyImageData(...arguments);
}
function copyImageData(imageData, xo = 0, yo = 0, wo = 0, ho = 0) {
    const canvas = document.createElement('canvas');
    const w = canvas.width = imageData.width + wo;
    const h = canvas.height = imageData.height + ho;
    const ctx = canvas.getContext('2d');
    const imageData2 = ctx.createImageData(w, h);
    for (let x = 0; x < w - wo; x++) {
        for (let y = 0; y < h - ho; y++) {
            const i = (x + y * imageData.width) * 4;
            if (imageData.data[i + 3] > 0) {
                const i2 = ((x+xo) + (y+yo) * imageData2.width) * 4;
                imageData2.data[i2] = imageData.data[i];
                imageData2.data[i2 + 1] = imageData.data[i + 1];
                imageData2.data[i2 + 2] = imageData.data[i + 2];
                imageData2.data[i2 + 3] = imageData.data[i + 3];
            }
        }
    }
    return imageData2;
}
function cloneImageDataByColor(imageData, rgb) {
    return copyImageDataByColor(...arguments);
}
function copyImageDataByColor(imageData, rgb) {
    const canvas = document.createElement('canvas');
    const w = canvas.width = imageData.width;
    const h = canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    const imageData2 = ctx.createImageData(w, h);
    for (let x = 0; x < w - wo; x++) {
        for (let y = 0; y < h - ho; y++) {
            const i = (x + y * imageData.width) * 4;
            if (imageData.data[i + 3] > 0) {
                const {r,g,b} = rgb;
                if(imageData.data[i] === r && imageData.data[i + 1] === g && imageData.data[i + 2] === b) {
                    const i2 = ((x) + (y) * imageData2.width) * 4;
                    imageData2.data[i2] = imageData.data[i];
                    imageData2.data[i2 + 1] = imageData.data[i + 1];
                    imageData2.data[i2 + 2] = imageData.data[i + 2];
                    imageData2.data[i2 + 3] = imageData.data[i + 3];
                }
            }
        }
    }
    return imageData2;
}
function cropImageData(imageData, xo, yo, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imageData2 = ctx.createImageData(w, h);
    for (let x = xo; x < w + xo; x++) {
        for (let y = yo; y < h + yo; y++) {
            const i = (x + y * imageData.width) * 4;
            const i2 = ((x - xo) + (y - yo) * w) * 4;
            if (imageData.data[i + 3] > 0) {
                imageData2.data[i2] = imageData.data[i];
                imageData2.data[i2 + 1] = imageData.data[i + 1];
                imageData2.data[i2 + 2] = imageData.data[i + 2];
                imageData2.data[i2 + 3] = imageData.data[i + 3];
            }
        }
    }
    return imageData2;
}
function cropImageToCanvas(image, xo, yo, w, h) {
    const ctx = imageToCanvasCtx(image);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const canvas2 = document.createElement('canvas');
    canvas2.width = w;
    canvas2.height = h;
    const ctx2 = canvas2.getContext('2d');
    const imageData2 = ctx2.createImageData(w, h);
    for (let x = xo; x < w + xo; x++) {
        for (let y = yo; y < h + yo; y++) {
            const i = (x + y * imageData.width) * 4;
            const i2 = ((x - xo) + (y - yo) * w) * 4;
            if (imageData.data[i + 3] > 0) {
                imageData2.data[i2] = imageData.data[i];
                imageData2.data[i2 + 1] = imageData.data[i + 1];
                imageData2.data[i2 + 2] = imageData.data[i + 2];
                imageData2.data[i2 + 3] = imageData.data[i + 3];
            }
        }
    }
    ctx2.putImageData(imageData2, 0, 0);
    return canvas2;
}
function createImageData(width, height, colors = {}) {
    const canvas = document.createElement('canvas');
    const w = canvas.width = width;
    const h = canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(w, h);
    Object.keys(colors).forEach(color => {
        const [r, g, b, a] = color.split("_").map(n => Number(n));
        const points = colors[color];
        points.forEach(point => {
            const [x, y] = point;
            const i = (x + y * w) * 4;
            imageData.data[i] = r;
            imageData.data[i + 1] = g;
            imageData.data[i + 2] = b;
            imageData.data[i + 3] = a === undefined ? 255 : a;
        })
    })
    return imageData;
}
function maskImageData(imageData, imageData2, xo, yo) {
    const w = imageData.width;
    const h = imageData.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * imageData.width) * 4;
            const x2 = x - xo;
            const y2 = y - yo;
            const i2 = (x2 + y2 * imageData2.width) * 4;
            const visible = imageData.data[i + 3] && imageData.data[i + 3] > 0;
            const visible2 = imageData2.data[i2 + 3] && imageData2.data[i2 + 3] > 0;
            if (visible && visible2) {
                imageData.data[i] = imageData2.data[i2];
                imageData.data[i + 1] = imageData2.data[i2 + 1];
                imageData.data[i + 2] = imageData2.data[i2 + 2];
                imageData.data[i + 3] = imageData2.data[i2 + 3];
            }
        }
    }
}
function concatHorizImageData(imageData1, imageData2) {
    const imageData = createImageData(imageData1.width + imageData2.width, imageData1.height);
    mergeImageData(imageData, imageData1);
    mergeImageData(imageData, imageData2, imageData1.width);
    return imageData;
}
function concatVertImageData(imageData1, imageData2) {
    const imageData = createImageData(imageData1.width, imageData1.height + imageData2.height);
    mergeImageData(imageData, imageData1);
    mergeImageData(imageData, imageData2, 0, imageData1.height);
    return imageData;
}
function mergeImageData(imageData, imageData2, xo = 0, yo = 0) {
    const w = imageData2.width;
    const h = imageData2.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * imageData2.width) * 4;
            const x0 = x + xo;
            const y0 = y + yo;
            const i0 = (x0 + y0 * imageData.width) * 4;
            if (imageData2.data[i + 3] > 0 && x0 >= 0 && y0 >= 0 && x0 < imageData.width && y0 < imageData.height) {
                imageData.data[i0] = imageData2.data[i];
                imageData.data[i0 + 1] = imageData2.data[i + 1];
                imageData.data[i0 + 2] = imageData2.data[i + 2];
                imageData.data[i0 + 3] = imageData2.data[i + 3];
            }
        }
    }
    return imageData;
}
function mergeImageDataIgnoreOneColor(imageData, imageData2, xo = 0, yo = 0, rgba) {
    const w = imageData2.width;
    const h = imageData2.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * imageData2.width) * 4;
            const x0 = x + xo;
            const y0 = y + yo;
            const i0 = (x0 + y0 * imageData.width) * 4;
            if (imageData2.data[i + 3] > 0 && x0 >= 0 && y0 >= 0 && x0 < imageData.width && y0 < imageData.height) {
                if(imageData.data[i0 + 3] > 0) {
                    const isBadColor = imageData2.data[i] === rgba.r &&
                        imageData2.data[i+1] === rgba.g &&
                        imageData2.data[i+2] === rgba.b
                        ;
                    if(!isBadColor) {
                        imageData.data[i0] = imageData2.data[i];
                        imageData.data[i0 + 1] = imageData2.data[i + 1];
                        imageData.data[i0 + 2] = imageData2.data[i + 2];
                        imageData.data[i0 + 3] = imageData2.data[i + 3];
                    }
                } else {
                    imageData.data[i0] = imageData2.data[i];
                    imageData.data[i0 + 1] = imageData2.data[i + 1];
                    imageData.data[i0 + 2] = imageData2.data[i + 2];
                    imageData.data[i0 + 3] = imageData2.data[i + 3];
                }

            }
        }
    }
    return imageData;
}
function mixImageData(imageData, imageData2, xo = 0, yo = 0) {
    // merge and average
    const w = imageData2.width;
    const h = imageData2.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * imageData2.width) * 4;
            const x0 = x + xo;
            const y0 = y + yo;
            const i0 = (x0 + y0 * imageData.width) * 4;
            if (imageData2.data[i + 3] > 0 && x0 >= 0 && y0 >= 0 && x0 < imageData.width && y0 < imageData.height) {
                if (imageData.data[i0 + 3]) {
                    imageData.data[i0] = Math.ceil((imageData.data[i0] + imageData2.data[i]) / 2);
                    imageData.data[i0 + 1] = Math.ceil((imageData.data[i0 + 1] + imageData2.data[i + 1]) / 2);
                    imageData.data[i0 + 2] = Math.ceil((imageData.data[i0 + 2] + imageData2.data[i + 2]) / 2);
                    imageData.data[i0 + 3] = Math.ceil((imageData.data[i0 + 3] + imageData2.data[i + 3]) / 2);
                } else {
                    imageData.data[i0] = imageData2.data[i];
                    imageData.data[i0 + 1] = imageData2.data[i + 1];
                    imageData.data[i0 + 2] = imageData2.data[i + 2];
                    imageData.data[i0 + 3] = imageData2.data[i + 3];
                }
            }
        }
    }
    return imageData;
}
function trimImageData(imageData) {
    const b = imageDataBounds(imageData);
    // //console.log('b === ', b);
    return cropImageData(
        imageData,
        b.minX,
        b.minY,
        b.maxX - b.minX + 1,
        b.maxY - b.minY + 1
    );
}
function imageDataBounds(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const ret = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * imageData.width) * 4;
            if (imageData.data[i + 3] > 0) {
                if (ret.minX > x) ret.minX = x;
                if (ret.maxX < x) ret.maxX = x;
                if (ret.minY > y) ret.minY = y;
                if (ret.maxY < y) ret.maxY = y;
            }
        }
    }
    // if(ret.maxY !== -Infinity) {
    //     for (let x = ret.minX; x <= ret.maxX; x++) {
    //         const y = ret.maxY;
    //         const i = (x + y * imageData.width) * 4;
    //         if(imageData.data[i + 3] > 0) {
    //             if (typeof ret.maxYminX === "undefined") {//TODO - wtf was I doing here??
    //                 ret.maxYminX = x;
    //             }
    //             if (typeof ret.maxYmaxX === "undefined" || ret.maxYmaxX < x) {//TODO - wtf was I doing here??
    //                 ret.maxYmaxX = x;
    //             }
    //         }
    //     }
    // }
    if(ret.minX === Infinity){
        ret.minX = 0;
        ret.maxX = imageData.width - 1;
        ret.minY = 0;
        ret.maxY = imageData.height - 1;
        ret.w = imageData.width;
        ret.h = imageData.height;
    }
    return ret;
}
function onionImageData(imageData, imageData2, xo, yo, alpha) {
    const w = imageData2.width;
    const h = imageData2.height;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const i = (x + y * imageData2.width) * 4;
            const x0 = x + xo;
            const y0 = y + yo;
            const i0 = (x0 + y0 * imageData.width) * 4;
            if (imageData2.data[i + 3] > 0) {
                imageData.data[i0] = imageData2.data[i];
                imageData.data[i0 + 1] = imageData2.data[i + 1];
                imageData.data[i0 + 2] = imageData2.data[i + 2];
                imageData.data[i0 + 3] = imageData2.data[i + 3];
            } else if (imageData.data[i0 + 3] > 0) {
                imageData.data[i0 + 3] = alpha;
            }
        }
    }
}
function partImageData(part, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const _part = part.part ? part.part : part;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(
        _part.data,
        (w / 2) - (_part.cw / 2),
        (h / 2) - (_part.ch / 2)
    );
    return ctx.getImageData(0, 0, w, h);
}
function imageDataToCanvas(imageData, x = 0, y = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, x, y);
    return canvas;
}
function shiftImageData(imageData, x = 0, y = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, x, y);
    return ctx.getImageData(0, 0, imageData.width, imageData.height);
}
function imageDataToCanvasScaled(imageData, scale, x = 0, y = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width * scale;
    canvas.height = imageData.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(scaleImageData(imageData, scale), x, y);
    return canvas;
}
function scaleCanvas(canvas, scale) {
    return imageDataToCanvas(
        scaleImageData(
            canvasToImageData(canvas),
            scale
        )
    );
}
function scaleImageData(imageData, scale) {
    if (scale === 1) return imageData;
    var scaledImageData = document.createElement("canvas").getContext("2d").createImageData(imageData.width * scale, imageData.height * scale);
    for (var row = 0; row < imageData.height; row++) {
        for (var col = 0; col < imageData.width; col++) {
            var sourcePixel = [
                imageData.data[(row * imageData.width + col) * 4 + 0],
                imageData.data[(row * imageData.width + col) * 4 + 1],
                imageData.data[(row * imageData.width + col) * 4 + 2],
                imageData.data[(row * imageData.width + col) * 4 + 3]
            ];
            for (var y = 0; y < scale; y++) {
                var destRow = row * scale + y;
                for (var x = 0; x < scale; x++) {
                    var destCol = col * scale + x;
                    for (var i = 0; i < 4; i++) {
                        scaledImageData.data[(destRow * scaledImageData.width + destCol) * 4 + i] =
                            sourcePixel[i];
                    }
                }
            }
        }
    }
    return scaledImageData;
}
function scaleDownImageData(imageData, scale) {
    if (scale === 1) return imageData;
    var scaledImageData = document.createElement("canvas").getContext("2d").createImageData(
        Math.floor(imageData.width / scale),
        Math.floor(imageData.height / scale)
    );
    let y = 0;
    let x = 0;
    for (var row = 0; row < imageData.height; row += scale) {
        x = 0;
        for (var col = 0; col < imageData.width; col += scale) {
            var sourcePixel = [
                imageData.data[(row * imageData.width + col) * 4 + 0],
                imageData.data[(row * imageData.width + col) * 4 + 1],
                imageData.data[(row * imageData.width + col) * 4 + 2],
                imageData.data[(row * imageData.width + col) * 4 + 3]
            ];
            scaledImageData.data[(y * scaledImageData.width + x) * 4] = sourcePixel[0];
            scaledImageData.data[(y * scaledImageData.width + x) * 4 + 1] = sourcePixel[1];
            scaledImageData.data[(y * scaledImageData.width + x) * 4 + 2] = sourcePixel[2];
            scaledImageData.data[(y * scaledImageData.width + x) * 4 + 3] = sourcePixel[3];
            x++;
        }
        y++;
    }
    return scaledImageData;
}
function transformImageData(imageData, arr, padding = 0) {
    let scale = 1;
    arr.forEach(row => {
        switch (row.type) {
            case "replace":
                replaceImageDataColor(imageData, row.rgba, row.rgba2);
                break;
            case "scale":
                scale = row.scale;
                imageData = scaleImageData(imageData, row.scale);
                break;
            case "outline":
                fillTransparentNeighbors(
                    imageData,
                    row.ignore ?? [],
                    row.rgba
                );
                break;
            case "gradient":
                const canvas = document.createElement('canvas');
                const w = canvas.width = imageData.width;
                const h = canvas.height = imageData.height;
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, h);
                row.colors.forEach(n => {
                    gradient.addColorStop(...n);
                });
                ctx.fillStyle = gradient;
                ctx.fillRect(scale-1, scale-1, w, h);
                const imageData2 = ctx.getImageData(0, 0, w+2, h+2);
                maskImageData(imageData, imageData2, 0, 0);

                break;
            case "full-outline":
                const bounds = imageDataBounds(imageData);
                if(bounds.minX === 0 || bounds.minY === 0){
                    imageData = copyImageData(
                        imageData,
                        1,
                        1,
                        2,
                        2
                    );
                    //console.log('imageData.width === ',imageData.width);
                    //console.log('imageData.height === ',imageData.height);
                }
                outlineImageData( //TODO - add room for the outline if it doesnt exist
                    imageData,
                    row.ignore ?? [],
                    row.rgba
                );
                break;
            case "partial-outline":
                const bounds2 = imageDataBounds(imageData);
                if(bounds2.minX === 0 || bounds2.minY === 0){
                    imageData = copyImageData(
                        imageData,
                        1,
                        1,
                        2,
                        2
                    )
                    
                    const bounds2b = imageDataBounds(imageData);

                    //console.log('bounds2b === ',bounds2b);
                }
                outlineImageData( //TODO - add room for the outline if it doesnt exist
                    imageData,
                    row.ignore ?? [],
                    row.rgba,
                    row.sides
                );
                break;
        }
    })
    return imageData;
}
function gradientTopDown(ctx,height,colors) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    colors.forEach(n => {
        gradient.addColorStop(...n);
    });
    return gradient;
}
function append_alpha(color, aa) {
    if (color && color[0] === "#" && color.length === 7) {
        return color + aa;
    }
    return color;
}
// function tilemapToTypedTilemap(tileMap, columnCount) {
//     return tileMap.map((arr,x)=>{
//         return arr.map((_,y)=>{
//             return getTileType(x, y);
//         })
//     })
//     function getTileType(x, y) {
//         const type = tileMap[x][y];

//         // LNE
//         /*****//*****/
//         /**6**//*[1]*/
//         /*****//*****/
//         /*****//*****/
//         /**5**//**7**/
//         /*****//*****/
//         // OSW
//         /*****//*****/
//         /**1**//*[1]*/
//         /*****//*****/
//         /*****//*****/
//         /**5**//**1**/
//         /*****//*****/
//         const _LNE = tileMap[x-1] && tileMap[x][y+1] !== type && tileMap[x-1][y] !== type && tileMap[x-1][y+1] !== type;
//         const _LNW = tileMap[x+1] && tileMap[x][y+1] !== type && tileMap[x+1][y] !== type && tileMap[x+1][y+1] !== type;
//         const _LSW = tileMap[x+1] && tileMap[x][y-1] !== type && tileMap[x+1][y] !== type && tileMap[x+1][y-1] !== type;
//         const _LSE = tileMap[x-1] && tileMap[x][y-1] !== type && tileMap[x-1][y] !== type && tileMap[x-1][y-1] !== type;
//         const _ONE = tileMap[x+1] && tileMap[x][y-1] === type && tileMap[x+1][y] === type && tileMap[x+1][y-1] !== type;
//         const _ONW = tileMap[x-1] && tileMap[x][y-1] === type && tileMap[x-1][y] === type && tileMap[x-1][y-1] !== type;
//         const _OSW = tileMap[x-1] && tileMap[x][y+1] === type && tileMap[x-1][y] === type && tileMap[x-1][y+1] !== type;
//         const _OSE = tileMap[x+1] && tileMap[x][y+1] === type && tileMap[x+1][y] === type && tileMap[x+1][y+1] !== type;
//         const _N = tileMap[x][y-1] !== type;
//         const _E = tileMap[x+1] && tileMap[x+1][y] !== type;
//         const _S = tileMap[x][y+1] !== type;
//         const _W = tileMap[x-1] && tileMap[x-1][y] !== type;

//         if(_LNE)return type + (columnCount * 10);
//         if(_LNW)return type + (columnCount * 11);
//         if(_LSE)return type + (columnCount * 4);
//         if(_LSW)return type + (columnCount * 5);
//         if(_ONW)return type + (columnCount * 23);
//         if(_ONE)return type + (columnCount * 25);
//         if(_OSE)return type + (columnCount * 26);
//         if(_OSW)return type + (columnCount * 24);
//         if(_N)return type + (columnCount * 1);
//         if(_S)return type + (columnCount * 9);
//         if(_E)return type + (columnCount * 3);
//         if(_W)return type + (columnCount * 2);
//         return type;
//     }
// }
function tilemapToTypedTilemap(tileMap, columnCount) {
    return tileMap.map((arr, y) => {
        return arr.map((_, x) => {
            return getTileType(x, y);
        })
    })

    function getTileType(_x, _y) {
        const type = tileMap[_y][_x];
        if (type === 0) return type;

        const no_N = tileMap[_y - 1] && typeof tileMap[_y - 1][_x] !== "undefined" && tileMap[_y - 1][_x] !== type;
        const no_E = typeof tileMap[_y][_x + 1] !== "undefined" && tileMap[_y][_x + 1] !== type;
        const no_S = tileMap[_y + 1] && typeof tileMap[_y + 1][_x] !== "undefined" && tileMap[_y + 1][_x] !== type;
        const no_W = typeof tileMap[_y][_x - 1] !== "undefined" && tileMap[_y][_x - 1] !== type;
        const no_NE = tileMap[_y - 1] && typeof tileMap[_y - 1][_x + 1] !== "undefined" && tileMap[_y - 1][_x + 1] !== type;
        const no_SE = tileMap[_y + 1] && typeof tileMap[_y + 1][_x + 1] !== "undefined" && tileMap[_y + 1][_x + 1] !== type;
        const no_SW = tileMap[_y + 1] && typeof tileMap[_y + 1][_x - 1] !== "undefined" && tileMap[_y + 1][_x - 1] !== type;
        const no_NW = tileMap[_y - 1] && typeof tileMap[_y - 1][_x - 1] !== "undefined" && tileMap[_y - 1][_x - 1] !== type;

        const typeMap = {
            "N_E_S_W": no_N && no_E && no_S && no_W,
            "NE_SE_SW_NW": (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
            "N_E_S": no_N && no_E && no_S,
            "N_E_W": no_N && no_E && no_W,
            "N_E_SW": no_N && no_E && (no_SW && !no_S && !no_W),
            "N_S_W": no_N && no_S && no_W,
            "N_W_SE": no_N && no_W && (no_SE && !no_S && !no_E),
            "N_SE_SW": no_N && (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W),
            "E_S_W": no_E && no_S && no_W,
            "E_S_NW": no_E && no_S && (no_NW && !no_N && !no_W),
            "E_SW_NW": no_E && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
            "S_W_NE": no_S && no_W && (no_NE && !no_N && !no_E),
            "S_NE_NW": no_S && (no_NE && !no_N && !no_E) && (no_NW && !no_N && !no_W),
            "W_NE_SE": no_W && (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E),
            "NE_SW_NW": (no_NE && !no_N && !no_E) && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
            "NE_SE_SW": (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W),
            "NE_SE_NW": (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E) && (no_NW && !no_N && !no_W),
            "SE_SW_NW": (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
            "N_E": no_N && no_E,
            "N_S": no_N && no_S,
            "N_W": no_N && no_W,
            "N_SE": no_N && (no_SE && !no_S && !no_E),
            "N_SW": no_N && (no_SW && !no_S && !no_W),
            "E_S": no_E && no_S,
            "E_W": no_E && no_W,
            "E_SW": no_E && (no_SW && !no_S && !no_W),
            "E_NW": no_E && (no_NW && !no_N && !no_W),
            "S_W": no_S && no_W,
            "S_NE": no_S && (no_NE && !no_N && !no_E),
            "S_NW": no_S && (no_NW && !no_N && !no_W),
            "W_NE": no_W && (no_NE && !no_N && !no_E),
            "W_SE": no_W && (no_SE && !no_S && !no_E),
            "NE_SE": (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E),
            "NE_SW": (no_NE && !no_N && !no_E) && (no_SW && !no_S && !no_W),
            "NE_NW": (no_NE && !no_N && !no_E) && (no_NW && !no_N && !no_W),
            "SE_SW": (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W),
            "SE_NW": (no_SE && !no_S && !no_E) && (no_NW && !no_N && !no_W),
            "SW_NW": (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
            "NE": (no_NE && !no_N && !no_E),
            "SE": (no_SE && !no_S && !no_E),
            "SW": (no_SW && !no_S && !no_W),
            "NW": (no_NW && !no_N && !no_W),
            "N": no_N,
            "E": no_E,
            "S": no_S,
            "W": no_W,
            "SOLID": Math.random() > 0.62,
            "SOLID_ALT": Math.random() > 0.62,
            "SOLID_ALT2": Math.random() > 0.62,
            "SOLID_ALT3": true,
        };
        let idx = 0;
        const typeMapKeys = Object.keys(typeMap);
        for(const k of typeMapKeys){
            if(typeMap[k]) {
                break;
            }
            idx++;
        }
        const ret = type + (columnCount * idx);
        // //console.log('_x, _y, ret === ',_x, _y, ret);
        // if(_x === 9 && _y === 8){
        //     debugger;
        // }
        return ret;
    }
}
function testingTileTypes() {
    // const a = [
        //     "N_E_S_W",
        //     "NE_SE_SW_NW",
        //     "N_E_S",
        //     "N_E_W",
        //     "N_E_SW",
        //     "N_S_W",
        //     "N_W_SE",
        //     "N_SE_SW",
        //     "E_S_W",
        //     "E_S_NW",
        //     "E_SW_NW",
        //     "S_W_NE",
        //     "S_NE_NW",
        //     "W_NE_SE",
        //     "NE_SW_NW",
        //     "NE_SE_SW",
        //     "NE_SE_NW",
        //     "SE_SW_NW",
        //     "N_E",
        //     "N_S",
        //     "N_W",
        //     "N_SE",
        //     "N_SW",
        //     "E_S",
        //     "E_W",
        //     "E_SW",
        //     "E_NW",
        //     "S_W",
        //     "S_NE",
        //     "S_NW",
        //     "W_NE",
        //     "W_SE",
        //     "NE_SE",
        //     "NE_SW",
        //     "NE_NW",
        //     "SE_SW",
        //     "SE_NW",
        //     "SW_NW",
        //     "NE",
        //     "SE",
        //     "SW",
        //     "NW",
        //     "N",
        //     "E",
        //     "S",
        //     "W",
        // ];

        var b = ['{'];
        var c = {};
        a.forEach(n=>{
            const arr = n.split("_");
            if(c[n]){
                console.error(n + "already exists");
            }
            c[n] = 1;
            b.push(`"${n}": ${
                arr.map(str=>{
                    if(str.length === 2) { // NE, SE, SW, NW
                        const [_a, _b] = str.split("");
                        return `(no_${str} && !no_${_a} && !no_${_b})`;
                    } else {
                        return `no_${str}`;
                    }
                }).join(" && ")
            },`);
        });
        b.push('}');
        //console.log(b.join("\n"));

        function calcNeighbors() {
            const [_n, _e, _s, _w, _ne, _se, _sw, _nw] = [...Array(8)].map(() => [0, 1]);
            let count = 0;
    
            _n.forEach(n => {
                _e.forEach(e => {
                    _s.forEach(s => {
                        _w.forEach(w => {
                            _ne.forEach(ne => {
                                _se.forEach(se => {
                                    _sw.forEach(sw => {
                                        _nw.forEach(nw => {
                                            if (n && e) count++;
                                        })
                                    })
                                })
                            })
                            _se.forEach(se => {
                                _sw.forEach(sw => {
                                    _nw.forEach(nw => {
                                        if (s && e) count++;
                                    })
                                })
                            })
                            _sw.forEach(sw => {
                                _nw.forEach(nw => {
                                    if (s && w) count++;
                                })
                            })
                            _nw.forEach(nw => {
                                if (n && w) count++;
                            })
                        })
                    })
                })
            })
            //console.log('count === ', count);
        }
}
function fragmentsToTilesetCanvas(tileSize, fragmentsImage) {

    const xo = tileSize;

    const fragMap = {
        "N_E_S_W": [],
        "NE_SE_SW_NW": [],
        "N_E_S": [],
        "N_E_W": [], // no_N && no_E && no_W,
        "N_E_SW": [], // no_N && no_E && (no_SW && !no_S && !no_W),
        "N_S_W": [], // no_N && no_S && no_W,
        "N_W_SE": [], // no_N && no_W && (no_SE && !no_S && !no_E),
        "N_SE_SW": [], // no_N && (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W),
        "E_S_W": [], // no_E && no_S && no_W,
        "E_S_NW": [], // no_E && no_S && (no_NW && !no_N && !no_W),
        "E_SW_NW": [], // no_E && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
        "S_W_NE": [], // no_S && no_W && (no_NE && !no_N && !no_E),
        "S_NE_NW": [], // no_S && (no_NE && !no_N && !no_E) && (no_NW && !no_N && !no_W),
        "W_NE_SE": [], // no_W && (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E),
        "NE_SW_NW": [], // (no_NE && !no_N && !no_E) && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
        "NE_SE_SW": [], // (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W),
        "NE_SE_NW": [], // (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E) && (no_NW && !no_N && !no_W),
        "SE_SW_NW": [], // (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
        "N_E": [], // no_N && no_E,
        "N_S": [], // no_N && no_S,
        "N_W": [], // no_N && no_W,
        "N_SE": [], // no_N && (no_SE && !no_S && !no_E),
        "N_SW": [], // no_N && (no_SW && !no_S && !no_W),
        "E_S": [], // no_E && no_S,
        "E_W": [], // no_E && no_W,
        "E_SW": [], // no_E && (no_SW && !no_S && !no_W),
        "E_NW": [], // no_E && (no_NW && !no_N && !no_W),
        "S_W": [], // no_S && no_W,
        "S_NE": [], // no_S && (no_NE && !no_N && !no_E),
        "S_NW": [], // no_S && (no_NW && !no_N && !no_W),
        "W_NE": [], // no_W && (no_NE && !no_N && !no_E),
        "W_SE": [], // no_W && (no_SE && !no_S && !no_E),
        "NE_SE": [], // (no_NE && !no_N && !no_E) && (no_SE && !no_S && !no_E),
        "NE_SW": [], // (no_NE && !no_N && !no_E) && (no_SW && !no_S && !no_W),
        "NE_NW": [], // (no_NE && !no_N && !no_E) && (no_NW && !no_N && !no_W),
        "SE_SW": [], // (no_SE && !no_S && !no_E) && (no_SW && !no_S && !no_W),
        "SE_NW": [], // (no_SE && !no_S && !no_E) && (no_NW && !no_N && !no_W),
        "SW_NW": [], // (no_SW && !no_S && !no_W) && (no_NW && !no_N && !no_W),
        "NE": [], // (no_NE && !no_N && !no_E),
        "SE": [], // (no_SE && !no_S && !no_E),
        "SW": [], // (no_SW && !no_S && !no_W),
        "NW": [], // (no_NW && !no_N && !no_W),
        "N": [], // no_N,
        "E": [], // no_E,
        "S": [], // no_S,
        "W": [], // no_W,
        "SOLID": [], // Math.random() > 0.62,
        "SOLID_ALT": [], // Math.random() > 0.62,
        "SOLID_ALT2": [], // Math.random() > 0.62,
        "SOLID_ALT3": [], // true,
    };

    const canvas2 = document.createElement('canvas');
    const ctx = canvas2.getContext("2d");
    const w2 = canvas2.width = fragmentsImage.width;
    const h2 = canvas2.height = fragmentsImage.height;

    ctx.drawImage(fragmentsImage, 0, 0);

    const canvas = document.createElement('canvas');
    canvas.width = fragmentsImage.width + tileSize;
    canvas.height = Object.keys(fragMap).length * tileSize;
    const _ctx = canvas.getContext('2d');

    const fragW = tileSize/2;
    const fragH = tileSize/2;

    _fragments_to_tilemap();

    return canvas;

    function _fragments_to_tilemap() {

        const fragData = [];

        [...Array(canvas.width / fragW)].forEach((_, i2) => {
            fragData.push([]);
            [...Array(canvas.height / fragH)].forEach((_, i) => {
                const _y = i * fragH;
                const _x = i2 * fragW;
                const imageData = ctx.getImageData(_x, _y, fragW, fragH);
                fragData[i2].push(imageData);
            })
        })

        const sideMap = {
            "N": [1, 0],
            "E": [1, 4],
            "S": [0, 4],
            "W": [0, 0],
            "NE": [1, 1],
            "SE": [1, 6],
            "SW": [0, 6],
            "NW": [0, 1]
        };
        [...Array(4)].forEach((_, _i) => {
            Object.keys(fragMap).forEach(k => {
                const sides = k.split("_");
                let ne_set = false;
                let se_set = false;
                let sw_set = false;
                let nw_set = false;
                const arr = [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0]
                ];

                const _n = sides.indexOf("N") === -1;
                const _e = sides.indexOf("E") === -1;
                const _s = sides.indexOf("S") === -1;
                const _w = sides.indexOf("W") === -1;
                const _ne = sides.indexOf("NE") === -1;
                const _se = sides.indexOf("SE") === -1;
                const _sw = sides.indexOf("SW") === -1;
                const _nw = sides.indexOf("NW") === -1;

                const _0 = 0 + (2 * _i);
                const _1 = 1 + (2 * _i);

                // set north east fragment
                if(!_n && !_e)arr[0] = [_1, 0];
                else if(!_n && _e)arr[0] = [_1, 2];
                else if(_n && !_e)arr[0] = [_1, 3];
                else if(_n && _e && _ne)arr[0] = [_1, 8];
                else if(_n && _e)arr[0] = [_1, 1];

                // set south east fragment
                if(!_s && !_e)arr[1] = [_1, 4];
                else if(!_s && _e)arr[1] = [_1, 7];
                else if(_s && !_e)arr[1] = [_1, 5];
                else if(_s && _e && _se)arr[1] = [_1, 9];
                else if(_s && _e)arr[1] = [_1, 6];

                // set south west fragment
                if(!_s && !_w)arr[2] = [_0, 4];
                else if(!_s && _w)arr[2] = [_0, 7];
                else if(_s && !_w)arr[2] = [_0, 5];
                else if(_s && _w && _sw)arr[2] = [_0, 9];
                else if(_s && _w)arr[2] = [_0, 6];

                // set north west fragment
                if(!_n && !_w)arr[3] = [_0, 0];
                else if(!_n && _w)arr[3] = [_0, 2];
                else if(_n && !_w)arr[3] = [_0, 3];
                else if(_n && _w && _nw)arr[3] = [_0, 8];
                else if(_n && _w)arr[3] = [_0, 1];

                fragMap[k] = arr;
            });

            const col = 0;

            Object.keys(fragMap).forEach((k, i) => {
                const y = (i * (fragH * 2));
                const x = (col * (fragW * 2)) + (_i * (fragW * 2)) + xo;
                _ctx.putImageData(fragData[fragMap[k][0][0]][fragMap[k][0][1]], x + fragW, y);
                _ctx.putImageData(fragData[fragMap[k][1][0]][fragMap[k][1][1]], x + fragW, y + fragH);
                _ctx.putImageData(fragData[fragMap[k][2][0]][fragMap[k][2][1]], x, y + fragH);
                _ctx.putImageData(fragData[fragMap[k][3][0]][fragMap[k][3][1]], x, y);
            });
        });
    }
}

function mapImageData(mapImage, colorMap) {

    const analysis = analyzeImageData(mapImage);
    //console.log('analysis === ',analysis);
    
    //console.log('tileset === ',tileset);
    const w = tilemap[0].length * tileSize;
    const h = tilemap.length * tileSize;
    //console.log('w === ',w);
    //console.log('h === ',h);
    const grid = getLinearImageDataGrid(tileset, tileSize, tileSize);
    //console.log('grid === ',grid);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    //console.log('tilemap === ',tilemap);
    tilemap.forEach((n,y) => {
        n.forEach((v,x) => {
            const _x = x * tileSize;
            const _y = y * tileSize;
            ctx.putImageData(grid[v], _x, _y);
        })
    })
    return canvas;
}

function tilemapToCanvas(tilemap, tileset, tileSize) {
    //console.log('tileset === ',tileset);
    const w = tilemap[0].length * tileSize;
    const h = tilemap.length * tileSize;
    //console.log('w === ',w);
    //console.log('h === ',h);
    const grid = getLinearImageDataGrid(tileset, tileSize, tileSize);
    //console.log('grid === ',grid);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    //console.log('tilemap === ',tilemap);
    tilemap.forEach((n,y) => {
        n.forEach((v,x) => {
            const _x = x * tileSize;
            const _y = y * tileSize;
            ctx.putImageData(grid[v], _x, _y);
        })
    })
    return canvas;
}
function tilemapToDebugCanvas(tilemap, tileset, tileSize) {
    //console.log('tileset === ',tileset);
    const w = tilemap[0].length * tileSize;
    const h = tilemap.length * tileSize;
    //console.log('w === ',w);
    //console.log('h === ',h);
    const grid = getLinearImageDataGrid(tileset, tileSize, tileSize);
    //console.log('grid === ',grid);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    tilemap.forEach((n,y) => {
        n.forEach((v,x) => {
            const _x = x * tileSize;
            const _y = y * tileSize;
            ctx.fillText(""+v, _x, _y);
            // ctx.putImageData(grid[v], _x, _y);
        })
    })
    return canvas;
}
function splitIntoColumns(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const locs = [];
    for (let x = 0; x < w; x++) {
        let visibleCount = 0;
        for (let y = 0; y < h; y++) {
            const i = (x + y * w) * 4;
            const a = imageData.data[i+3];
            if(a > 0){
                visibleCount++;
            }
        }
        if(visibleCount === 0){
            locs.push(x);
        }
    }
    return locs;
}

function imageDataBrightnessMap(imageData, maxZ, mode) {
    const grid = [];
    const brightMap = {};
    const analysis = analyzeImageData(imageData);
    let maxBrightness = -Infinity;
    //console.log('analysis.grid === ',analysis.grid);
    analysis.grid.forEach((row,y)=>{
        grid.push(Array(imageData.width).fill(1));
        return row.forEach((v,x)=>{
            const colorIdx = v;
            if(typeof brightMap[colorIdx] === "undefined"){
                brightMap[colorIdx] = analysis.colors[colorIdx] === "transparent" ? 0 : brightness(analysis.colors[colorIdx]);
            }
            if(maxBrightness < brightMap[colorIdx]) {
                maxBrightness = brightMap[colorIdx];
            }
        });
    });
    //console.log('brightMap === ',brightMap);
    analysis.grid.forEach((row,y)=>{
        return row.forEach((colorIdx,x)=>{
            grid[y][x] = Math.floor(brightMap[colorIdx] / maxBrightness * maxZ);
        });
    });
    return grid;

    function brightness(rgbStr) {
        const [r,g,b] = rgbStr.split("(")[1].split(")")[0].split(",").map(n=>Number(n.trim()));
        if(mode === "all"){
            return r + g + b;
        } else if (mode === "r") {
            return r;
        } else if (mode === "g") {
            return g;
        } else if (mode === "b") {
            return b;
        }
    }
}

function addDataToImageData(imageData, str, charSize = 8, charSizeSize = 8, lenSizeSize = 64) {
    let binStr = str2bin(charSize, charSizeSize);
    binStr += str2bin(str.length, lenSizeSize);
    binStr += str2bin(str, charSize);
    binStr.split("").forEach((n,i)=>{
        if(n==="1"){
            if(!(imageData.data[i]%2)){
                imageData.data[i] += imageData.data[i] === 0 ? 1 : -1;
            }
        } else {
            if((imageData.data[i]%2)){
                imageData.data[i] += imageData.data[i] === 0 ? 1 : -1;
            }
        }
    });
    return imageData;
}
function getDataFromImageData(imageData, charSizeSize = 8, lenSizeSize = 62) {
    const fullBinStr = imageData.data.map(n=>!(n%2) ? "1" : "0").join("");
    const slicedBinStr = fullBinStr.slice(charSizeSize + lenSizeSize);
    const charBinStr = fullBinStr.slice(0, charSizeSize);
    const lenBinStr = fullBinStr.slice(charSizeSize, lenSizeSize);
    console.log('lenBinStr === ',lenBinStr);
    const charSize = str2bin(charBinStr, charBinStr.length);
    const lenSize = str2bin(lenBinStr, lenBinStr.length);
    console.log('lenSize === ',lenSize);
    return imageData;
}
function testDataStoreThing(str = `{"test":"foobar lol whatever"}`){
    const canvas = document.createElement('canvas');
    const w = canvas.width = 122;
    const h = canvas.height = 122;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(10,10,20,20);
    const imageData = ctx.getImageData(0,0,w,h);
    addDataToImageData(imageData, str);
    document.body.appendChild(canvas);
    canvas.onclick = () => {
        const _ctx = canvas.getContext("2d");
        const _imgData = _ctx.getImageData(0,0,canvas.width,canvas.height);
        getDataFromImageData(_imgData);
    }
}
function findEdges(imageData) {

}
function str2bin(str, size = 8){
    return (""+str).split('').map(function (char) {
        return char.charCodeAt(0).toString(2).padStart(size,"0");
    }).join("");
}
function bin2str(binStr, size = 8) {
    const regex = new RegExp(`.{1,${size}}`,"g");
    //return binStr.match(regex);
    return binStr.match(regex).map(str=>String.fromCharCode(parseInt(str,2))).join("");
}
function tweenColors(color1, color2, steps, step, ease = n=>n) {
    const rgb1 = color2rgb(color1);
    const rgb2 = color2rgb(color2);
    const rawRatio = step/steps;
    const easedRatio = ease(rawRatio);
    const rDiff = rgb2.r - rgb1.r;
    const gDiff = rgb2.g - rgb1.g;
    const bDiff = rgb2.b - rgb1.b;
    return {
        r: rgb1.r + (rDiff * easedRatio),
        g: rgb1.g + (gDiff * easedRatio),
        b: rgb1.b + (bDiff * easedRatio)
    };
}