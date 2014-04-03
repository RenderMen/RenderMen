// Mesh attribute (vertices, normals, uvs, ...)
function MeshAttributes(nbComponent)
{
    // Array of attributes
    this.attributes = new Array();

    // Number of component per attribute
    this.nbComponent = nbComponent;
}

/*
 * Append components of an attribute
 */
MeshAttributes.prototype.append = function(attr1, attr2, attr3)
{
    if(attr1 != null) this.attributes.push(attr1);
    if(attr2 != null) this.attributes.push(attr2);
    if(attr3 != null) this.attributes.push(attr3);
}

/*
 * Check the validity of the attributes.
 * The  is considered valid if its size is a multiple
 * of the number of component.
 */
MeshAttributes.prototype.isValid = function()
{
    return this.nbComponent > 0 &&
           (this.attributes.length % this.nbComponent === 0);
}
