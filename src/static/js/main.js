requirejs.config({
    baseUrl: 'static/js'
});

function apiCall(path, method, params, callback) {
    $.ajax({
      url: path,
      type: method,
      async: true,
      dataType: "json",
      data: JSON.stringify(params),
      contentType: 'application/json;charset=UTF-8',
      complete: callback
    });

}

require(["shader", "fullscreen"]);
function main()
{
    var canvas = document.getElementById("renderCanvas");

    var gl = canvas.getContext("experimental-webgl");

    if(!gl) // WebGL not supported
    {
        console.log("WebGL not supported");
        return false;
    }

    // Global fullscreen program
    fullscreenProgram = createProgram(gl, fullscreenVertexShader, fullscreenFragmentShader);

    // Global framebuffer
    fbo = createFramebuffer(gl);

    // Set viewport
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(fullscreenProgram);

    var fullscreenBuffer = createFullscreenBuffer(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Main
$(document).ready(function() {
    main();
});
