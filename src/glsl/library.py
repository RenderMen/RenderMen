
import math

import utils
import primitives
import material
import glsl_noise
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
    float seed = random_seed;

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

def glsl_main(scene, assignment):
    code_tmplt = """

varying vec4 position;
uniform vec2 offset;
uniform float nb_samples;
uniform float sample_id;


void
main()
{{
    int image_width = {image_width};
    int image_height = {image_height};
    float image_aspect_ratio = {image_aspect_ratio};

    int render_width = {render_width};
    int render_height = {render_height};
    int render_x = {render_x};
    int render_y = {render_y};

    vec3 camera_origin = {camera_origin};
    vec3 camera_dir = {camera_dir};
    float camera_field_of_view = {camera_field_of_view};
    float camera_near_plan = {camera_near_plan};
    float camera_focal_distance = {camera_focal_distance};
    float camera_blur_factor = {camera_blur_factor};

    vec2 screen_coord = (position.xy + offset) * 0.5 + 0.5;

    screen_coord.x *= float(render_width);
    screen_coord.y *= float(render_height);

    screen_coord.x += float(render_x);
    screen_coord.y += float(render_y);

    screen_coord.x /= float(image_width);
    screen_coord.y /= float(image_height);

    screen_coord = screen_coord * 2.0 - 1.0;

    random_seed = snoise(vec3(screen_coord.x, screen_coord.y, sample_id));

    float camera_tan = tan(camera_field_of_view * 0.5);
    float camera_cos = cos(camera_field_of_view * 0.5);

    float focal_plan_u = camera_tan * camera_focal_distance;
    float focal_plan_v = focal_plan_u / image_aspect_ratio;
    vec3 focal_plan_pos = camera_origin + camera_dir * (camera_focal_distance  * camera_cos);

    float camera_plan_u = camera_tan * camera_near_plan;
    float camera_plan_v = camera_plan_u / image_aspect_ratio;
    vec3 camera_plan_pos = camera_origin + camera_dir * (camera_near_plan  * camera_cos);

    vec3 u = normalize(cross(camera_dir, vec3(0.0, 0.0, 1.0)));
    vec3 v = cross(u, camera_dir);

    float rbt = random() * 2.0 * MATH_PI;
    float rbr = sqrt(random());

    vec2 blur_offset = (camera_blur_factor * rbr) * vec2(cos(rbt), sin(rbt));

    vec3 ray_focal_passby = focal_plan_pos + (focal_plan_u * screen_coord.x) * u + (focal_plan_v * screen_coord.y) * v;
    vec3 ray_pos = camera_plan_pos + (camera_plan_u * (screen_coord.x + blur_offset.x)) * u + (camera_plan_v * (screen_coord.y + blur_offset.y * image_aspect_ratio)) * v;

    vec3 ray_dir = normalize(ray_focal_passby - ray_pos);
    vec3 ray_color = ray_launch(ray_pos, ray_dir);

    gl_FragColor = vec4(ray_color / nb_samples, 1.0);
}}

"""

    image_aspect_ratio = float(assignment.rendering.width) / float(assignment.rendering.height)

    return code_tmplt.format(
        image_width=assignment.rendering.width,
        image_height=assignment.rendering.height,
        image_aspect_ratio=image_aspect_ratio,

        render_width=assignment.width,
        render_height=assignment.height,
        render_x=assignment.x,
        render_y=assignment.y,

        camera_origin=utils.code_vec(scene.camera.look_from),
        camera_dir=utils.code_vec(scene.camera.direction),
        camera_field_of_view=float(scene.camera.field_of_view),
        camera_near_plan=float(scene.camera.near_plan),
        camera_focal_distance=float(scene.camera.focal_distance),
        camera_blur_factor=float(scene.camera.blur_factor)
    )


# ------------------------------------------------------------------------------ MAIN

def main(scene, assignment):
    glsl_code = ""

    glsl_code += glsl_header()
    glsl_code += glsl_global

    glsl_code += glsl_noise.glsl_code
    glsl_code += glsl_math.glsl_code
    glsl_code += material.glsl_code
    glsl_code += primitives.glsl_code

    glsl_code += glsl_intersect(scene)
    glsl_code += glsl_ray_launch
    glsl_code += glsl_main(scene, assignment)

    with open("shader.glsl", "w") as f:
        f.write(glsl_code)

    return glsl_code
