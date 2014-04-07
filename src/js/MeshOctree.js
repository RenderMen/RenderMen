// Require MeshOctreeNode.js
// Require lib/gl-matrix.js : vec3
// Require Box.js
// Require utils.js : max3, min3

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
    this.pos = vec3.fromValues(0.0, 0.0, 0.0);

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
    assert(vertexAttr.attributes.length % 9 === 0,
        "The vertices must compose distinct triangles (vertices number multiple of 9 (got " +
        vertexAttr.attributes.length + "))");

    var min = vec3.fromValues(Infinity, Infinity, Infinity);
    var max = vec3.fromValues(-Infinity, -Infinity, -Infinity);

    var vertices = vertexAttr.attributes;

    // Retrieve Octree dimensions
    for(var i = 0; i < vertices.length - 2; i += 3)
    {
        min[0] = Math.min(vertices[i], min[0]);
        max[0] = Math.max(vertices[i], max[0]);

        min[1] = Math.min(vertices[i+1], min[1]);
        max[1] = Math.max(vertices[i+1], max[1]);

        min[2] = Math.min(vertices[i+2], min[2]);
        max[2] = Math.max(vertices[i+2], max[2]);
    }

    this.dx = max[0] - min[0];
    this.dy = max[1] - min[1];
    this.dz = max[2] - min[2];

    //TODO
    // Round to upper power of two

    this.pos = min; // Front lower left vertice of the octree

    console.log("Octree min : " + vec3.str(min));
    console.log("Octree max : " + vec3.str(max));

    // Insert the mesh's triangle into the octree
    var bounding = new Box();
    for(var i = 0; i < vertices.length - 8; i += 9)
    {
        bounding.min[0] = min3(vertices[i], vertices[i+3], vertices[i+6]);
        bounding.max[0] = max3(vertices[i], vertices[i+3], vertices[i+6]);

        bounding.min[1] = min3(vertices[i+1], vertices[i+4], vertices[i+7]);
        bounding.max[1] = max3(vertices[i+1], vertices[i+4], vertices[i+7]);

        bounding.min[2] = min3(vertices[i+2], vertices[i+5], vertices[i+8]);
        bounding.max[2] = max3(vertices[i+2], vertices[i+5], vertices[i+8]);

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

    var mid = vec3.fromValues(
        this.pos[0] + this.dx / 2.0,
        this.pos[1] + this.dy / 2.0,
        this.pos[2] + this.dz / 2.0
    )

    var half_dx = this.dx / 2;
    var half_dy = this.dy / 2;
    var half_dz = this.dz / 2;

    var b = bounding;
    var b_size = vec3.fromValues(
        b.max[0] - b.min[0],
        b.max[1] - b.min[1],
        b.max[2] - b.min[2]
    )

    var node = this.root;
    var offset = vec3.create();

   while(true)
    {
        if((b_size[0] > half_dx) ||
           (b_size[1] > half_dy) ||
           (b_size[2] > half_dz) ||
           (b.min[0] < mid[0]) && (b.max[0] > mid[0]) ||
           (b.min[1] < mid[1]) && (b.min[1] < mid[1]) ||
           (b.min[2] < mid[2]) && (b.min[2] < mid[2]))
        {
            node.append(indice);
            break;
        }

        half_dx /= 2.0;
        half_dy /= 2.0;
        half_dz /= 2.0;

        if(node.children.length == 0)
        {
            node.split();
        }

        if(b.max[0] < mid[0])
        {
            if(b.max[1] < mid[1])
            {
                if(b.max[2] < mid[2])
                {
                    node = node.children[0];
                    vec3.set(offset, -half_dx, -half_dy, -half_dz);
                }
                else
                {
                    node = node.children[1];
                    vec3.set(offset, -half_dx, -half_dy, +half_dz);
                }
            }
            else
            {
                if(b.max[2] < mid[2])
                {
                    node = node.children[2];
                    vec3.set(offset, -half_dx, +half_dy, -half_dz);
                }
                else
                {
                    node = node.children[3];
                    vec3.set(offset, -half_dx, +half_dy, +half_dz);
                }
            }
        }
        else
        {
            if(b.max[1] < mid[1])
            {
                if(b.max[2] < mid[2])
                {
                    node = node.children[4];
                    vec3.set(offset, +half_dx, -half_dy, -half_dz);
                }
                else
                {
                    node = node.children[5];
                    vec3.set(offset, +half_dx, -half_dy, +half_dz);
                }
            }
            else
            {
                if(b.max[2] < mid[2])
                {
                    node = node.children[6];
                    vec3.set(offset, +half_dx, +half_dy, -half_dz);
                }
                else
                {
                    node = node.children[7];
                    vec3.set(offset, +half_dx, +half_dy, +half_dz);
                }
            }
        }

        mid[0] += offset[0];
        mid[1] += offset[1];
        mid[2] += offset[2];
    }
}
