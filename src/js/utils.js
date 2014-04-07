// Assert function
function assert(condition, message)
{
    if (!condition)
    {
        throw message || "Assertion failed";
    }
}

function max3(x, y, z)
{
    return Math.max(x, Math.max(y, z));
}

function min3(x, y, z)
{
    return Math.min(x, Math.min(y, z));
}

// Gets the least power of 2 greater than or equal to x
// (32 bits version)
function next_power_of_2(x)
{
    x = x - 1;
    x |= (x >> 1);
    x |= (x >> 2);
    x |= (x >> 4);
    x |= (x >> 8);
    x |= (x >> 16);
    return x + 1;
}
