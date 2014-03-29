// Class GLContext
function GLContext()
{
    // Canvas
    this.canvas = document.getElementById("renderCanvas");

    // Real gl context
    this.context = this.canvas.getContext("experimental-webgl");
    assert(this.context, "WebGL not supported");

    // Canvas width
    this.width = this.context.drawingBufferWidth;

    // Canvas height
    this.height = this.context.drawingBufferHeight;

    // Fullscreen vertex buffer
    this.fullscreenBuffer = createFullscreenBuffer(this.context);

    // Fullscreen blit program
    this.fullscreenProgram = createProgram(this.context, fullscreenVertexShader, fullscreenFragmentShader);

    // Framebuffer
    this.framebuffer = new Framebuffer(this.context);

    // Trick to get this in methods
    var self = this;

    // Draw fullscreen quad method
    this.drawFullscreenQuad = function() {
        var gl = self.context;

        gl.useProgram(glContext.fullscreenProgram);

        var vertexLoc = gl.getAttribLocation(self.fullscreenProgram, "vertex");
        assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

        gl.bindBuffer(gl.ARRAY_BUFFER, glContext.fullscreenBuffer);
        gl.bindTexture(gl.TEXTURE_2D, glContext.framebuffer.textures[0]);
        gl.enableVertexAttribArray(vertexLoc);
        gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(null);
    };

}

// Draw into the glContext framebuffer nbSamples times using the given program
function drawFramebuffer(glContext, program, nbSamples) {

    nbSamples = nbSamples || 16;

    var width = glContext.width;
    var height = glContext.height;

    gl = glContext.context;
    framebuffer = glContext.framebuffer;

    // Set viewport
    gl.viewport(0, 0, width, height);

    // Use the pathtracing program
    gl.useProgram(program);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.fbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, glContext.fullscreenBuffer);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //>>> Retrieve attribute locations
    var vertexLoc = gl.getAttribLocation(program, "vertex");
    assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

    //>>> Retrieve attribute uniforms
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

    //>>> Send attributes
    gl.enableVertexAttribArray(vertexLoc);
    gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0); // Vertices

    //>>> Send uniforms
    gl.uniform1f(widthLoc, width); // Width of the viewport
    gl.uniform1f(heightLoc, height); // Height of the viewport
    gl.uniform1f(nbSamplesLoc, nbSamples * nbSamples); // Number of samples

    var pixelWidth = 2 / width;
    var pixelHeight = 2 / height;

    var xStep = pixelWidth / nbSamples;
    var yStep = pixelHeight / nbSamples;

    var halfPixelWidth = pixelWidth / 2;
    var halfPixelHeight = pixelHeight / 2;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);

    for(var i = 0; i < nbSamples; i++)
    {
        for(var j = 0; j < nbSamples; j++)
        {
            var xOffset = -halfPixelWidth + j * xStep;
            var yOffset = halfPixelHeight - i * yStep;

            gl.uniform2f(offsetLoc, xOffset, yOffset);
            gl.uniform1f(sampleId, i * nbSamples + j);

            // Actual draw call
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disableVertexAttribArray(vertexLoc);
    gl.useProgram(null);
}

// Render the scene using the given program
function drawScene(glContext, program) {

    var NB_SAMPLES = 16;

    // Retrieve global gl context
    gl = glContext.context;

    // Disable depth test
    gl.disable(gl.DEPTH_TEST);

    // >>> Draw into the GL context's framebuffer NB_SAMPLES times
    drawFramebuffer(glContext, program, NB_SAMPLES);

    // >>> Draw to screen
    glContext.drawFullscreenQuad();
}

// Main
function main() {
    glContext = new GLContext();
    assert(glContext, "Failed to get WebGL context");

    // Retrieve shader
    apiCall('api/shader', 'GET', {}, function(data) {
        if(data.ok) {
            var program = createProgram(glContext.context, fullscreenVertexShader, data.result);
            drawScene(glContext, program);

        } else {
            console.log("Failed to retrieve shader");
            return;
        }
    });
}


$(document).ready(function() {
    // Main WebGL-related stuff
    main();
});
