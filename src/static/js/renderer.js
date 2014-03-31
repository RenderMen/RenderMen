// Class GLContext
function GLContext()
{
    // Canvas
    this.canvas = document.getElementById("renderCanvas");

    // Real gl context
    this.context = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    assert(this.context, "WebGL not supported");

    var gl = this.context;

    assert(gl.getExtension('OES_texture_float'), "Required \"OES_texture_float\" extension not supported");

    // Fullscreen vertex buffer
    this.fullscreenBuffer = createFullscreenBuffer(this.context);

    // Fullscreen blit program
    this.fullscreenProgram = createProgram(this.context, fullscreenVertexShader, fullscreenFragmentShader);

    // FBO
    this.fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    gl.disable(gl.DEPTH_TEST);

}

GLContext.prototype.processAssignment = function(assignment, shaderCode) {
    var gl = this.context;

    // Set viewport
    var program = createProgram(this.context, fullscreenVertexShader, shaderCode);
    var texture = this.rayTrace(assignment, program);

    var render_x = parseInt(assignment["x"]);
    var render_y = parseInt(assignment["y"]);
    var render_width = parseInt(assignment["width"]);
    var render_height = parseInt(assignment["height"]);

    gl.viewport(render_x, render_y, render_width, render_height);
    this.drawFullscreenQuad(texture);

    var pixels = this.getPixels(assignment, texture);

    gl.deleteTexture(texture);

    return pixels;
}

// Launch the pathtracing algorithm with the given program
GLContext.prototype.rayTrace = function(assignment, program) {
    var gl = this.context;

    var render_width = parseInt(assignment["width"]);
    var render_height = parseInt(assignment["height"]);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, render_width, render_height, 0, gl.RGBA, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.viewport(0, 0, render_width, render_height);

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
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenBuffer);

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

    var samples = parseInt(assignment["samples"]);

    //>>> Send attributes
    gl.enableVertexAttribArray(vertexLoc);
    gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0); // Vertices

    //>>> Send uniforms
    gl.uniform1f(nbSamplesLoc, samples * samples); // Number of samples

    var pixelWidth = 2.0 / render_width.toFixed(2);
    var pixelHeight = 2.0 / render_height.toFixed(2);

    var xStep = pixelWidth / samples.toFixed(2);
    var yStep = pixelHeight / samples.toFixed(2);

    var halfPixelWidth = pixelWidth * 0.5;
    var halfPixelHeight = pixelHeight * 0.5;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);

    for(var i = 0; i < samples; i++)
    {
        for(var j = 0; j < samples; j++)
        {
            var xOffset = - halfPixelWidth + (j + 0.5) * xStep;
            var yOffset = - halfPixelHeight + (i + 0.5) * yStep;

            gl.uniform2f(offsetLoc, xOffset, yOffset);
            gl.uniform1f(sampleId, i * samples + j);

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

GLContext.prototype.drawFullscreenQuad = function(texture, opacity) {
    opacity = opacity || 1.0;

    var gl = this.context;

    var vertexLoc = gl.getAttribLocation(this.fullscreenProgram, "vertex");
    assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

    var opacityLoc = gl.getUniformLocation(this.fullscreenProgram, "opacity");
    assert(opacityLoc != -1, "Invalid location of uniform \"opacity\"");

    gl.useProgram(this.fullscreenProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenBuffer);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.enableVertexAttribArray(vertexLoc);

    gl.uniform1f(opacityLoc, opacity);

    gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(vertexLoc);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
};

GLContext.prototype.getPixels = function(assignment, texture) {
    var gl = this.context;

    var render_width = parseInt(assignment["width"]);
    var render_height = parseInt(assignment["height"]);

    gl.viewport(0, 0, render_width, render_height);

    var integerTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, integerTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, render_width, render_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, integerTexture, 0);

    this.drawFullscreenQuad(texture);

    var pixel_count = 4 * render_width * render_height;
    var pixels = new Uint8Array(pixel_count);

    gl.bindTexture(gl.TEXTURE_2D, integerTexture);
    gl.readPixels(0, 0, render_width, render_height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteTexture(integerTexture);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var pixel_array = new Array(pixel_count);

    for (var i = 0; i < pixel_count; i++)
    {
        pixel_array[i] = pixels[i];
    }

    return pixel_array;
}

GLContext.prototype.drawPixels = function(assignment, pixel_array, opacity) {
    opacity = 1.0;
    var pixels = new Uint8Array(pixel_array);
    var gl = this.context;

    var render_x = parseInt(assignment["x"]);
    var render_y = parseInt(assignment["y"]);
    var render_width = parseInt(assignment["width"]);
    var render_height = parseInt(assignment["height"]);

    gl.viewport(render_x, render_y, render_width, render_height);

    var integerTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, integerTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, render_width, render_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.drawFullscreenQuad(integerTexture, opacity);

    gl.deleteTexture(integerTexture);
}

// Main
function main() {
    var glContext = new GLContext();
    assert(glContext, "Failed to get WebGL context");

    var socket = io.connect('/rendering');


    var renderingDOM = $('#rendering');
    var rendering = {width: renderingDOM.data('width'),
                     height: renderingDOM.data('height'),
                     id: renderingDOM.data('id'),
                     samples: renderingDOM.data('samples') }
    glContext.current_rendering = rendering;

    var $canvas = $('#renderCanvas');
    $canvas.attr('width', rendering.width);
    $canvas.attr('height', rendering.height);

    socket.on('incoming assignment', function(data) {
        var assignment_author_email = data.assignment.assigned_to;
        var user_email = $("#user-info").attr("data-email");


        glContext.drawPixels(data.assignment, data.assignment.pixels);
    });

    socket.on('previous assignments', function(data) {
        console.log(data);
        $.each(data.assignments, function(i, assignment) {
            glContext.drawPixels(assignment, assignment.pixels);
        })
    });

    socket.on('new assignment', function(data) {
        if (!data.ok) {
            console.log("Couldn't fetch a rendering !");
            return;
        }

        // If the rendering is completed, we look for another rendering to complete
        if (data.result.completed) {
            console.log("Rendering completed !");
            socket.emit('get rendering');
            return;
        }

        // Otherwise we process the given assignment
        var assignment = data.result.assignment;
        var pixels = glContext.processAssignment(assignment, data.result.shader);

        // We send the rendered pixels to the server
        socket.emit('assignment completed', {assignment_id: assignment['_id']['$oid'], pixels:byteToString(pixels)});

        // And once that's done, we look for another assignment
        socket.emit('get assignment', {rendering_id: glContext.current_rendering.id});
    });

    // Fetching previous completed assignments for this rendering
    socket.emit('get previous assignments', {rendering_id: glContext.current_rendering.id});

    // Fetching an assignment for this rendering
    socket.emit('get assignment', {rendering_id: glContext.current_rendering.id});

}


$(document).ready(function() {
    // Main WebGL-related stuff
    main();
});
