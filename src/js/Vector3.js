// Simple 3d vector class
function Vector3(x, y, z)
{
    this.x = x;
    this.y = y;
    this.z = z;

}

Vector3.prototype.toString = function()
{
    return "(" + this.x + ", " + this.y + ", " + this.z + ")";
}

Vector3.prototype.set = function(x, y, z)
{
    this.x = x || this.x;
    this.y = y || this.y;
    this.z = z || this.z;
}
