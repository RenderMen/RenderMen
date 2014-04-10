// Require GL.js

function MeshDebug(mesh, canvasId)
{
    // Mesh
    this.mesh = mesh;
    assert(mesh, "Invalid mesh");

    // Canvas
    this.canvas = document.getElementById(canvasId || "canvas");

    // GL context
    this.gl = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    assert(this.gl, "WebGL not supported");
    assert(this.gl.getExtension('OES_texture_float'), "Required \"OES_texture_float\" extension not supported");

    // Shader program
    this.program  = null;

    // Vertex buffer containing the vertices of all the triangles of the mesh
    this.vertexPositionBuffer = null;

    // Vertex buffer containing the color of the vertices
    this.vertexColorBuffer = null;


    // Initialization
    this.init();
}

/*
 *
 */
MeshDebug.prototype.init = function()
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


    this.program = GL.createProgram(this.gl, vertexShaderSource, fragmentShaderSource);

    this.gl.useProgram(this.program);
    {
        this.program.vertexPositionAttr = this.gl.getAttribLocation(this.program, "vertexPosition");
        this.program.vertexColorAttr    = this.gl.getAttribLocation(this.program, "vertexColor");
        this.program.mvMatrixUniform    = this.gl.getUniformLocation(this.program, "mvMatrix");
        this.program.pMatrixUniform     = this.gl.getUniformLocation(this.program, "pMatrix");
    }
    this.gl.useProgram(null);


    this.vertexPositionBuffer = this.createVertexPositionBuffer();
    this.vertexColorBuffer = this.createVertexColorBuffer(1.0, 0.0, 0.0);
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

    mat4.perspective(this.pMatrix, 70.0, this.gl.drawingBufferWidth / this.gl.drawingBufferHeight, 0.1, 100.0);
    mat4.translate(this.pMatrix, this.pMatrix, [0, 0, -32]);
}

/*
 * Create a vertex buffer containing the vertices of all the triangles of the mesh.
 *
 * @return A vertex buffer object.
 */
MeshDebug.prototype.createVertexPositionBuffer = function()
{
    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    var vertexPositionBuffer = gl.createBuffer();
    assert(vertexPositionBuffer, "Failed to create cube vertex position buffer");

    var vertexAttr = this.mesh.attributes["VERTEX"];

    assert(vertexAttr != null, "The mesh must have vertices");
    assert(vertexAttr.nbComponent === 3, "Vertices must have 3 components (x, y, z)");
    assert(vertexAttr.attributes.length % 9 === 0,
        "The vertices must compose distinct triangles (vertices number multiple of 9 (got " +
        vertexAttr.attributes.length + "))");

    var vertices = vertexAttr.attributes;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.nbItems  = vertices.length / 3.0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vertexPositionBuffer;
}

/*
 * Create a vertex buffer containing the color of the vertices of the triangles.
 *
 * @param r Red component of the color
 * @param g Green component of the color
 * @param b Blue component of the color
 *
 * @return A vertex buffer object.
 */
MeshDebug.prototype.createVertexColorBuffer = function(r, g, b)
{
    // Default values
    r = r || 0.5;
    g = g || 0.5;
    b = b || 0.5;

    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    var vertexColorBuffer = gl.createBuffer();
    assert(vertexColorBuffer, "Failed to create cube vertex color buffer");

    var vertexAttr = this.mesh.attributes["VERTEX"];

    assert(vertexAttr != null, "The mesh must have vertices");
    assert(vertexAttr.nbComponent === 3, "Vertices must have 3 components (x, y, z)");
    assert(vertexAttr.attributes.length % 9 === 0,
        "The vertices must compose distinct triangles (vertices number multiple of 9 (got " +
        vertexAttr.attributes.length + "))");

    var vertices = vertexAttr.attributes;

    var colors = new Array();

    for(var i = 0; i < vertices.length; i += 3)
    {
        colors.push(r);
        colors.push(g);
        colors.push(b);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        vertexColorBuffer.itemSize = 3;
        vertexColorBuffer.nbItems  = vertices.length / 3.0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vertexColorBuffer;
}

/*
 * Draw the mesh
 *
 * @param center Position of the center of the cube
 * @param size Size of the cube
 */
MeshDebug.prototype.draw = function(pos, scale)
{
    var gl = this.gl;
    assert(gl, "Invalid WebGL context");

    pos   = pos || vec3.fromValues(0.0, 0.0, 0.0);
    scale = scale || 1.0;

    // Apply transformations to modelview matrix
    mat4.identity(this.mvMatrix);
    //mat4.scale(this.mvMatrix, this.mvMatrix, [scale, scale, scale]);
    //mat4.translate(this.mvMatrix, this.mvMatrix, pos);

    // Drawing options
    var width = gl.drawingBufferWidth;
    var height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //gl.bindBuffer(gl.FRAMEBUFFER, this.framebuffer);
    //{
        gl.useProgram(this.program);
        {
            // Send uniforms
            gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.mvMatrix);
            gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.pMatrix);

            // Send cube vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            {
                gl.enableVertexAttribArray(this.program.vertexPositionAttr);
                gl.vertexAttribPointer(
                    this.program.vertexPositionAttr,
                    this.vertexPositionBuffer.itemSize,
                    gl.FLOAT, false, 0, 0
                );
            }

            // Send cube colors
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
            {
                gl.enableVertexAttribArray(this.program.vertexColorAttr);
                gl.vertexAttribPointer(
                    this.program.vertexColorAttr,
                    this.vertexColorBuffer.itemSize,
                    gl.FLOAT, false, 0, 0
                );
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            console.log("Nb triangles: " + this.vertexPositionBuffer.nbItems / 3);

            // Draw mesh
            gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.nbItems);

            gl.disableVertexAttribArray(this.program.vertexColorAttr);
            gl.disableVertexAttribArray(this.program.vertexPositionAttr);
        }
        gl.useProgram(null);
    //}
    //gl.bindBuffer(gl.FRAMEBUFFER, null);
}

