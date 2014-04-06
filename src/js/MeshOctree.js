// Require MeshOctreeNode.js
// Require Vector3.js
// Require Box.js
// Require utils.js

// Mesh Octree class
function MeshOctree(mesh)
{
    // Mesh
    this.mesh = mesh;

    // Root of the octree
    this.root = new MeshOctreeNode(this);

    // Length on x-axis of the octree
    this.dx = 0;

    // Length on y-axis of the octree
    this.dy = 0;

    // Length on z-axis of the octree
    this.dz = 0;

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

    // Retrieve Octree dimensions
    for(var i = 0; i < vertices.length - 2; i += 3)
    {
        min.x = min(vertices[i], min.x);
        max.x = max(vertices[i], max.x);

        min.y = min(vertices[i+1], min.y);
        max.y = max(vertices[i+1], max.y);

        min.z = min(vertices[i+2], min.z);
        max.z = max(vertices[i+2], max.z);
    }

    this.dx = max.x - min.x;
    this.dy = max.y - min.y;
    this.dz = max.z - min.z;

    //TODO
    // Ruond to upper power of two

    this.pos = min; // Front lower left vertice of the octree

    console.log("Octree min : " + min.toString());
    console.log("Octree max : " + max.toString());

    // Insert the mesh's triangle into the octree
    var bounding = new Box();
    for(var i = 0; i < vertices.length - 8; i += 9)
    {
        bounding.min.x = min(vertices[i], vertices[i+3], vertices[i+6]);
        bounding.max.x = max(vertices[i], vertices[i+3], vertices[i+6]);

        bounding.min.y = min(vertices[i+1], vertices[i+4], vertices[i+7]);
        bounding.max.y = max(vertices[i+1], vertices[i+4], vertices[i+7]);

        bounding.min.z = min(vertices[i+2], vertices[i+5], vertices[i+8]);
        bounding.max.z = max(vertices[i+2], vertices[i+5], vertices[i+8]);

        this.insert(i / 9, bounding);
    }
}

/*
 * Insert a triangle in the octree
 *
 * @param indice : indice of the triangle to insert
 * @param bounding : bounding box of the triangle
 */
MeshOctree.prototype.insert = function(indice, bounding)
{
    assert(this.root != null, "The root of the octree must not be null");

    var mid = new Vector3(
        pos.x + this.dx / 2.0;
        pos.y + this.dy / 2.0;
        pos.z + this.dz / 2.0;
    )

    var half_dx = this.dx / 2;
    var half_dy = this.dy / 2;
    var half_dz = this.dz / 2;

    var b = bounding;
    var inserted = false;
    var node = this.root;

    var offset = new Vector3();

   while(!inserted)
    {
        half_dx /= 2.0;
        half_dy /= 2.0;
        half_dz /= 2.0;

        if((b.min.x < mid.x) && (b.max.x > mid.x) ||
           (b.min.y < mid.y) && (b.min.y < mid.y) ||
           (b.min.z < mid.z) && (b.min.z < mid.z)
        {
            node.insert(indice);
            inserted = true;
            continue;
        }

        if(node.children.length == 0)
        {
            node.split();
        }

        if(b.max.x < mid.x)
        {
            if(b.max.y < mid.y)
            {
                if(b.max.z < mid.z)
                {
                    node = node.children[0];
                    offset.set(-half_dx, -half_dy, -half_dz);
                }
                else
                {
                    node = node.children[1];
                    offset.set(-half_dx, -half_dy, +half_dz);
                }
            }
            else
            {
                if(b.max.z < mid.z)
                {
                    node = node.children[2];
                    offset.set(-half_dx, +half_dy, -half_dz);
                }
                else
                {
                    node = node.children[3];
                    offset.set(-half_dx, +half_dy, +half_dz);
                }
            }
        }
        else
        {
            if(b.max.y < mid.y)
            {
                if(b.max.z < mid.z)
                {
                    node = node.children[4];
                    offset.set(+half_dx, -half_dy, -half_dz);
                }
                else
                {
                    node = node.children[5];
                    offset.set(+half_dx, -half_dy, +half_dz);
                }
            }
            else
            {
                if(b.max.z < mid.z)
                {
                    node = node.children[6];
                    offset.set(+half_dx, +half_dy, -half_dz);
                }
                else
                {
                    node = node.children[7];
                    offset.set(+half_dx, +half_dy, +half_dz);
                }
            }
        }

        mid.x += offset.x;
        mid.y += offset.y;
        mid.z += offset.z;
    }
}
