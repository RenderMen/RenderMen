import mongoengine

import utils
import material

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

int
intersect_plan(vec4 plan)
{
    float dot_normal = dot(ray_dir, plan.xyz);

    if (dot_normal > 0.0)
    {
        return 0;
    }

    float plan_distance = dot(ray_origin, plan.xyz) + plan.w;
    float distance = - plan_distance / dot_normal;

    if ((distance > MATH_EPSILON) && (distance < ray_intersection_dist))
    {
        ray_intersection_dist = distance;
        attr_pos = ray_origin + distance * ray_dir;
        attr_normal = plan.xyz;

        return 1;
    }

    return 0;
}

"""


# ------------------------------------------------------------------------------ ABSTRACT CLASS

class Abstract(mongoengine.Document):
    material = mongoengine.ReferenceField(material.Abstract, default=None)

    meta = {'allow_inheritance': True}

    def save(self, *args, **kwargs):
        if self.material:
            self.material.save()
        super(Abstract, self).save(*args, **kwargs)

    def material_code(self):
        if self.material is None:
            return "ray_color = 0.5 * attr_normal + 0.5;"

        return self.material.code()


    def intersect_call(self):
        assert False



# ------------------------------------------------------------------------------ SPHERE

class Sphere(Abstract):
    """
        center = vec3
        radius = float
    """

    center = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, 0.0, 0.0])
    radius = mongoengine.FloatField(default=1.0)

    @property
    def vec4(self):
        return [self.center[0], self.center[1], self.center[2], self.radius]

    def intersect_call(self):
        code_tmplt = "intersect_sphere({sphere})"

        return code_tmplt.format(
            sphere=utils.code_vec(self.vec4)
        )


# ------------------------------------------------------------------------------ PLAN

class Plan(Abstract):
    """
        normal = vec3
        distance = float
    """

    normal = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, 0.0, 1.0])
    distance = mongoengine.FloatField(default=0.0)

    @property
    def vec4(self):
        return [self.normal[0], self.normal[1], self.normal[2], self.distance]

    def intersect_call(self):
        code_tmplt = "intersect_plan({plan})"

        return code_tmplt.format(
            plan=utils.code_vec(self.vec4)
        )
