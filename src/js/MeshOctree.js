// Mesh Octree class
function MeshOctree(mesh)
{
    // Mesh
    this.mesh = mesh;

    // Root of the octree
    this.root = new MeshOctreeNode(this);

    // Width of the octree
    this.width = 0;

    // Height of the octree
    this.height = 0;

    // Depth of the octree
    this.depth = 0;

    // Position of the octree
    this.pos = new Vector3(0.0, 0.0, 0.0);

    this.init();
}

MeshOctree.prototype.init = function()
{
    console.log("Octree constructor");
    assert(this.mesh != null);

    var vertexAttr = this.mesh.attributes["VERTEX"];

    assert(vertexAttr != null);
    assert(vertexAttr.nbComponent == 3);
    assert(vertexAttr.isValid());

    var min = new Vector3(Infinity, Infinity, Infinity);
    var max = new Vector3(-Infinity, -Infinity, -Infinity);

    var vertices = vertexAttr.attributes;

    for(var i = 0; i < vertices.length - 2; i += 3)
    {
        min.x = vertices[i] < min.x ? vertices[i] : min.x;
        max.x = vertices[i] > max.x ? vertices[i] : max.x;

        min.y = vertices[i+1] < min.y ? vertices[i+1] : min.y;
        max.y = vertices[i+1] > max.y ? vertices[i+1] : max.y;

        min.z = vertices[i+2] < min.z ? vertices[i+2] : min.z;
        max.z = vertices[i+2] > max.z ? vertices[i+2] : max.z;
    }

    this.width  = max.x - min.x;
    this.height = max.y - min.y;
    this.depth  = max.z - min.z;

    //this.pos =

    console.log("Octree min : " + min.toString());
    console.log("Octree max : " + max.toString());
}

/*
 * Insert a triangle in the octree
 */
MeshOctree.prototype.insert = function(p1, p2, p3)
{

}
