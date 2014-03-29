function getGLContext() {

   var canvas = document.getElementById("renderCanvas");

    var gl = canvas.getContext("experimental-webgl");

    if(!gl) // WebGL not supported
    {
        console.log("WebGL not supported");
        return null;
    }

    return gl;
}


function drawScene(gl) {

    var fullscreenBuffer = createFullscreenBuffer(gl);

    // Global fullscreen program
    //var program = createProgram(gl, fullscreenVertexShader, fullscreenFragmentShader);

    var program;

    apiCall('api/shader', 'GET', {}, function(data) {
        fragmentShader = data.result;
        program = createProgram(gl, fullscreenVertexShader, fragmentShader);

        // Global framebuffer
        var fbo = createFramebuffer(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Set viewport
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        gl.clearColor(0.0, 1.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);

        vertexLoc = gl.getAttribLocation(program, "vertex");
        assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

        widthLoc = gl.getAttribLocation(program, "width");
        assert(widthLoc != -1, "Invalid location of attribute \"width\"");

        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
        heightLoc = gl.getAttribLocation(program, "height");
        assert(heightLoc != -1, "Invalid location of attribute \"height\"");

        console.log("vertex : " + vertexLoc);
        console.log("width : " + widthLoc);
        console.log("height : " + heightLoc);

        gl.enableVertexAttribArray(vertexLoc);
        gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);
        gl.enableVertexAttribArray(widthLoc);
        gl.vertexAttribPointer(widthLoc, 1, gl.FLOAT, false, 4, 0);
        gl.enableVertexAttribArray(heightLoc);
        gl.vertexAttribPointer(heightLoc, 1, gl.FLOAT, false, 4, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

    });
}

function main() {
    gl = getGLContext();
    assert(gl, "Failed to get WebGL context");

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawScene(gl);
}


// Main
$(document).ready(function() {
    // Main WebGL-related stuff
    main();
});
