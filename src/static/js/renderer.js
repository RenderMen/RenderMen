// Class GLContext
function GLContext()
{
    // Canvas
    this.canvas = document.getElementById("renderCanvas");

    // Real gl context
    this.context = this.canvas.getContext("experimental-webgl");
    assert(this.context, "WebGL not supported");

    var gl = this.context;

    // Fullscreen vertex buffer
    this.fullscreenBuffer = createFullscreenBuffer(this.context);

    // Fullscreen blit program
    this.fullscreenProgram = createProgram(this.context, fullscreenVertexShader, fullscreenFragmentShader);

    // FBO
    this.fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    gl.disable(gl.DEPTH_TEST);

}

GLContext.prototype.width = function() {
    return this.context.drawingBufferWidth;
}

GLContext.prototype.height = function() {
    return this.context.drawingBufferHeight;
}

GLContext.prototype.processAssignment = function(assigment, shaderCode) {
    this.canvas.width = assigment["width"]
    this.canvas.height = assigment["height"]

    var gl = this.context;

    // Set viewport
    gl.viewport(0, 0, this.width(), this.height());

    var program = createProgram(this.context, fullscreenVertexShader, data.result);
    var texture = this.rayTrace(program);

    this.drawFullscreenQuad(texture);
}

GLContext.prototype.drawFullscreenQuad = function(texture) {
    var gl = self.context;

    var vertexLoc = gl.getAttribLocation(self.fullscreenProgram, "vertex");
    assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

    gl.useProgram(glContext.fullscreenProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, glContext.fullscreenBuffer);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.enableVertexAttribArray(vertexLoc);

    gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(vertexLoc);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
};

// Draw into the glContext framebuffer nbSamples times using the given program
GLContext.prototype.rayTrace = function(program) {
    nbSamples = nbSamples || 16;

    var width = glContext.width;
    var height = glContext.height;

    var gl = glContext.context;

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width(), this.height(), 0, gl.RGBA, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    if (!gl.isFramebuffer(this.fbo)) {
        throw "Invalid framebuffer";
    }

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch(status)
    {
        case gl.FRAMEBUFFER_COMPLETE:
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            throw "Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            throw "Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            throw "Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            throw "Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED";
            break;
        default:
            throw "Incomplete framebuffer: " + status;
    }
    // Use the pathtracing program
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, glContext.fullscreenBuffer);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //>>> Retrieve attribute locations
    var vertexLoc = gl.getAttribLocation(program, "vertex");
    assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

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
    gl.disableVertexAttribArray(vertexLoc);

    gl.useProgram(null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return texture;
}

// Main
function main() {
    glContext = new GLContext();
    assert(glContext, "Failed to get WebGL context");

    // Retrieve shader
    apiCall('api/shader', 'GET', {}, function(data) {
        if(data.ok) {
            // TODO:

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
