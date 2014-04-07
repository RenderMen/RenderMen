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

    // Dimension of the octree
    this.dim = vec3.fromValues(0.0, 0.0, 0.0);

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

    // Dimension of the mesh octree rounded to
    // the least power of 2 greater or equal
    var max_dim = next_power_of_2(max3(
        max[0] - min[0],
        max[1] - min[1],
        max[2] - min[2]
    ));

    this.dim[0] = max_dim;
    this.dim[1] = max_dim;
    this.dim[2] = max_dim;

    this.pos = min; // Front lower left vertice of the octree

    console.log("Octree dim: " + vec3.str(this.dim));
    console.log("Octree min: " + vec3.str(min));
    console.log("Octree max: " + vec3.str(max));
    console.log("Octree pos: " + vec3.str(this.pos));

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

        //this.insert(i / 9, bounding);
        this.fast_insert(i / 9, bounding);
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

    var center = vec3.fromValues(
        this.pos[0] + this.dim[0] / 2.0,
        this.pos[1] + this.dim[1] / 2.0,
        this.pos[2] + this.dim[2] / 2.0
    )

    // Octree node dimensions
    var half_dim = vec3.fromValues(
        this.dim[0] / 2.0,
        this.dim[1] / 2.0,
        this.dim[2] / 2.0
    );

    var b = bounding;
    var b_size = vec3.fromValues(
        b.max[0] - b.min[0],
        b.max[1] - b.min[1],
        b.max[2] - b.min[2]
    )

    console.log("Bounding box -> size: " + vec3.str(b_size));

    var node = this.root;
    var offset = vec3.create();

   while(true)
    {
        if((b_size[0] > half_dim[0]) ||
           (b_size[1] > half_dim[1]) ||
           (b_size[2] > half_dim[2]) ||
           (b.min[0] < center[0]) && (b.max[0] > center[0]) ||
           (b.min[1] < center[1]) && (b.max[1] < center[1]) ||
           (b.min[2] < center[2]) && (b.max[2] < center[2]))
        {
            node.append(indice);
            console.log("Fitting node -> center: " + vec3.str(center) + " | half_dim: " + vec3.str(half_dim));
            break;
        }

        half_dim[0] /= 2.0;
        half_dim[1] /= 2.0;
        half_dim[2] /= 2.0;

        if(node.children.length == 0)
        {
            node.split();
        }

        if(b.max[2] < center[2])
        {
            if(b.max[1] < center[1])
            {
                if(b.max[0] < center[0])
                {
                    node = node.children[0];
                    vec3.set(offset, -half_dim[0], -half_dim[1], -half_dim[2]);
                }
                else
                {
                    node = node.children[1];
                    vec3.set(offset, +half_dim[0], -half_dim[1], -half_dim[2]);
                }
            }
            else
            {
                if(b.max[0] < center[0])
                {
                    node = node.children[2];
                    vec3.set(offset, -half_dim[0], +half_dim[1], -half_dim[2]);
                }
                else
                {
                    node = node.children[3];
                    vec3.set(offset, +half_dim[0], +half_dim[1], -half_dim[2]);
                }
            }
        }
        else
        {
            if(b.max[1] < center[1])
            {
                if(b.max[0] < center[0])
                {
                    node = node.children[4];
                    vec3.set(offset, -half_dim[0], -half_dim[1], +half_dim[2]);
                }
                else
                {
                    node = node.children[5];
                    vec3.set(offset, +half_dim[0], -half_dim[1], +half_dim[2]);
                }
            }
            else
            {
                if(b.max[0] < center[0])
                {
                    node = node.children[6];
                    vec3.set(offset, -half_dim[0], +half_dim[1], +half_dim[2]);
                }
                else
                {
                    node = node.children[7];
                    vec3.set(offset, +half_dim[0], +half_dim[1], +half_dim[2]);
                }
            }
        }

        center[0] += offset[0];
        center[1] += offset[1];
        center[2] += offset[2];
    }
}

MeshOctree.prototype.fast_insert = function(indice, bounding)
{
    // Octree node center
    var center = vec3.fromValues(
        this.pos[0] + this.dim[0] / 2.0,
        this.pos[1] + this.dim[1] / 2.0,
        this.pos[2] + this.dim[2] / 2.0
    )

    // Octree node dimensions
    var half_dim = vec3.fromValues(
        this.dim[0] / 2.0,
        this.dim[1] / 2.0,
        this.dim[2] / 2.0
    );

    var b = bounding;

    // Bounding box size
    var b_size = vec3.fromValues(
        b.max[0] - b.min[0],
        b.max[1] - b.min[1],
        b.max[2] - b.min[2]
    )

    // Bounding box center
    var b_center = vec3.fromValues(
        (b.max[0] - b.min[0]) / 2.0,
        (b.max[1] - b.min[1]) / 2.0,
        (b.max[2] - b.min[2]) / 2.0
    );

    console.log("Octree -> center: " + vec3.str(center));
    console.log("Bounding box -> size: " + vec3.str(b_size) + " | center: " + vec3.str(b_center));

    // Search for the fitting octree node
    var node = this.root;
    while(true)
    {
        var delta = 0;
        var straddle = false;
        var index = 0;

        // Find the fitting node
        for(var i = 0; i < 3; i++)
        {
            delta = b_center[i] - center[i];

            if(Math.abs(delta) <= b_size[i])
            {
                straddle = true;
                break;
            }

            if(delta > 0) index |= (1 << i);
        }

        // Insert the triangle in the current node if there is straddling
        if(straddle) // || depth > this.max_depth
        {
            console.log("Fitting node -> center: " + vec3.str(center) + " | half_dim: " + vec3.str(half_dim));
            node.append(indice);
            break;
        }

        // Split the node if the does not have children
        if(node.children.length == 0)
        {
            node.split();
        }

        // Next octree node dimensions
        half_dim[0] /= 2.0;
        half_dim[1] /= 2.0;
        half_dim[2] /= 2.0;

        // Next octree node
        node = node.children[index];

        // Next octree node center
        center[0] += (index & 4 ? half_dim[0] : -half_dim[0]);
        center[1] += (index & 2 ? half_dim[1] : -half_dim[1]);
        center[2] += (index & 1 ? half_dim[2] : -half_dim[2]);
    }
}
