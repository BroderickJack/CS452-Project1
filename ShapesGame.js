var nvert;
var vertx;
var verty;
var testx;
var testy;


function drawTriangle() {
    // Set up the canvas
    var canvas=document.getElementById("gl-canvas");
    var gl=WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert( "WebGL is not available" ); }

    // Set up the viewport
    gl.viewport( 0, 0, 512, 512 );   // x, y, width, height

    // Set up the background color
    gl.clearColor( 1.0, 0.0, 0.0, 1.0 );

    // Force the WebGL context to clear the color buffer
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Enter array set up code here
    var p0 = vec2 ( .0, 1.0 );
    var p1 = vec2 ( 1.0, .0 );
    var p2 = vec2( .0, .0 );
    var arrayOfPoints = [p0, p1, p2];

    nvert = 3;
    vertx = [ .0, 1.0, .0];
    verty = [1.0, .0, .0];

    // Create a shape object
    var shape = {
      vertx: [0.0, 1.0, 0.0],
      verty: [1.0, 0.0, 0.0],
      nvert: 3,
      frameCount: 0,
    };

    // Create a buffer on the graphics card,
    // and send array to the buffer for use
    // in the shaders
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(arrayOfPoints), gl.STATIC_DRAW ); //take array of points, send that array of points to the buffer on the graphics card, and either draw everything
    //at once or stream the way you draw content i.e. regulate how much gets drawn at a certain point. Make sure the array of pts goes to right location in memory
    //flatten has been given to us

    // Create shader program, needs vertex and fragment shader code
    // in GLSL to be written in HTML file
    var shaderProgram = initShaders( gl,"vertex-shader", "fragment-shader" ); //fragment is another term for pixel, these names just need to match the ones in the other program
    gl.useProgram( shaderProgram ); // real job of doing rendering is done by these programs

    // Create a pointer that iterates over the
    // array of points in the shader code
    var myPositionAttribute = gl.getAttribLocation( shaderProgram, "myPosition"); //telling this function to get variable "myPosition" from shaderProgram, getAttribLocation to js to get handle to myPosition variable in the shader
    gl.vertexAttribPointer( myPositionAttribute, 2, gl.FLOAT, false, 0, 0 ); // (variable, stepping in sets of 2,  )
    gl.enableVertexAttribArray( myPositionAttribute );

    // Force a draw of the triangle using the
    // 'drawArrays()' call
    gl.drawArrays( gl.LINE_LOOP, 0, 3 ); //0 is another offset and 3 is how many points to draw
}

checkShape(testx, testy, s) {
    // Check to see if the point clicked is in the shape
    var c = 0;
    var i = 0;
    var j;

    for (i = 0, j = nvert-1; i < nvert; j = i++) {
        if ( ((verty[i]>testy) != (verty[j]>testy)) &&
            (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) )
            c = !c;
    }

    if(c) {
        alert("Shape Clicked");
    }
}

function checkBounds(event)
{
    var canvasx = event.clientX;
    var canvasy = event.clientY;

    testx = 2.0*canvasx/512.0-1.0;
    testy = -(2.0*canvasy/512.0-1.0);

    console.log("Testx: ", testx);
    console.log("Testy: ", testy);

    checkShape(testx, testy, shapes[0]);
}
