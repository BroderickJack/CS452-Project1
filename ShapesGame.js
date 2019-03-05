/*
Alison Davis and Jack Broderick

shapes: A vector of shapes that are currently being displayed
shapeFunctions: Functions that returns a new shape object
slot_translations: The translations that need to be applied to center the shapes at each of the slots

*/
var nvert;
var shapes = [];
var shapeTypes = [];
var shapeFunctions = [];
var slot_translations = [];
var gl;
var score;
var shaderProgram;
var shaderProgramDiamond;
var shaderProgramCircle;
var target_shape_translation;
var target_shape;
var target_box;
var target_box_color = vec4(.0, .0, .0, 1.0)
var canvas;
var translationUniform;
var translationXUniform;
var translationYUniform;
var fColorUniform;
//var targetColorUniform;
var X_SCALE = 2;
var Y_SCALE = 1;
var CANVAS_X = 512.0 * X_SCALE;
var CANVAS_Y = 512.0 * Y_SCALE;

var WINNING_SCORE = 1000;
var LOSING_SCORE = -500;

var NUM_SLOTS = 6; // The number of slots (number of shapes that are being shown)

var APPEAR = 0.01; // The chance of a new shape appearing in an empty slot

var MS_FRAME = 15; // [ms/frame]
var MIN_TIME = 1; // [sec] The minimum amount of time to have a shape show
var MAX_TIME = 5; // [sec] the maximum amount of time to have a shape show
var MAX_FRAMES = MAX_TIME * 1000 / MS_FRAME;
var MIN_FRAMES = MIN_TIME * 1000 / MS_FRAME;
var x;
var z = 0;

var COLORS = [vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0)];

function init()
{
    // Set up the canvas
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert( "WebGL is not available" ); }



    /* ---------- Initialization ---------- */
    score = 0
    document.getElementById("score").innerHTML = "Score: " + score;

    var i = 0;
    for(i = 0; i < NUM_SLOTS; i++ ) {
        shapes[i] = null;
    }

    /* Intialize the translations needed for each slot */
    slot_translations = [ vec2(-1.0/3, 0.5), vec2(0.75/3, 0.5), vec2(2.5/3, 0.5), vec2(-1.0/3, -0.5), vec2(0.75/3, -0.5), vec2(2.5/3, -0.5) ];
    target_shape_translation = vec2(-2.5/3, 0.0);

    /* Setup WebGL */
    // Set up the viewport
    gl.viewport( 0, 0, 1024, 512 );   // x, y, width, height

    // Set up the background color
    gl.clearColor( 0.647, 0.0, 1.0, 1.0 );

    // Force the WebGL context to clear the color buffer
    gl.clear( gl.COLOR_BUFFER_BIT );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    //console.log("Bound the buffera");

    shaderProgram = initShaders( gl,"vertex-shader", "fragment-shader" );
    gl.useProgram( shaderProgram );
    // addTriangle()

    /* Get the uniform for the color */
    fColorUniform = gl.getUniformLocation(shaderProgram, "fColor");
    gl.uniform4fv(fColorUniform, COLORS[0]);

    var myPositionAttribute = gl.getAttribLocation( shaderProgram, "myPosition"); //telling theis function to get variable "myPosition" from shaderProgram, getAttribLocation to js to get handle to myPosition variable in the shader
    gl.vertexAttribPointer( myPositionAttribute, 2, gl.FLOAT, false, 0, 0 ); // (variable, stepping in sets of 2,  )
    gl.enableVertexAttribArray( myPositionAttribute );

    /* Add all of the functions that generate shape objects to the array */
    shapeFunctions.push(getTriangle);
    shapeFunctions.push(getDiamond);
    shapeFunctions.push(getEllipse);
    shapeFunctions.push(getPentagon);
    shapeFunctions.push(getHexagon);
    shapeFunctions.push(getCircle);

    setUpTargetBox();

    setInterval(renderShapes, 15);
}

function vertexScaler(vertexPoints, scaleFactor)
{
    var i;
    var newPoint;
    newPoints = [];
    for( i = 0; i < vertexPoints.length; i++) {
        pointBefore = vertexPoints[i];
        // console.log("Old: " + p);
        pointAfter = pointBefore / scaleFactor;
        // console.log("New: " + pointAfter);
        newPoints[i] = pointAfter;
    }
    return newPoints;
}

function scalePoints(points) {
    // This function scales the shapes based on the canvas size so that they keep the correct proportions
    var i;
    var newPoint;
    newPoints = [];
    for( i = 0; i < points.length; i++) {
        p = points[i];
//        console.log("Old: " + p);
        x1 = p[0];
        y1 = p[1];

        // Apply the inverse of the scaling factor
        y2 = y1 / Y_SCALE;
        x2 = x1 / X_SCALE;

        newPoint = vec2(x2, y2);
        // console.log("New: " + newPoint);
        newPoints[i] = newPoint;
    }

    // Return the new points
    return newPoints;

}

function setUpTargetBox() {
    x = 0.25;
    var p0 = vec2 ( -x-.05, -x-.05 );
    var p1 = vec2 ( -x-.05, x +.05);
    var p2 = vec2( x+.05, x+.05 );
    var p3 = vec2( x+.05, -x-.05);
    var arrayOfPoints = [p0, p1, p2, p3];
    arrayOfPoints = scalePoints(arrayOfPoints);

    nvert = 4;

    vertx = [ -x-.05, -x-.05, x+.05, x+.05];
    vertx = vertexScaler(vertx, X_SCALE);
    //console.log("Vert x add triangle: " + vertx);
    verty = [-x-.05, x +.05, -x-.05, x +.05];
    verty = vertexScaler(verty, Y_SCALE);

    //console.log("Vert y add triangle: " + verty);

    // Create a shape object
    target_box = {
    vertx: vertx,
    verty: verty,
    arrayOfPoints: arrayOfPoints,
    nvert: 4,
    frameCount: 0,
    };

    var i = 0;
    for(i = 0; i < target_box.nvert; i++) {
        /* Update vertx */
        target_box.vertx[i] += target_shape_translation[0];
        target_box.verty[i] += target_shape_translation[1];

        /* update the vertices to draw it */
        target_box.arrayOfPoints[i][0] += target_shape_translation[0];
        target_box.arrayOfPoints[i][1] += target_shape_translation[1];
    }
    target_box.color = target_box_color;
    //return target_box;
}

function addDiamond() {
    x = .25;
    var p0 = vec2 ( x, .0 );
    var p1 = vec2 ( .0, -x );
    var p2 = vec2( -x, .0 );
    var p3 = vec2( .0, x)

    var arrayOfPoints = [p0, p1, p2, p3];
    arrayOfPoints = scalePoints(arrayOfPoints);
    nvert = 4;
    vertx = [ x, .0, -x, .0];
    vertx = vertexScaler(vertx, X_SCALE);
    verty = [.0, -x, .0, x];
    verty = vertexScaler(verty, Y_SCALE);

    diamond = {
    vertx: vertx,
    verty: verty,
    arrayOfPoints: arrayOfPoints,
    nvert: 4,
    frameCount: 0,
    };
    shapeTypes.push(diamond);
    // shapes.push(diamond);

}

function getDiamond() {
    x = .25;
    var p0 = vec2 ( x, .0 );
    var p1 = vec2 ( .0, -x );
    var p2 = vec2( -x, .0 );
    var p3 = vec2( .0, x)

    var arrayOfPoints = [p0, p1, p2, p3];
    arrayOfPoints = scalePoints(arrayOfPoints);
    nvert = 4;
    vertx = [ x, .0, -x, .0];
    vertx = vertexScaler(vertx, X_SCALE);
    verty = [.0, -x, .0, x];
    verty = vertexScaler(verty, Y_SCALE);

    diamond = {
    vertx: vertx,
    verty: verty,
    arrayOfPoints: arrayOfPoints,
    nvert: 4,
    frameCount: 0,
    };
    // shapeTypes.push(diamond);
    // shapes.push(diamond);
    return diamond;
}

function getEllipse() {
    var ex;
    var ey;
    //x = .25;
    var n = 102;
    var xStep = (2 * Math.PI)/n;
    var theta = 0;
    var a = 0;
    var b = 0;
    var c = x/2;
    var d = x;
    var ellipsePoints = [];
    var vertXVec = [];
    var vertYVec = [];


    for(i = 0; i < n; i++)
    {
        xe = c * (Math.cos(theta)) + a;
        ye = d * (Math.sin(theta)) + b;
        var p = vec4(xe, ye, .0, 1.0);
        vertXVec.push(xe);
        vertYVec.push(ye);
        ellipsePoints.push( p );
        theta = theta + xStep;
    }
    ellipsePoints = scalePoints(ellipsePoints);

    nvert = n;
    vertXVec = vertexScaler(vertXVec, X_SCALE);
    //console.log("Vert x add circle: " + vertXVec);
    vertYVec = vertexScaler(vertYVec, Y_SCALE);
    //console.log("Vert y add circle: " + vertYVec);

    // Create a shape object
    ellipse = {
    vertx: vertXVec,
    verty: vertYVec,
    arrayOfPoints: ellipsePoints,
    nvert: n,
    frameCount: 0,
    };

    return ellipse;
}

function getPentagon()
{
    //x = .25
    var p0 = vec2 ( -x, x/3 );
    var p1 = vec2 ( .0, x );
    var p2 = vec2( x, x/3 );
    var p3 = vec2( x, -x );
    var p4 = vec2( -x,-x );


    var arrayOfPoints = [p0, p1, p2, p3, p4];
    arrayOfPoints = scalePoints(arrayOfPoints);

    nvert = 5;
    vertx = [ -x, .0, x,x,-x];
    vertx = vertexScaler(vertx, X_SCALE);
    //console.log("Vert x add triangle: " + vertx);
    verty = [x/3,x,x/3,-x,-x];
    verty = vertexScaler(verty, Y_SCALE);
    //console.log("Vert y add triangle: " + verty);

    // Create a shape object
    pentagon = {
    vertx: vertx,
    verty: verty,
    arrayOfPoints: arrayOfPoints,
    nvert: 5,
    frameCount: 0,
    };

    return pentagon;
}

function getHexagon()
{
    //x = .25
    var p0 = vec2 ( -x/3, x );
    var p1 = vec2 ( x/3, x );
    var p2 = vec2( x, x/3 );
    var p3 = vec2( x, -x/3 );
    var p4 = vec2( x/3,-x );
    var p5 = vec2( -x/3,-x );
    var p6 = vec2( -x,-x/3 );
    var p7 = vec2( -x,x/3 );


    var arrayOfPoints = [p0, p1, p2, p3, p4, p5, p6, p7];
    arrayOfPoints = scalePoints(arrayOfPoints);

    nvert = 8;
    vertx = [ -x/3, x/3, x, x, x, -x, -x, -x];
    vertx = vertexScaler(vertx, X_SCALE);
    //console.log("Vert x add triangle: " + vertx);
    verty = [x,x,x/3,-x/3,-x,-x,-x/3,x/3];
    verty = vertexScaler(verty, Y_SCALE);
    //console.log("Vert y add triangle: " + verty);

    // Create a shape object
    hexagon = {
    vertx: vertx,
    verty: verty,
    arrayOfPoints: arrayOfPoints,
    nvert: 8,
    frameCount: 0,
    };

    return hexagon;
}

function getCircle()
{

    //x = .25;
    var r = x;
    var n = 100;
    var xStep = (2 * Math.PI)/n;
    var theta = 0;
    var a = 0;
    var b = 0;
    var circlePoints = [];
    var vertXVec = [];
    var vertYVec = [];


    for(i = 0; i < n; i++)
    {
        xc = a + (r * Math.cos(theta));
        yc = b + (r * Math.sin(theta));
        var p = vec4(xc, yc, .0, 1.0);
        vertXVec.push(xc);
        vertYVec.push(yc);
        circlePoints.push( p );
        theta = theta + xStep;
    }
    circlePoints = scalePoints(circlePoints);

    nvert = n;
    vertXVec = vertexScaler(vertXVec, X_SCALE);
    //console.log("Vert x add circle: " + vertXVec);
    vertYVec = vertexScaler(vertYVec, Y_SCALE);
    //console.log("Vert y add circle: " + vertYVec);

    // Create a shape object
    circle = {
    vertx: vertXVec,
    verty: vertYVec,
    arrayOfPoints: circlePoints,
    nvert: n,
    frameCount: 0,
    };

    return circle;
}

function addTriangle() {
    // Enter array set up code here
    x = .25
    var p0 = vec2 ( -x, -x );
    var p1 = vec2 ( -x, x );
    var p2 = vec2( x, -x );
    var arrayOfPoints = [p0, p1, p2];
    arrayOfPoints = scalePoints(arrayOfPoints);

    nvert = 3;
    vertx = [ -x, -x, x];
    vertx = vertexScaler(vertx, X_SCALE);
    //console.log("Vert x add triangle: " + vertx);
    verty = [-x, x, -x];
    verty = vertexScaler(verty, Y_SCALE);
    //console.log("Vert y add triangle: " + verty);

    // Create a shape object
    triangle = {
      vertx: vertx,
      verty: verty,
      arrayOfPoints: arrayOfPoints,
      nvert: 3,
      frameCount: 0,
    };

    shapeTypes.push(triangle);
    // shapes.push(triangle);
}

function getTriangle() {
    // Enter array set up code here
    x = .25
    var p0 = vec2 ( -x, -x );
    var p1 = vec2 ( -x, x );
    var p2 = vec2( x, -x );
    var arrayOfPoints = [p0, p1, p2];
    arrayOfPoints = scalePoints(arrayOfPoints);

    nvert = 3;
    vertx = [ -x, -x, x];
    vertx = vertexScaler(vertx, X_SCALE);
    //console.log("Vert x add triangle: " + vertx);
    verty = [-x, x, -x];
    verty = vertexScaler(verty, Y_SCALE);
    //console.log("Vert y add triangle: " + verty);

    // Create a shape object
    triangle = {
      vertx: vertx,
      verty: verty,
      arrayOfPoints: arrayOfPoints,
      nvert: 3,
      frameCount: 0,
    };

    // shapeTypes.push(triangle);
    // shapes.push(triangle);
    return triangle;
}

function shift_shapes(index, x, y) {
    /* This functions ships the shapes by x and y and the index: index in shapes[] */
    var s = shapes[index];
    var i = 0;

    for(i = 0; i < s.nvert; i++) {
        /* Update vertx */
        s.vertx[i] += x;
        s.verty[i] += y;

        /* update the vertices to draw it */
        s.arrayOfPoints[i][0] += x;
        s.arrayOfPoints[i][1] += y;
    }
}

function generate_target_shape() {
    var shape_index;
    var color_index;
    var type_length = shapeFunctions.length;
    shape_index = Math.round(Math.random() * (type_length-1));
    target_shape = shapeFunctions[shape_index]();
    color_index = Math.round(Math.random() * (COLORS.length -1));
    target_shape.color = COLORS[color_index];

    var i = 0;
    for(i = 0; i < target_shape.nvert; i++) {
        /* Update vertx */
        target_shape.vertx[i] += target_shape_translation[0];
        target_shape.verty[i] += target_shape_translation[1];

        /* update the vertices to draw it */
        target_shape.arrayOfPoints[i][0] += target_shape_translation[0];
        target_shape.arrayOfPoints[i][1] += target_shape_translation[1];
    }

}

function generate_shapes() {
    /* This function is used to randomly add shapes to the array of currently displayed shapes */
    var i = 0;
    var j;
    var shape_index;
    var type_length = shapeFunctions.length;
    var color_index;

    for(i = 0; i < NUM_SLOTS; i++) {
        /* First check to see if there is another shape already there */
        if(shapes[i] == null) {
            /* If it is null then there is not a shape there so we can add a new one */

            /* We will use a random variable to determine if we want a new shape to appear */
            if(Math.random() < APPEAR) {
                shape_index = Math.round(Math.random() * (type_length-1));
                shapes[i] = shapeFunctions[shape_index]();
                shift_shapes(i, slot_translations[i][0], slot_translations[i][1]);
                /* Calculate a max and a minimum time for the shape */
                shapes[i].max_time = Math.round(Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME);

                /* Calculate a random color */
                color_index = Math.round(Math.random() * (COLORS.length - 1));
                shapes[i].color = COLORS[color_index];
            }
        }
    }
}

function renderShapes() {

    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.uniform4fv(fColorUniform, target_box.color);

    gl.bufferData( gl.ARRAY_BUFFER, flatten(target_box.arrayOfPoints), gl.STATIC_DRAW );
    gl.drawArrays( gl.LINE_LOOP, 0, target_box.nvert );
    //console.log(target_box.arrayOfPoints);
    /* Generate new target shape every 4.5 seconds*/
    if (z == 0)
    {
        generate_target_shape();
    }

    z++;
    if (z > 300)
    {
        z = 0;
    }

    //gl.clear( gl.COLOR_BUFFER_BIT);

    //gl.clear( gl.COLOR_BUFFER_BIT);
    gl.uniform4fv(fColorUniform, target_shape.color);

    //console.log(target_shape.color);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(target_shape.arrayOfPoints), gl.STATIC_DRAW );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, target_shape.nvert );

    /* This function renders all of the shapes in shapes[]*/
    /* We must first generate the shapes */
    generate_shapes();

    // This function renders the list of shapes and updates the frame count for each one
    var i = 0;
    var s;
    var j;

    // console.log("Shapes.length: ", shapes.length);
    for( i=0; i < shapes.length; i++) {
        s = shapes[i];

        if(s == null) {
            continue;
        }

        /* Set the color */
        // console.log(s.color);
        gl.uniform4fv(fColorUniform, s.color);

        // console.log(s);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(s.arrayOfPoints), gl.STATIC_DRAW );
        gl.drawArrays( gl.TRIANGLE_FAN, 0, s.nvert ); //0 is another offset and 3 is how many points to d
        //console.log(s.frameCount);
        if(((s.frameCount * MS_FRAME)/1000.0) > s.max_time) {
            // We must remove the element from the list
            // shapes.splice(i, 1);
            shapes[i] = null;
            //console.log(shapes.length);
        }

        s.frameCount++;
        // Check to see how high the frame count is.
    }

}

function checkShape(testx, testy, s) {
    // Check to see if the point clicked is in the shape
    var c = 0;
    var i = 0;
    var color_match = false;
    var shape_match = false;
    var j;
    var nvert = s.nvert;
    var vertx = s.vertx;
    var verty = s.verty;

    //console.log("vertx: " + vertx);
    //console.log("verty: " + verty);

    for (i = 0, j = nvert-1; i < nvert; j = i++) {
        if ( ((verty[i]>testy) != (verty[j]>testy)) &&
            (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) )
            c = !c;
    }

    if(c) {
        // This is if the click is within the shape
        // We need to remove the shape from the list and update the score of the game
        // The score should be the maximum number of frames it could be - the number of frames it took to click

        // Need to update the score

        if(nvert == target_shape.nvert)
        {
            //console.log("shape match!" + nvert + " = " + target_shape.nvert);
            shape_match = true;
        }

        if(s.color == target_shape.color)
        {
            //console.log("color match!");
            //console.log("clicked color: " + s.color + " = " + target_shape.color);
            color_match = true;

        }
        if (shape_match && color_match) //only change the score if the shape and color both match
        {
            var addedPoints = ((s.max_time / MS_FRAME) * 1000) - s.frameCount
            score += addedPoints;
            //console.log("Score updated to: " + score);
            // document.getElementById("score").value = score;
            document.getElementById("score").innerHTML = "Score: " + Math.round(score);
        }
        else if (shape_match)
        {
                var addedPoints = ((s.max_time / MS_FRAME) * 1000) - s.frameCount
                score += addedPoints/2;
                //console.log("Score updated to: " + score);
                // document.getElementById("score").value = score;
                document.getElementById("score").innerHTML = "Score: " + Math.round(score);
        }

        else
        {
            var addedPoints = ((s.max_time / MS_FRAME) * 1000) - s.frameCount
            score -= addedPoints/2;
            document.getElementById("score").innerHTML = "Score: " + Math.round(score);
        }
        /*
         //can add points for color, seems a bit much
        else if (color_match)
        {
            var addedPoints = ((s.max_time / MS_FRAME) * 1000) - s.frameCount
            score += addedPoints/4;
            //console.log("Score updated to: " + score);
            // document.getElementById("score").value = score;
            document.getElementById("score").innerHTML = "Score: " + Math.round(score);
        }
         */

        /* Check to see if the user won or lost the game */
        if(score > WINNING_SCORE) {
            alert("YOU WIN!!!!!!!!!!!!!");
            window.location.reload(); /* reload the page on a victory */
        }
        if(score < LOSING_SCORE) {
            alert("YOU LOSE :(");
            window.location.reload();
        }


        //alert("Shape Clicked: " + s.frameCount);
        // We want to remove s from shapes
        for(i = 0; i < shapes.length; i++) {
            if(shapes[i] == s) {
                // shapes.splice(i, 1);
                shapes[i] = null;
                //alert("Shape clicked");
            }
        }
    }

}

function checkBounds(event)
{
    // Get the bounding box of the canvas
    var rect = canvas.getBoundingClientRect();

    // console.log("Clicked");
    var canvasx = event.clientX - rect.left;
    var canvasy = event.clientY - rect.top;

    testx = 2.0*canvasx/CANVAS_X-1.0;
    testy = -(2.0*canvasy/CANVAS_Y-1.0);

    var i;
    for(i = 0; i < shapes.length; i++) {
        if(shapes[i] != null) {
            checkShape(testx, testy, shapes[i]);
        }
    }
    // checkShape(testx, testy, shapes[0]);
}
