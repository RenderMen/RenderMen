requirejs.config({
    baseUrl: 'static/js'
});

function apiCall(path, method, params, callback) {
    var request = $.ajax({
      url: path,
      type: method,
      async: true,
      dataType: "json",
      data: JSON.stringify(params),
      contentType: 'application/json;charset=UTF-8',
    });
    request.success(callback);
}

function getGLContext() {

   var canvas = document.getElementById("renderCanvas");

    var gl = canvas.getContext("experimental-webgl");

    if(!gl) // WebGL not supported
    {
        console.log("WebGL not supported");
        return null;
    }

    return gl;
}

function main() {
    gl = getGLContext();
    assert(gl, "Failed to get WebGL context");

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var fullscreenBuffer = createFullscreenBuffer(gl);

    // Global fullscreen program
    var fullscreenProgram = createProgram(gl, fullscreenVertexShader, fullscreenFragmentShader);

    // Global framebuffer
    var fbo = createFramebuffer(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Set viewport
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(fullscreenProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function testGetShader() {
    gl = getGLContext();
    assert(gl, "Failed to get WebGL context");

    apiCall('api/shader', 'GET', {}, function(data) {
        fragmentShader = data.responseText;
        fullscreenProgram = createProgram(gl, fullscreenVertexShader, fragmentShader);
    });
}

// Main
$(document).ready(function() {
    // Main WebGL-related stuff
    main();
    // Configures login dropdown menu
    $('.dropdown-menu').click(function(event) {
      event.stopPropagation();
    });

    // Login btn
    $('#login-btn').click(function() {
      console.log('hihi');
      var email = $('#login-email').val();
      var password = $('#login-password').val();
      apiCall('/api/login', 'POST', {email: email, password: password}, function(data) {
        console.log(data);
      });

      // Redirecting the user to the frontpage
      window.location.replace('/')
    });

    //testGetShader();
});
