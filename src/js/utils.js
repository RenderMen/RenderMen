// Assert function
function assert(condition, message)
{
    if (!condition)
    {
        throw message || "Assertion failed";
    }
}

function max(x, y, z)
{
    return Math.max(x, Math.max(y, z));
}

function min(x, y, z)
{
    return Math.min(x, Math.min(y, z));
}
