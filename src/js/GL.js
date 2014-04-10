// Global GL object
var GL = new Object();

/*
 * Create a shader.
 *
 * @param type Type of the shader
 * @param source Source code of the shader
 *
 * @return A shader
 */
GL.createShader = function(gl, type, source)
{
    assert(gl, "Invalid WebGL context");

    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
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

/*
 * Create a program.
 *
 * @param vertexSource Source code of the vertex shader
 * @param fragmentSource Source code of the fragment shader
 *
 * @return A program
 */
GL.createProgram = function(gl, vertexSource, fragmentSource)
{
    assert(gl, "Invalid WebGL context");

    var program = gl.createProgram();

    gl.attachShader(program, GL.createShader(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, GL.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource));

    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!success)
    {
        var log = gl.getProgramInfoLog(program);
        throw "Failed to link program: " + log;
    }

    return program;
}

/*
 * Create a vertex buffer containing the vertices of a cube of size 1.
 *
 * @return A vertex buffer object.
 */
GL.createCubeVertexPositionBuffer = function(gl)
{
    assert(gl, "Invalid WebGL context");

    var cubeVertexPositionBuffer = gl.createBuffer();
    assert(cubeVertexPositionBuffer, "Failed to create cube vertex position buffer");

    var vertices = [
        -1.0, -1.0, +1.0,
        +1.0, -1.0, +1.0,
        +1.0, +1.0, +1.0,
        -1.0, +1.0, +1.0,
        -1.0, -1.0, -1.0,
        -1.0, +1.0, -1.0,
        +1.0, +1.0, -1.0,
        +1.0, -1.0, -1.0
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        cubeVertexPositionBuffer.itemSize = 3;
        cubeVertexPositionBuffer.nbItems  = 8;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return cubeVertexPositionBuffer;
}

/*
 * Create a vertex buffer containing the color of the vertices of a cube.
 *
 * @param r Red component of the color
 * @param g Green component of the color
 * @param b Blue component of the color
 *
 * @return A vertex buffer object.
 */
GL.createCubeVertexColorBuffer = function(gl, r, g, b)
{
    // Default values
    r = r || 0.5;
    g = g || 0.5;
    b = b || 0.5;

    assert(gl, "Invalid WebGL context");

    var cubeVertexColorBuffer = gl.createBuffer();
    assert(cubeVertexColorBuffer, "Failed to create cube vertex color buffer");

    var colors = [
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        cubeVertexColorBuffer.itemSize = 3;
        cubeVertexColorBuffer.nbItems  = 8;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return cubeVertexColorBuffer;
}

/*
 * Create a vertex buffer containing the indices of the vertices of a cube.
 *
 * @return A vertex buffer object.
 */
GL.createCubeVertexIndexBuffer = function(gl)
{
    assert(gl, "Invalid WebGL context");

    var cubeVertexIndexBuffer = gl.createBuffer();
    assert(cubeVertexIndexBuffer, "Failed to create cube vertex index buffer");

    var indices = [
        0, 1,
        1, 2,
        2, 3,
        3, 0,

        4, 5,
        5, 6,
        6, 7,
        7, 4,

        0, 4,
        1, 7,
        2, 6,
        3, 5
    ];

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        cubeVertexIndexBuffer.itemSize = 1;
        cubeVertexIndexBuffer.nbItems  = 24;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return cubeVertexIndexBuffer;
}

/*
 * Creates a framebuffer with the dimensions of the underlying gl context.
 * The framebuffer has only one texture attached to gl.COLOR_ATTACHMENT0 and
 * a renderbuffer with a gl.DEPTH_COMPONENT16 storage.
 *
 * @return A framebuffer object
 */
GL.createFramebuffer = function(gl)
{
    assert(gl, "Invalid WebGL context");

    var fbo = gl.createFramebuffer();
    assert(fbo, "Failed to create framebuffer object");

    fbo.textures = new Array();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    {
        fbo.width = gl.canvas.width;
        fbo.height = gl.canvas.height;

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.FLOAT, null);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        fbo.textures.push(texture);

        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        {
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

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
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fbo;
}
