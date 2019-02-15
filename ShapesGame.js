var nvert;
// var vertx;
// var verty;
// var testx;
// var testy;
var shapes = [];
var shapeTypes = [];
var gl;
var score;
var shaderProgram;
var shaderProgramDiamond;
var X_SCALE = 2;
var Y_SCALE = 1;
var CANVAS_X = 512.0 * X_SCALE;
var CANVAS_Y = 512.0 * Y_SCALE;

var MS_FRAME = 15; // [ms/frame]
var MAX_TIME = 5; // [sec] the maximum amount of time to have a shape show
var MAX_FRAMES = MAX_TIME * 1000 * MS_FRAME;

function init()
{
    // Set up the canvas
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert( "WebGL is not available" ); }

    // Set up the viewport
    gl.viewport( 0, 0, 1024, 512 );   // x, y, width, height

    // Set up the background color
    gl.clearColor( 1.0, 0.0, 0.0, 1.0 );

    // Force the WebGL context to clear the color buffer
    gl.clear( gl.COLOR_BUFFER_BIT );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    console.log("Bound the buffera");

    shaderProgram = initShaders( gl,"vertex-shader", "fragment-shader" );
    gl.useProgram( shaderProgram );
    addTriangle();


    shaderProgramDiamond = initShaders( gl, "vertex-shader-diamond", "fragment-shader-diamond" );
    gl.useProgram (shaderProgramDiamond );
    addDiamond();

    var myPositionAttribute = gl.getAttribLocation( shaderProgram, "myPosition"); //telling theis function to get variable "myPosition" from shaderProgram, getAttribLocation to js to get handle to myPosition variable in the shader
    gl.vertexAttribPointer( myPositionAttribute, 2, gl.FLOAT, false, 0, 0 ); // (variable, stepping in sets of 2,  )
    gl.enableVertexAttribArray( myPositionAttribute );

    setInterval(renderShapes, 15);
}


function scalePoints(points) {
    // This function scales the shapes based on the canvas size so that they keep the correct proportions
    var i;
    var newPoint;
    newPoints = [];
    for( i = 0; i < points.length; i++) {
        p = points[i];
        console.log("Old: " + p);
        x1 = p[0];
        y1 = p[1];

        // Apply the inverse of the scaling factor
        y2 = y1 / Y_SCALE;
        x2 = x1 / X_SCALE;

        newPoint = vec2(x2, y2);
        console.log("New: " + newPoint);
        newPoints[i] = newPoint;
    }

    // Return the new points
    return newPoints;

}

function addDiamond() {



}

function addTriangle() {
    // Enter array set up code here
    var p0 = vec2 ( .0, 1.0 );
    var p1 = vec2 ( 1.0, .0 );
    var p2 = vec2( .0, .0 );
    var arrayOfPoints = [p0, p1, p2];
    // arrayOfPoints = scalePoints(arrayOfPoints);

    nvert = 3;
    vertx = [ .0, 1.0, .0];
    verty = [1.0, .0, .0];

    // Create a shape object
    triangle = {
      vertx: [0.0, 1.0, 0.0],
      verty: [1.0, 0.0, 0.0],
      arrayOfPoints: arrayOfPoints,
      nvert: 3,
      frameCount: 0,
    };

    shapeTypes.push(triangle);
    shapes.push(triangle);
}

function renderShapes() {
    // console.log(shapes.length);
    //console.log("Rendering sheets");
    gl.clear( gl.COLOR_BUFFER_BIT);
    // This function renders the list of shapes and updates the frame count for each one
    var i = 0;
    var s;
    // console.log("Shapes.length: ", shapes.length);
    for( i=0; i < shapes.length; i++) {
        // console.log("drawing shape");
        // console.log("In the loop");
        s = shapes[i];
        // console.log(s);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(s.arrayOfPoints), gl.STATIC_DRAW );
        gl.drawArrays( gl.LINE_LOOP, 0, 3 ); //0 is another offset and 3 is how many points to d
        //console.log(s.frameCount);
        if(((s.frameCount * MS_FRAME)/1000.0) > MAX_TIME) {
            // We must remove the element from the list
            shapes.splice(i, 1);
            //console.log(shapes.length);
        }

        s.frameCount++;

        // Check to see how high the frame count is.
    }
}

function checkShape(testx, testy, s) {
    // console.log("Checking");
    // Check to see if the point clicked is in the shape
    var c = 0;
    var i = 0;
    var j;
    var nvert = s.nvert;
    var vertx = s.vertx;
    var verty = s.verty;

    for (i = 0, j = nvert-1; i < nvert; j = i++) {
        if ( ((verty[i]>testy) != (verty[j]>testy)) &&
            (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) )
            c = !c;
    }

    if(c) {
        // This is if the click is within the shape
        // We need to remove the shape from the list and update the score of the game
        // The score should be the maximum number of frames it could be - the number of frames it took to click

        //alert("Shape Clicked: " + s.frameCount);
        // We want to remove s from shapes
        for(i = 0; i < shapes.length; i++) {
            if(shapes[i] == s) {
                shapes.splice(i, 1);
                alert("Shape clicked");
            }
        }
    }
}

function checkBounds(event)
{
    console.log("Clicked");
    var canvasx = event.clientX;
    var canvasy = event.clientY;

    testx = 2.0*canvasx/CANVAS_X-1.0;
    testy = -(2.0*canvasy/CANVAS_Y-1.0);

    // console.log("Testx: ", testx);
    // console.log("Testy: ", testy);

    checkShape(testx, testy, shapes[0]);
}
