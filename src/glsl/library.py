
import utils

# ------------------------------------------------------------------------------ GLSL HEADER

glsl_header = """

#version 100

precision highp float;

#define MATH_FAR 10000.0
#define MATH_EPSILONE 0.0001

"""


# ------------------------------------------------------------------------------ GLSL GLOBAL RAY

glsl_global_ray = """

vec3
ray_origin;

vec3
ray_dir;

float
ray_intersection_dist;

"""


# ------------------------------------------------------------------------------ GLSL SPHERE
#
# sphere is a vec4(center, radius)
#

glsl_sphere_code = """

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


# ------------------------------------------------------------------------------ GLSL MAIN

glsl_ray_launch = """

vec3
ray_launch(vec3 origin, vec3 dir)
{
    ray_origin = origin;
    ray_dir = dir;
    ray_intersection_dist = MATH_FAR;

    return vec3(0.0);
}

"""


# ------------------------------------------------------------------------------ GLSL MAIN

def glsl_main(scene):
    code_tmplt = """

void
main()
{{
    vec3 camera_origin = {camera_origin};
    vec3 dir = vec(0.0, 1.0, 0.0);

    gl_FragColor = vec4(ray_launch(origin, dir), 1.0);
}}

"""

    camera_origin = utils.code_vec(scene.camera.position)

    return code_tmplt.format(camera_origin=camera_origin)


# ------------------------------------------------------------------------------ MAIN

def main(scene):
    glsl_code = ""

    glsl_code += glsl_header
    glsl_code += glsl_global_ray
    glsl_code += glsl_sphere_code
    glsl_code += glsl_main(scene)

    return glsl_code
