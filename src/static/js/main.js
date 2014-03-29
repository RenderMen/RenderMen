function apiCall(path, method, params, callback) {
    $.ajax({
      url: path,
      type: method,
      async: true,
      dataType: "json",
      data: JSON.stringify(params),
      contentType: 'application/json;charset=UTF-8',
      success: callback
    });
}

function main()
{
    var canvas = document.getElementById("renderCanvas");

    var gl = canvas.getContext("experimental-webgl");

    if(!gl) // WebGL not supported
    {
        console.log("WebGL not supported");
        return false;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
