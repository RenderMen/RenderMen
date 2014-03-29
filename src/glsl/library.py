
import math

import utils
import primitives
import material
import glsl_math


# ------------------------------------------------------------------------------ GLSL HEADER

def glsl_header():
    code_tmplt = """

#version 100

precision highp float;

#define MATH_FAR 10000.0
#define MATH_EPSILON 0.0001
#define MATH_PI {math_pi}

    """

    return code_tmplt.format(
        math_pi=math.pi
    )


# ------------------------------------------------------------------------------ GLSL GLOBAL

glsl_global = """

vec3
ray_origin;

vec3
ray_dir;

vec3
ray_color;

float
ray_intersection_dist;

vec3
attr_pos;

vec3
attr_normal;

int
ray_next_iteration;

vec3
ray_next_dir;


void
ray_continue(vec3 dir)
{
    ray_next_dir = dir;
    ray_next_iteration = 1;
}

void
ray_stop()
{
    ray_next_iteration = 0;
}

"""


# ------------------------------------------------------------------------------ GLSL RAY INTERSECTION

def glsl_intersect(scene):
    code_tmplt = """
void
ray_intersect()
{{
    int seed = random_seed;

    {code_content}
}}
    """

    code_content = ""

    for prim in scene.primitives:
        code_tmplt_prim = """
    if ({intersect_call} == 1)
    {{
        random_seed = seed;
        {material_code}
    }}
        """

        code_content += code_tmplt_prim.format(
            intersect_call=prim.intersect_call(),
            material_code=prim.material_code()
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
    ray_color = vec3(0.0);

    vec3 frag_color = vec3(1.0);

    for (int i = 0; i < 5; i++)
    {
        ray_intersection_dist = MATH_FAR;
        ray_next_iteration = 0;

        ray_intersect();

        frag_color *= ray_color;

        if (abs(ray_intersection_dist - MATH_FAR) < MATH_EPSILON)
        {
            break;
        }

        if (ray_next_iteration == 0)
        {
            return frag_color;
        }

        ray_dir = ray_next_dir;
        ray_origin = attr_pos + ray_dir * MATH_EPSILON;
    }

    return vec3(0.0);
}

"""


# ------------------------------------------------------------------------------ GLSL MAIN

def glsl_main(scene):
    code_tmplt = """

varying vec4 position;
uniform float width;
uniform float height;
uniform vec2 offset;
uniform float nb_samples;
uniform float sample_id;

void
main()
{{
    random_seed = int(noise3D(vec3(position.x, position.y, sample_id)) * 18723.0);

    vec3 camera_origin = {camera_origin};
    vec3 camera_dir = {camera_dir};
    float camera_field_of_view = {camera_field_of_view};

    float far = 1.0;
    float aspect = width / height;

    float xx = tan(camera_field_of_view / 2.0) * far;
    float yy = tan(camera_field_of_view / 2.0) * far / aspect;

    vec3 u = normalize(cross(camera_dir, vec3(0.0, 0.0, 1.0)));
    vec3 v = cross(u, camera_dir);

    vec3 c = camera_origin + camera_dir * cos(camera_field_of_view / 2.0);

    vec3 pos = c + (xx * (position.x + offset.x)) * u + (yy * (position.y + offset.y)) * v;
    vec3 dir = normalize(pos - camera_origin);

    vec3 ray_color = ray_launch(pos, dir);

    gl_FragColor = vec4(ray_color / nb_samples, 1.0);
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

    glsl_code += glsl_header()
    glsl_code += glsl_global

    glsl_code += glsl_math.glsl_code
    glsl_code += material.glsl_code
    glsl_code += primitives.glsl_code

    glsl_code += glsl_intersect(scene)
    glsl_code += glsl_ray_launch
    glsl_code += glsl_main(scene)

    return glsl_code
