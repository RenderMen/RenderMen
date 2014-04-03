// Mesh class
function Mesh()
{
    // Attributes of the mesh
    // -> pair<string, MeshAttributes> === pair<AttrName, Attr>
    this.attributes = { };
}

/*
 * Set the attributes named <attrName> of the mesh
 */
Mesh.prototype.setAttributes = function(attrName, meshAttributes)
{
    this.attributes[attrName] = meshAttributes;
}
