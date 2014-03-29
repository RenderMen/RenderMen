

# ------------------------------------------------------------------------------ CONST

const = """

#define MATH_FAR 10000.0
#define MATH_EPSILONE 0.0001

"""


# ------------------------------------------------------------------------------ GLOBAL RAY

global_ray = """

vec3
ray_origin;

vec3
ray_dir;

float
ray_intersection_dist;

"""


# ------------------------------------------------------------------------------ SPHERE
#
# sphere is a vec4(center, radius)
#

sphere_code = """

void
object_sphere(vec4 sphere)
{
    vec3 oc = sphere.xyz - ray_origin;

    float b = dot(oc, ray_dir);
    float det = b * b - dot(oc, oc) + sphere.z * sphere.z;

    if (det <= 0.0)
    {
        return 0;
    }

    float distance = b - sqrt(det);

    if ((distance > MATH_EPSILONE) && (distance < ray_intersection_dist))
    {
        ray_intersection_dist = distance;
    }
}

"""


# ------------------------------------------------------------------------------ MAIN

main = """

void
main()
{
    ray_origin = vec3(0.0);
    ray_dir = vec(0.0, 1.0, 0.0);
    ray_intersection_dist = MATH_FAR;

    launch_ray();
}

"""
