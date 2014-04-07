// Mesh octree node class
function MeshOctreeNode(daddy)
{
    // Parent of the node
    this.daddy = daddy;

    // 8 children of the node
    this.children = new Array();

    // Indices of the triangles of the mesh contained in the node
    this.triangles = new Array();
}

/*
 * Append a triangle to the node
 */
MeshOctreeNode.prototype.append = function(indice)
{
    this.triangles.push(indice);
}

/*
 * Split the node <=> create 8 child nodes
 */
MeshOctreeNode.prototype.split = function()
{
    assert(this.children.length == 0, "Cannot split node with children");

    // Create the 8 children
    // (min.x, min.y, min.z) : 000
    // (max.x, min.y, min.z) : 001
    // (min.x, max.y, min.z) : 010
    // (max.x, max.y, min.z) : 011
    // (min.x, min.y, max.z) : 100
    // (max.x, min.y, max.z) : 101
    // (min.x, max.y, max.z) : 110
    // (max.x, max.y, max.z) : 111
    for(var i = 0; i < 8; i++)
    {
        this.children.push(new MeshOctreeNode());
    }
}
