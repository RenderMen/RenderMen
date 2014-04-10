// Require lib/gl-matrix.js

function DebugRenderer(canvasId)
{
    // Canvas
    this.canvas = document.getElementById(canvasId || "canvas");

    // GL context
    this.gl = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    assert(this.gl, "WebGL not supported");
    assert(this.gl.getExtension('OES_texture_float'),
        "Required \"OES_texture_float\" extension not supported");

    // TODO: camera

    // View matrix
    this.viewMatrix = mat4.create();

    // Projection matrix
    this.projMatrix = mat4.create();

    mat4.perspective(
        this.projMatrix,
        70.0,
        this.gl.drawingBufferWidth / this.gl.drawingBufferHeight,
        0.1,
        100.0
    );

    mat4.translate(this.projMatrix, this.projMatrix, [0, 0, -32]);

    // Initialization
    this.init();
}

DebugRenderer.prototype.init = function()
{

}
