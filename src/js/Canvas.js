
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

    // Fullscreen programs
    this.buildProgramFullscreenCopy();
    this.buildProgramFullscreenClear();

    // FBO
    this.fbo = gl.createFramebuffer();

    /*
     * WebGL context initialization
     */
    gl.disable(gl.DEPTH_TEST);

    /*
     * clear frame buffer
     */
    this.clear();
}

Canvas.prototype.clear = function()
{
    var gl = this.gl;
    var program = this.program.fullscreenClear;

    var vertexLoc = gl.getAttribLocation(program, "vertex");
    assert(vertexLoc != -1, "Invalid location of attribute \"vertex\"");

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenBuffer);
    gl.enableVertexAttribArray(vertexLoc);
    gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 8, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(vertexLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
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
void \
main() \
{ \
    gl_FragColor = texture2D(texture, texcoord); \
} \
";

    this.program.fullscreenCopy = this.createProgram(fullscreenVertexShader, fullscreenFragmentShader);
}

Canvas.prototype.buildProgramFullscreenClear = function()
{
    var fullscreenVertexShader =
"precision highp float; \
attribute vec2 vertex; \
varying vec4 position; \
void \
main() \
{ \
    gl_Position = vec4(vertex, 0.0, 1.0); \
    position = gl_Position; \
} \
";

    var fullscreenFragmentShader =
"precision highp float; \
void \
main() \
{ \
    ivec2 coord = ivec2(gl_FragCoord.xy) / 8; \
    int sum = coord.x + coord.y; \
    float factor = float(sum - 2 * (sum / 2)); \
    gl_FragColor = mix(vec4(0.8, 0.8, 0.8, 1.0), vec4(1.0), factor); \
} \
";

    this.program.fullscreenClear = this.createProgram(fullscreenVertexShader, fullscreenFragmentShader);
}
