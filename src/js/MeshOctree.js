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
    assert(this.mesh != null, "The mesh of the octree must not be null");
    assert(this.root != null, "The root of the octree must not be null");

    var vertexAttr = this.mesh.attributes["VERTEX"];

    assert(vertexAttr != null, "The mesh must have vertices");
    assert(vertexAttr.nbComponent === 3, "Vertices must have 3 components (x, y, z)");
    assert(vertexAttr.attributes.length % 9 === 0, "The vertices must compose distinct triangles");

    var min = new Vector3(Infinity, Infinity, Infinity);
    var max = new Vector3(-Infinity, -Infinity, -Infinity);

    var vertices = vertexAttr.attributes;

    for(var i = 0; i < vertices.length - 2; i += 3)
    {
        min.x = min(vertices[i], min.x);
        max.x = max(vertices[i], max.x);

        min.y = min(vertices[i+1], min.y);
        max.y = max(vertices[i+1], max.y);

        min.z = min(vertices[i+2], min.z);
        max.z = max(vertices[i+2], max.z);
    }

    this.width  = max.x - min.x;
    this.height = max.y - min.y;
    this.depth  = max.z - min.z;

    this.pos = min;

    console.log("Octree min : " + min.toString());
    console.log("Octree max : " + max.toString());

    for(var i = 0; i < vertices.length - 8; i += 9)
    {
        min.x = min(vertices[i], vertices[i+3], vertices[i+6]);
        max.x = max(vertices[i], vertices[i+3], vertices[i+6]);

        min.y = min(vertices[i+1], vertices[i+4], vertices[i+7]);
        max.y = max(vertices[i+1], vertices[i+4], vertices[i+7]);

        min.z = min(vertices[i+2], vertices[i+5], vertices[i+8]);
        max.z = max(vertices[i+2], vertices[i+5], vertices[i+8]);


    }
}

/*
 * Insert a triangle in the octree
 */
MeshOctree.prototype.insert = function(p1, p2, p3)
{

}
