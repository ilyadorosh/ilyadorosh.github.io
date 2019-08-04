(function(){
    var canvas = document.getElementById('hexmap');
    var hexHeight,
        hexRadius,
        hexRectangleHeight,
        hexRectangleWidth,
        hexagonAngle = 0.523598776, // 30 degrees in radians
        sideLength = 20,
        boardWidth = 10,
        boardHeight = 40;

        var patt=[];
        patt.push({i:2, j:5});
        patt.push({i:4, j:0});

        var begin = OffsetCoord(7,5),
            lin=[];

    hexHeight = Math.sin(hexagonAngle) * sideLength;
    hexRadius = Math.cos(hexagonAngle) * sideLength;
    hexRectangleHeight = sideLength + 2 * hexHeight;
    hexRectangleWidth = 2 * hexRadius;

    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#ffa0ff";
        ctx.strokeStyle = "#ffCCCC";
        ctx.lineWidth = 4;
        drawBoard(ctx, boardWidth, boardHeight);

        canvas.addEventListener("mousemove", function(eventInfo) {
            var x,
                y,
                hexX,
                hexY,
                screenX,
                screenY,
                rect;
            rect = canvas.getBoundingClientRect();
            x = eventInfo.clientX - rect.left;
            y = eventInfo.clientY - rect.top;
            hexY = Math.floor(y / (hexHeight + sideLength));
            hexX = Math.floor((x - (hexY % 2) * hexRadius) / hexRectangleWidth);
            var end= OffsetCoord(hexX, hexY),
                beginc = roffset_to_cube(-1,begin);
                endc = roffset_to_cube(-1,end),
                lin = hex_linedraw(beginc, endc);
            screenX = hexX * hexRectangleWidth + ((hexY % 2) * hexRadius);
            screenY = hexY * (hexHeight + sideLength);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard(ctx, boardWidth, boardHeight);
            // Check if the mouse's coords are on the board
            if(hexX >= 0 && hexX < boardWidth) {
                if(hexY >= 0 && hexY < boardHeight) {
                    ctx.fillStyle = "#00fa00";
                    drawHexagon(ctx, screenX, screenY, true);
                }
            }
        });

    }
    
    function Point(x, y) {
        return {x: x, y: y};
    }

    function Hex(q, r, s) {
        if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0";
        return {q: q, r: r, s: s};
    }

    function hex_add(a, b)
    {
        return Hex(a.q + b.q, a.r + b.r, a.s + b.s);
    }

    function hex_subtract(a, b)
    {
        return Hex(a.q - b.q, a.r - b.r, a.s - b.s);
    }

    function hex_length(hex)
    {
        return (Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2;
    }

    function hex_distance(a, b)
    {
        return hex_length(hex_subtract(a, b));
    }

    function hex_round(h)
    {
        var qi = Math.round(h.q);
        var ri = Math.round(h.r);
        var si = Math.round(h.s);
        var q_diff = Math.abs(qi - h.q);
        var r_diff = Math.abs(ri - h.r);
        var s_diff = Math.abs(si - h.s);
        if (q_diff > r_diff && q_diff > s_diff)
        {
            qi = -ri - si;
        }
        else
            if (r_diff > s_diff)
            {
                ri = -qi - si;
            }
            else
            {
                si = -qi - ri;
            }
        return Hex(qi, ri, si);
    }

    function hex_lerp(a, b, t)
    {
        return Hex(a.q * (1.0 - t) + b.q * t, a.r * (1.0 - t) + b.r * t, a.s * (1.0 - t) + b.s * t);
    }

    function hex_linedraw(a, b)
    {
        var N = hex_distance(a, b);
        var a_nudge = Hex(a.q + 0.000001, a.r + 0.000001, a.s - 0.000002);
        var b_nudge = Hex(b.q + 0.000001, b.r + 0.000001, b.s - 0.000002);
        var results = [];
        var step = 1.0 / Math.max(N, 1);
        for (var i = 0; i <= N; i++)
        {
            results.push(hex_round(hex_lerp(a_nudge, b_nudge, step * i)));
        }
        return results;
    }



    function OffsetCoord(col, row) {
        return {col: col, row: row};
    }

    var EVEN = 1;
    var ODD = -1;

    function roffset_from_cube(offset, h)
    {
        var col = h.q + (h.r + offset * (h.r & 1)) / 2;
        var row = h.r;
        return OffsetCoord(col, row);
    }

    function roffset_to_cube(offset, h) {
        var q = h.col - (h.row + offset * (h.row & 1)) / 2;
        var r = h.row;
        var s = -q - r;
        return Hex(q, r, s);
    }

    function drawBoard(canvasContext, width, height) {
        var i,
            j;
        for(i = 0; i < width; ++i) {
            for(j = 0; j < height; ++j) {
                drawHexagon(
                    ctx, 
                    i * hexRectangleWidth + ((j % 2) * hexRadius),
                    j * (sideLength + hexHeight), 
                    false
                );
                var cubeobj = roffset_to_cube(-1,OffsetCoord(i,j));
                canvasContext.fillText('i='+i+' j='+j+
                        'q='+cubeobj.q+
                        's='+cubeobj.s, 
                    i * hexRectangleWidth + ((j % 2) * hexRadius), 
                    j * (sideLength + hexHeight)+20
                );
            }
        }
       lin.forEach(function(pointc) {
                point = roffset_from_cube(-1, pointc);
                drawHexagon(
                    ctx, 
                    point.col * hexRectangleWidth + ((point.row % 2) * hexRadius), 
                    point.row * (sideLength + hexHeight), 
                    true
                );
        });

        ctx.fillText('lin'+lin.length, 10, 40);
    }

    function drawHexagon(canvasContext, x, y, fill) { 
        var fill = fill || false;
        canvasContext.beginPath();
        canvasContext.moveTo(x + hexRadius, y);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight + sideLength);
        canvasContext.lineTo(x + hexRadius, y + hexRectangleHeight);
        canvasContext.lineTo(x, y + sideLength + hexHeight);
        canvasContext.lineTo(x, y + hexHeight);
        canvasContext.closePath();
        if(fill) {
        ctx.fillStyle = "#ffa0ff";
        } else {
        ctx.fillStyle = "#9090d0";
           // canvasContext.stroke();
        }
        canvasContext.fill();

        ctx.fillStyle = "#ffa000";
        ctx.fillText('x='+x.toFixed(2)+' y='+y.toFixed(2), x, 30+y);
    }
})();
