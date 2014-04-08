// Require lib/gl-matrix.js

function MeshOctreeDebug(octree, canvasId)
{
    // Octree
    assert(octree, "Invalid octree");
    this.octree = octree;

    // Canvas
    this.canvas = document.getElementById(canvasId || "canvas");

    // GL context
    this.gl = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    assert(this.gl, "WebGL not supported");
    assert(this.gl.getExtension('OES_texture_float'), "Required \"OES_texture_float\" extension not supported");

    // Shader program
    this.program  = null;

    // Vertex buffer containing the vertices of a cube of size 1.
    this.cubeVertexPositionBuffer = null;

    // Vertex buffer containing the color of a cube.
    this.cubeVertexColorBuffer = null;

    // Vertex buffer containing the indices of the vertices of a cube.
    this.cubeVertexIndexBuffer = null;

    // Framebuffer used for drawing
    this.framebuffer = null;

    // Framebuffer
    this.texture = null;

    // Modelview matrix
    this.mvMatrix = null;

    // Projection matrix
    this.pMatrix = null;


    // Initialization
    this.init();
}

/*
 * Initializes the MeshOctree debug
 */
MeshOctreeDebug.prototype.init = function()
{
    var vertexShaderSource =
        "precision highp float;\n" +
        "attribute vec3 vertexPosition;\n" +
        "attribute vec3 vertexColor;\n" +
        "uniform mat4 mvMatrix;\n" +
        "uniform mat4 pMatrix;\n" +
        "varying vec3 vColor;\n" +
        "void main()\n" +
        "{\n" +
        "    gl_Position = pMatrix * mvMatrix * vec4(vertexPosition, 1.0);\n" +
        "    vColor = vertexColor;\n" +
        "}";

    var fragmentShaderSource =
        "precision highp float;\n" +
        "varying vec3 vColor;\n" +
        "void main()\n" +
        "{\n" +
        "    vec4 color = vec4(0.0);\n" +
        "    color.x = 1.0;\n" +
        "    color.y = 1.0;\n" +
        "    gl_FragColor = vec4(vColor, 1.0);\n" +
        "}";


    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    this.cubeVertexPositionBuffer = this.createCubeVertexPositionBuffer();
    this.cubeVertexColorBuffer = this.createCubeVertexColorBuffer();
    this.cubeVertexIndexBuffer = this.createCubeVertexIndexBuffer();
    //this.framebuffer = this.createFramebuffer();
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

    mat4.perspective(this.pMatrix, 70.0, this.gl.drawingBufferWidth / this.gl.drawingBufferHeight, 0.1, 100.0);
    mat4.translate(this.pMatrix, this.pMatrix, [0, 0, -32]);
}

/*
 * Create a shader.
 *
 * @param type Type of the shader
 * @param source Source code of the shader
 *
 * @return A shader
 */
MeshOctreeDebug.prototype.createShader = function(type, source)
{
    var gl = this.gl;
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
MeshOctreeDebug.prototype.createProgram = function(vertexSource, fragmentSource)
{
    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    var program = gl.createProgram();

    gl.attachShader(program, this.createShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, this.createShader(gl.FRAGMENT_SHADER, fragmentSource));

    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!success)
    {
        var log = gl.getProgramInfoLog(program);
        throw "Failed to link program: " + log;
    }

    gl.useProgram(program);
    {
        program.vertexPositionAttr = gl.getAttribLocation(program, "vertexPosition");
        program.vertexColorAttr    = gl.getAttribLocation(program, "vertexColor");
        program.mvMatrixUniform    = gl.getUniformLocation(program, "mvMatrix");
        program.pMatrixUniform     = gl.getUniformLocation(program, "pMatrix");
    }
    gl.useProgram(null);

    return program;
}

/*
 * Create a vertex buffer containing the vertices of a cube of size 1.
 *
 * @return A vertex buffer object.
 */
MeshOctreeDebug.prototype.createCubeVertexPositionBuffer = function()
{
    var gl = this.gl;
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
MeshOctreeDebug.prototype.createCubeVertexColorBuffer = function(r, g, b)
{
    // Default values
    r = r || 0.5;
    g = g || 0.5;
    b = b || 0.5;

    var gl = this.gl;
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
MeshOctreeDebug.prototype.createCubeVertexIndexBuffer = function()
{
    var gl = this.gl;
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
MeshOctreeDebug.prototype.createFramebuffer = function()
{
    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    var fbo = gl.createFramebuffer();
    assert(fbo, "Failed to create framebuffer object");

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

/*
 * Draw a cube
 *
 * @param center Position of the center of the cube
 * @param size Size of the cube
 */
MeshOctreeDebug.prototype.drawCube = function(center, size)
{
    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    // Apply transformations to modelview matrix
    mat4.identity(this.mvMatrix);
    //mat4.rotate(...);
    //mat4.rotateY(this.mvMatrix, this.mvMatrix, Math.pi / 6.0);
    mat4.translate(this.mvMatrix, this.mvMatrix, center);
    mat4.scale(this.mvMatrix, this.mvMatrix, [size, size, size]);

    //gl.bindBuffer(gl.FRAMEBUFFER, this.framebuffer);
    //{
        gl.useProgram(this.program);
        {

            // Send uniforms
            gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.mvMatrix);
            gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.pMatrix);

            // Send cube vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
            {
                gl.enableVertexAttribArray(this.program.vertexPositionAttr);
                gl.vertexAttribPointer(
                    this.program.vertexPositionAttr,
                    this.cubeVertexPositionBuffer.itemSize,
                    gl.FLOAT, false, 0, 0
                );
            }

            // Send cube colors
            gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexColorBuffer);
            {
                gl.enableVertexAttribArray(this.program.vertexColorAttr);
                gl.vertexAttribPointer(
                    this.program.vertexColorAttr,
                    this.cubeVertexColorBuffer.itemSize,
                    gl.FLOAT, false, 0, 0
                );
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            // Send cube vertices' indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);

            // Draw cube
            gl.drawElements(gl.LINES, this.cubeVertexIndexBuffer.nbItems, gl.UNSIGNED_SHORT, 0);
            //gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.disableVertexAttribArray(this.program.vertexColorAttr);
            gl.disableVertexAttribArray(this.program.vertexPositionAttr);
        }
        gl.useProgram(null);
    //}
    //gl.bindBuffer(gl.FRAMEBUFFER, null);
}

/*
 * Draw a MeshOctreeNode recursively
 */
MeshOctreeDebug.prototype.drawNode = function(node, center, size)
{
    if(!node) return;

    this.drawCube(center, size);

    if(node.children.length === 0) return;

    assert(node.children.length === 8, "An octree node must have 0 or 8 children");

    var half_size = size / 2.0;

    for(var i = 0; i < 8; i++)
    {
        // Next node center
        var c = vec3.fromValues(center[0], center[1], center[2]);
        c[0] += (i & 4 ? half_size : -half_size);
        c[1] += (i & 2 ? half_size : -half_size);
        c[2] += (i & 1 ? half_size : -half_size);

        this.drawNode(node.children[i], c, half_size);
    }
}

/*
 * Draw the attached MeshOctree
 */
MeshOctreeDebug.prototype.draw = function()
{
    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    // Drawing options
    gl.lineWidth(1);
    var width = gl.drawingBufferWidth;
    var height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var octreeCenter = vec3.fromValues(
        this.octree.pos[0] + this.octree.dim[0] / 2.0,
        this.octree.pos[1] + this.octree.dim[1] / 2.0,
        this.octree.pos[2] + this.octree.dim[2] / 2.0
    );

    this.drawNode(this.octree.root, octreeCenter, this.octree.dim[0]);
}
