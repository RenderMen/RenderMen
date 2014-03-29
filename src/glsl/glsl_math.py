
glsl_code = """

float
noise1D(float x)
{
    return fract(sin(x * 12.9898) * 43758.5453);
}

float
noise2D(vec2 v)
{
    return fract(sin(dot(v.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float
noise3D(vec3 v)
{
    return fract(sin(dot(v.xyz, vec3(12.9898, 78.233, 42.5487))) * 43758.5453);
}

int
random_seed;

float
random()
{
    random_seed += 1;

    return noise1D(float(random_seed));
}

vec3
random_half_sphere()
{
    float r1 = 2.0 * MATH_PI * random();
    float r2 = random();
    float r2s = sqrt(r2);

    return vec3(cos(r1) * r2s, sin(r1) * r2s, sqrt(1.0 - r2));
}

mat3
generate_basis(vec3 z)
{
    if (abs(z.x) > 0.0)
    {
        vec3 x = normalize(vec3(-z.y, z.x, 0.0));
        vec3 y = cross(z, x);

        return mat3(x, y, z);
    }

    vec3 x = normalize(vec3(0.0, -z.z, z.y));
    vec3 y = cross(z, x);

    return mat3(x, y, z);
}

"""
