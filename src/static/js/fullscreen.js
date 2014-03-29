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
void \
main() \
{ \
    gl_FragColor = texture2D(texture, texcoord); \
} \
";

function createFullscreenBuffer(gl)
{
    assert(gl, "Invalid WebGL context");

    var buffer = gl.createBuffer();

    if(!buffer)
    {
        console.log("Failed to create buffer");
        return null;
    }

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

    return buffer;
}

// Creates a framebuffer with a single color attachment
function createFramebuffer(gl)
{
    assert(gl, "Invalid WebGL context");

    assert(gl.getExtension('OES_texture_float'), "Required \"OES_texture_float\" extension not supported");

    var textureType = gl.FLOAT;

    var colorTarget = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTarget);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
        gl.drawingBufferHeight, 0, gl.RGBA, textureType, null);

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTarget, 0);

    if (!gl.isFramebuffer(fbo)) {
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

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fbo;
}
