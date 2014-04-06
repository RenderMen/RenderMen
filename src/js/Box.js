// Require Vector3.js

// Box class
function Box(min_x, min_y, min_z, max_x, max_y, max_z)
{
    min_x = min_x || 0;
    min_y = min_y || 0;
    min_z = min_z || 0;
    max_x = max_x || 0;
    max_y = max_y || 0;
    max_z = max_z || 0;

    this.min = new Vector(min_x, min_y, min_z);
    this.max = new Vector(max_x, max_y, max_z);
}
