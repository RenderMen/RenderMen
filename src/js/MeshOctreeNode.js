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
    this.triangles.append(indice);
}
