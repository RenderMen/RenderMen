
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

vec3
ray_color;

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
        ray_color = vec3(0.0, 0.0, 1.0);
    }
}

"""


# ------------------------------------------------------------------------------ GLSL RAY LAUNCH

def glsl_intersect(scene):
    code_function_tmplt = """

void
ray_intersect()
{{
    {code_content}
}}

"""

    code_tmplt_sphere = """
    object_sphere({sphere});
    """

    code_content = ""

    for prim in scene.primitives:
        code_content += code_tmplt_sphere.format(
            sphere=utils.code_vec(prim.vec4)
        )

    return code_function_tmplt.format(
        code_content=code_content
    )


# ------------------------------------------------------------------------------ GLSL RAY LAUNCH

glsl_ray_launch = """

vec3
ray_launch(vec3 origin, vec3 dir)
{
    ray_origin = origin;
    ray_dir = dir;
    ray_intersection_dist = MATH_FAR;
    ray_color = vec3(0.0);

    ray_intersect()

    return ray_color;
}

"""


# ------------------------------------------------------------------------------ GLSL MAIN

def glsl_main(scene):
    code_tmplt = """

void
main()
{{
    vec3 camera_origin = {camera_origin};
    vec3 camera_dir = {camera_dir};
    float camera_fill_of_view = {camera_fill_of_view};

    vec3 ray_color = ray_launch(camera_origin, camera_dir);

    gl_FragColor = vec4(ray_color, 1.0);
}}

"""

    return code_tmplt.format(
        camera_origin=utils.code_vec(scene.camera.position),
        camera_dir=utils.code_vec(scene.camera.direction),
        camera_fill_of_view=scene.camera.fill_of_view
    )


# ------------------------------------------------------------------------------ MAIN

def main(scene):
    glsl_code = ""

    glsl_code += glsl_header
    glsl_code += glsl_global_ray
    glsl_code += glsl_sphere_code
    glsl_code += glsl_intersect(scene)
    glsl_code += glsl_ray_launch
    glsl_code += glsl_main(scene)

    return glsl_code
