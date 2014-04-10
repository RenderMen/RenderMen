// Require lib/gl-matrix.js
// Require GL.js

function MeshOctreeDebug(octree, renderer)
{
    assert(octree, "Invalid octree");
    assert(renderer, "Invalid renderer (null)");

    // GL context
    this.gl = renderer.gl;

    // Renderer
    this.renderer = renderer;

    // Octree
    this.octree = octree;

    // Shader program
    this.program  = null;

    // Vertex buffer containing the vertices of a cube of size 1.
    this.cubeVertexPositionBuffer = null;

    // Vertex buffer containing the color of a cube.
    this.cubeVertexColorBuffer = null;

    // Vertex buffer containing the indices of the vertices of a cube.
    this.cubeVertexIndexBuffer = null;

    // Model matrix
    this.modelMatrix = null;

    // Modelview matrix (to avoid reallocation)
    this.mvMatrix = null;

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


    this.program = GL.createProgram(this.gl, vertexShaderSource, fragmentShaderSource);

    this.gl.useProgram(this.program);
    {
        this.program.vertexPositionAttr = this.gl.getAttribLocation(this.program, "vertexPosition");
        this.program.vertexColorAttr    = this.gl.getAttribLocation(this.program, "vertexColor");
        this.program.mvMatrixUniform    = this.gl.getUniformLocation(this.program, "mvMatrix");
        this.program.pMatrixUniform     = this.gl.getUniformLocation(this.program, "pMatrix");
    }
    this.gl.useProgram(null);


    this.cubeVertexPositionBuffer = GL.createCubeVertexPositionBuffer(this.gl);
    this.cubeVertexColorBuffer = GL.createCubeVertexColorBuffer(this.gl);
    this.cubeVertexIndexBuffer = GL.createCubeVertexIndexBuffer(this.gl);
    //this.framebuffer = GL.createFramebuffer();
    this.modelMatrix = mat4.create();
    this.mvMatrix = mat4.create();
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

    // Apply transformations to model matrix
    mat4.identity(this.modelMatrix);
    //mat4.rotateY(this.modelMatrix, this.modelMatrix, Math.PI / 6.0);
    mat4.translate(this.modelMatrix, this.modelMatrix, center);
    mat4.scale(this.modelMatrix, this.modelMatrix, [size, size, size]);

    // Compute modelview matrix
    mat4.mul(this.mvMatrix, this.renderer.viewMatrix, this.modelMatrix);

    gl.useProgram(this.program);
    {
        // Send uniforms
        gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.mvMatrix);
        gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.renderer.projMatrix);

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

        gl.disableVertexAttribArray(this.program.vertexColorAttr);
        gl.disableVertexAttribArray(this.program.vertexPositionAttr);
    }
    gl.useProgram(null);
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
    //gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw octree
    var octreeCenter = vec3.fromValues(
        this.octree.pos[0] + this.octree.dim[0] / 2.0,
        this.octree.pos[1] + this.octree.dim[1] / 2.0,
        this.octree.pos[2] + this.octree.dim[2] / 2.0
    );

    this.drawNode(this.octree.root, octreeCenter, this.octree.dim[0] / 2.0);
}
