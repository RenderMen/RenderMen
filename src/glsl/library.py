
import utils
import primitives

# ------------------------------------------------------------------------------ GLSL HEADER

glsl_header = """

#version 100

precision highp float;

#define MATH_FAR 10000.0
#define MATH_EPSILON 0.0001

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


# ------------------------------------------------------------------------------ GLSL RAY LAUNCH

def glsl_intersect(scene):
    code_tmplt = """
void
ray_intersect()
{{
    {code_content}
}}
    """

    code_content = ""

    for prim in scene.primitives:
        code_tmplt_prim = """
    if ({glsl} == 1)
    {{
        ray_color = vec3(0.0, 0.0, 1.0);
    }}
        """

        code_content += code_tmplt_prim.format(
            glsl=prim.glsl()
        )

    return code_tmplt.format(
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

    ray_intersect();

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
    float camera_field_of_view = {camera_field_of_view};

    vec3 ray_color = ray_launch(camera_origin, camera_dir);

    gl_FragColor = vec4(ray_color, 1.0);
}}

"""

    return code_tmplt.format(
        camera_origin=utils.code_vec(scene.camera.position),
        camera_dir=utils.code_vec(scene.camera.direction),
        camera_field_of_view=scene.camera.field_of_view
    )


# ------------------------------------------------------------------------------ MAIN

def main(scene):
    glsl_code = ""

    glsl_code += glsl_header
    glsl_code += glsl_global_ray
    glsl_code += primitives.glsl_code
    glsl_code += glsl_intersect(scene)
    glsl_code += glsl_ray_launch
    glsl_code += glsl_main(scene)

    return glsl_code
