function fullscreenBuffer(gl)
{
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
    gl.binBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}
