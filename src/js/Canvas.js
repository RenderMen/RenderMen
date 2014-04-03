
function Canvas(canvasId)
{
    // Canvas
    this.canvas = document.getElementById(canvasId);
    this.program = new Object();

    // Real gl context
    this.gl = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    assert(this.gl, "WebGL not supported");

    var gl = this.gl;

    assert(gl.getExtension('OES_texture_float'), "Required \"OES_texture_float\" extension not supported");

    // Fullscreen vertex buffer
    this.createFullscreenBuffer(this);

    // Fullscreen blit program
    this.buildProgramFullscreenCopy();

    // FBO
    this.fbo = gl.createFramebuffer();

    gl.disable(gl.DEPTH_TEST);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

/*
 * Creates Canvas's fullscreen buffer
 */
Canvas.prototype.createFullscreenBuffer = function()
{
    var gl = this.gl;

    assert(gl, "Invalid WebGL context");

    var buffer = gl.createBuffer();

    assert(buffer, "Failed to create buffer");

    var vertexArray = [
        -1.0, -1.0,
        +1.0, -1.0,
        +1.0, +1.0,
        +1.0, +1.0,
        -1.0, +1.0,
        -1.0, -1.0
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.fullscreenBuffer = buffer;
}

Canvas.prototype.createShader = function(shaderType, shaderCode)
{
    var gl = this.gl;

    assert(gl, "Invalid WebGL context");

    var shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if(!success)
    {
        var log = gl.getShaderInfoLog(shader);
        //throw "Failed to compile shader\nCODE:\n" + shaderCode + "\nLOG:\n" + log;
        throw "Failed to compile shader\nLOG:\n" + log;
    }

    return shader;
}

Canvas.prototype.createProgram = function(vertexCode, fragmentCode)
{
    var gl = this.gl;

    assert(gl, "Invalid WebGL context");

    var vertexShader = this.createShader(gl.VERTEX_SHADER, vertexCode);
    var fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentCode);

    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if(!success)
    {
        var log = gl.getProgramInfoLog(program);
        throw "Failed to link program: " + log;
    }

    return program;
}


Canvas.prototype.buildProgramFullscreenCopy = function()
{
    var fullscreenVertexShader =
"precision highp float; \
attribute vec2 vertex; \
uniform float width; \
uniform float height; \
varying vec2 texcoord; \
varying vec4 position; \
void \
main() \
{ \
    texcoord = 0.5 * vertex + 0.5; \
    gl_Position = vec4(vertex, 0.0, 1.0); \
    position = gl_Position; \
} \
";

    var fullscreenFragmentShader =
"precision highp float; \
varying vec2 texcoord; \
uniform sampler2D texture; \
uniform float opacity; \
void \
main() \
{ \
    gl_FragColor = mix(vec4(1.0), texture2D(texture, texcoord), opacity); \
} \
";

    this.program.fullscreenCopy = this.createProgram(fullscreenVertexShader, fullscreenFragmentShader);
}
