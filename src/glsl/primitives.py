
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
        ray_intersection_dist = distance;
        attr_pos = ray_origin + distance * ray_dir;
        attr_normal = normalize(attr_pos - sphere.xyz);

        return 1;
    }

    return 0;
}

"""


# ------------------------------------------------------------------------------ ABSTRACT CLASS

class Abstract:

    def intersect_call(self):
        assert False

    def material_code(self):
        assert False


# ------------------------------------------------------------------------------ ABSTRACT MATERIAL CLASS

class AbstractMaterial:

    def __init__(self, material=None):
        self.material = material

    def material_code(self):
        if self.material == None:
            return "ray_color = 0.5 * attr_normal + 0.5;"

        return self.material.code()


# ------------------------------------------------------------------------------ SPHERE CLASS

class Sphere(AbstractMaterial):
    """
        center = vec3
        radius = float
    """

    def __init__(self, material=None, center=[0.0, 0.0, 0.0], radius=1.0):
        AbstractMaterial.__init__(self, material=material)

        self.center = center
        self.radius = radius

    @property
    def vec4(self):
        return [self.center[0], self.center[1], self.center[2], self.radius]

    def intersect_call(self):
        code_tmplt = "intersect_sphere({sphere})"

        return code_tmplt.format(
            sphere=utils.code_vec(self.vec4)
        )
