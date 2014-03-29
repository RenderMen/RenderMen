
import utils


# ------------------------------------------------------------------------------ GLSL SPHERE

glsl_code = """

int
intersect_sphere(vec4 sphere)
{
    vec3 oc = sphere.xyz - ray_origin;

    float b = dot(oc, ray_dir);
    float det = b * b - dot(oc, oc) + sphere.w * sphere.w;

    if (det <= 0.0)
    {
        return 0;
    }

    float distance = b - sqrt(det);

    if ((distance > MATH_EPSILON) && (distance < ray_intersection_dist))
    {
        attr_pos = ray_origin + distance * ray_dir;
        attr_normal = normalize(attr_pos - sphere.xyz);

        return 1;
    }

    return 0;
}

"""


# ------------------------------------------------------------------------------ ABSTRACT CLASS

class Abstract:

    def glsl(self):
        assert False


# ------------------------------------------------------------------------------ SPHERE CLASS

class Sphere(Abstract):
    """
        center = vec3
        radius = float
    """

    def __init__(self, center = [0.0, 0.0, 0.0], radius = 1.0):
        self.center = center
        self.radius = radius

    @property
    def vec4(self):
        return [self.center[0], self.center[1], self.center[2], self.radius]

    def glsl(self):
        code_tmplt = "intersect_sphere({sphere})"

        return code_tmplt.format(
            sphere=utils.code_vec(self.vec4)
        )
