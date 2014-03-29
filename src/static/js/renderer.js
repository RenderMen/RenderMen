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
        if(data.ok) {

            fragmentShader = data.result;
            program = createProgram(gl, fullscreenVertexShader, fragmentShader);

            var width = gl.drawingBufferWidth;
            var height = gl.drawingBufferHeight;

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

            var vertexLoc = gl.getAttribLocation(program, "vertex");
            assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

            var widthLoc = gl.getUniformLocation(program, "width");
            assert(widthLoc != -1, "Invalid location of uniform \"width\"");

            var heightLoc = gl.getUniformLocation(program, "height");
            assert(heightLoc != -1, "Invalid location of uniform \"height\"");

            gl.enableVertexAttribArray(vertexLoc);
            gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);
            gl.uniform1f(widthLoc, width);
            gl.uniform1f(heightLoc, height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        } else {
            console.log("Failed to retrieve shader");
            return;
        }
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
