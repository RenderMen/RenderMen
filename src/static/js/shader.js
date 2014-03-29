function createShader(gl, shaderType, shaderCode)
{
    var shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderCode);
    gl.createShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if(!success)
    {
        var log = gl.getShaderInfoLog(shader);
        throw "Failed to compile shader\nCODE:\n" + shaderCode + "\nLOG:\n" + log;
    }

    return shader;
}

function createProgram(gl, vertexCode, fragmentCode)
{
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexCode);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentCode);

    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    var success = gl.getProgramParameter(shader, gl.LINK_STATUS);

    if(!success)
    {
        var log = gl.getProgramInfoLog(program);
        throw "Failed to link program: " + log;
    }

    return program;
}
