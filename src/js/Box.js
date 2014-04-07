// Require lib/gl-matrix.js : vec3

// Box class
function Box(min_x, min_y, min_z, max_x, max_y, max_z)
{
    min_x = min_x || 0;
    min_y = min_y || 0;
    min_z = min_z || 0;
    max_x = max_x || 0;
    max_y = max_y || 0;
    max_z = max_z || 0;

    this.min = vec3.fromValues(min_x, min_y, min_z);
    this.max = vec3.fromValues(max_x, max_y, max_z);
}
