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

    var fullscreenProgram = createProgram(gl, fullscreenVertexShader, fullscreenFragmentShader);

    apiCall('api/shader', 'GET', {}, function(data) {
        if(data.ok) {

            var fragmentShader = data.result;
            var program = createProgram(gl, fullscreenVertexShader, fragmentShader);

            var width = gl.drawingBufferWidth;
            var height = gl.drawingBufferHeight;

            // Global framebuffer
            var framebuffer = new Framebuffer(gl);

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.fbo);
            framebuffer.fbo.width = width;
            framebuffer.fbo.height = height;

            // Set viewport
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);

            gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);

            var vertexLoc = gl.getAttribLocation(program, "vertex");
            assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

            var widthLoc = gl.getUniformLocation(program, "width");
            assert(widthLoc != -1, "Invalid location of uniform \"width\"");

            var heightLoc = gl.getUniformLocation(program, "height");
            assert(heightLoc != -1, "Invalid location of uniform \"height\"");

            var offsetLoc = gl.getUniformLocation(program, "offset");
            assert(offsetLoc != -1, "Invalid location of uniform \"offset\"");

            var nbSamplesLoc = gl.getUniformLocation(program, "nb_samples");
            assert(nbSamplesLoc != -1, "Invalid location of uniform \"nb_samples\"");

            var sampleId = gl.getUniformLocation(program, "sample_id");
            assert(sampleId != -1, "Invalid location of uniform \"sample_id\"");

            gl.enableVertexAttribArray(vertexLoc);
            gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);
            gl.uniform1f(widthLoc, width);
            gl.uniform1f(heightLoc, height);

            var NB_SAMPLES = 16;

            gl.uniform1f(nbSamplesLoc, NB_SAMPLES * NB_SAMPLES);

            var pixelWidth = 2 / width;
            var pixelHeight = 2 / height;

            var xStep = pixelWidth / NB_SAMPLES;
            var yStep = pixelHeight / NB_SAMPLES;

            var halfPixelWidth = pixelWidth / 2;
            var halfPixelHeight = pixelHeight / 2;

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_ADD);
            gl.disable(gl.DEPTH_TEST);

            for(var i = 0; i < NB_SAMPLES; i++)
            {
                for(var j = 0; j < NB_SAMPLES; j++)
                {
                    var xOffset = -halfPixelWidth + j * xStep;
                    var yOffset = halfPixelHeight - i * yStep;

                    gl.uniform2f(offsetLoc, xOffset, yOffset);
                    gl.uniform1f(sampleId, i * NB_SAMPLES + j);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                }
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.disable(gl.BLEND);

            gl.useProgram(fullscreenProgram);
            gl.bindTexture(gl.TEXTURE_2D, framebuffer.textures[0]);

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
