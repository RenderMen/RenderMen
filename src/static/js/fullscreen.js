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
